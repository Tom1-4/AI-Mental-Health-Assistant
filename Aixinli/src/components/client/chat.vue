<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from "vue";
import { ArrowLeft, ChatDotRound, Sunny, Moon, WarningFilled } from "@element-plus/icons-vue";
import { marked } from "marked";

// 配置 marked 安全选项
marked.setOptions({
  breaks: true,        // 单个换行符转换为 <br>
  gfm: true,           // 启用 GitHub Flavored Markdown
});
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { storeToRefs } from "pinia";
import { ElMessage } from "element-plus";
import { useThemeStyle } from "../../composables/useThemeStyle";

const defaultAvatar = "/default.jpeg";

const router = useRouter();
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const { isDark, containerStyle, toggleTheme } = useThemeStyle('soft');

// 用户头像 - 如果用户有自定义头像则显示，否则显示默认头像
const userAvatarUrl = computed(() => {
  return user.value?.avatar || defaultAvatar;
});

const inputMessage = ref("");
const chatHistory = ref<
  Array<{ role: "user" | "assistant"; content: string; time: string }>
>([]);
const isTyping = ref(false);
const chatContent = ref<HTMLElement | null>(null);
const isLoadingHistory = ref(true);

// 危机干预
const showCrisisBanner = ref(false);
const crisisHotlines = ref<Array<{ name: string; number: string; desc: string }>>([]);
const toggleCrisisBanner = () => {
  showCrisisBanner.value = !showCrisisBanner.value;
  if (showCrisisBanner.value && crisisHotlines.value.length === 0) {
    crisisHotlines.value = [
      { name: '希望24热线', number: '400-161-9995', desc: '24小时心理危机干预' },
      { name: '北京心理危机干预中心', number: '010-82951332', desc: '专业危机干预' },
      { name: '全国心理援助热线', number: '12320', desc: '国家卫生健康热线' },
    ];
  }
};

let activeChatController: AbortController | null = null;

// Markdown 渲染
const renderMarkdown = (text: string): string => {
  if (!text) return "";
  try {
    return marked.parse(text) as string;
  } catch {
    return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
};

// 初始欢迎消息
const showWelcomeMessage = () => {
  chatHistory.value = [
    {
      role: "assistant",
      content:
        "你好！我是你的 AI 心理健康助手。无论你遇到什么困扰，都可以向我倾诉。我会倾听你的故事，给你提供支持和建议。\n\n我们可以聊聊：\n• 情绪管理\n• 压力缓解\n• 人际关系\n• 自我成长\n• 或者任何你想说的事情\n\n请随时告诉我你现在的感受吧！",
      time: new Date().toLocaleTimeString(),
    },
  ];
};

// 获取对话历史
const fetchChatHistory = async () => {
  try {
    isLoadingHistory.value = true;
    const currentToken = localStorage.getItem("token");

    if (!currentToken) {
      ElMessage.warning("请先登录后再使用聊天功能");
      router.push("/");
      return;
    }

    const response = await fetch(`http://localhost:3000/api/ai/history`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    });

    if (response.status === 401) {
      ElMessage.warning("登录已过期，请重新登录");
      authStore.logout();
      router.push("/");
      return;
    }

    const data = await response.json();

    if (data.success && data.data.history) {
      // 将历史记录转换为聊天格式
      const historyMessages: Array<{
        role: "user" | "assistant";
        content: string;
        time: string;
      }> = [];

      data.data.history.forEach((item: any) => {
        historyMessages.push({
          role: "user",
          content: item.user_message,
          time: new Date(item.created_at).toLocaleTimeString(),
        });
        historyMessages.push({
          role: "assistant",
          content: item.ai_response,
          time: new Date(item.created_at).toLocaleTimeString(),
        });
      });

      chatHistory.value = historyMessages;
    }
  } catch (error) {
    console.error("获取对话历史失败:", error);
  } finally {
    isLoadingHistory.value = false;
    // 如果没有历史记录，显示欢迎消息
    if (chatHistory.value.length === 0) {
      showWelcomeMessage();
    }
  }
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (chatContent.value) {
      chatContent.value.scrollTop = chatContent.value.scrollHeight;
    }
  });
};

// 发送消息（流式响应）
const sendMessage = async () => {
  if (!inputMessage.value.trim() || isTyping.value) return;

  const userMessage = inputMessage.value;

  // 添加用户消息
  chatHistory.value.push({
    role: "user",
    content: userMessage,
    time: new Date().toLocaleTimeString(),
  });

  inputMessage.value = "";
  isTyping.value = true;

  // 添加一个空的AI消息占位符，用于流式显示
  const aiMessageIndex = chatHistory.value.length;
  chatHistory.value.push({
    role: "assistant",
    content: "",
    time: new Date().toLocaleTimeString(),
  });

  let fullResponse = "";
  const chatController = new AbortController();
  activeChatController = chatController;

  const handleSseEvent = (eventText: string) => {
    const dataLines = eventText
      .split("\n")
      .map((line) => line.replace(/\r$/, ""))
      .filter((line) => line.startsWith("data: "));

    if (dataLines.length === 0) return;

    const data = dataLines.map((line) => line.slice(6)).join("\n");

    try {
      const parsedData = JSON.parse(data);

      if (parsedData.content) {
        fullResponse += parsedData.content;
        chatHistory.value[aiMessageIndex].content = fullResponse;
        scrollToBottom();
      }

      if (parsedData.done) {
        chatHistory.value[aiMessageIndex].content =
          parsedData.fullResponse || fullResponse;
        scrollToBottom();
      }

      if (parsedData.type === 'crisis_alert') {
        showCrisisBanner.value = true;
        crisisHotlines.value = parsedData.hotlines || [
          { name: '希望24热线', number: '400-161-9995', desc: '24小时心理危机干预' },
          { name: '北京心理危机干预中心', number: '010-82951332', desc: '专业危机干预' },
          { name: '全国心理援助热线', number: '12320', desc: '国家卫生健康热线' },
        ];
        scrollToBottom();
      }

      if (parsedData.error) {
        ElMessage.error(parsedData.error);
        chatHistory.value[aiMessageIndex].content =
          "抱歉，AI服务暂时不可用，请稍后再试。";
        scrollToBottom();
      }
    } catch (error) {
      console.warn("解析 SSE 事件失败:", error);
    }
  };

  try {
    // 确保使用最新的token
    const currentToken = localStorage.getItem("token");

    if (!currentToken) {
      ElMessage.warning("请先登录后再发送消息");
      router.push("/");
      return;
    }

    const response = await fetch("http://localhost:3000/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentToken}`,
      },
      signal: chatController.signal,
      body: JSON.stringify({
        message: userMessage,
        conversationHistory: chatHistory.value
          .slice(0, aiMessageIndex)
          .map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
      }),
    });

    if (response.status === 401) {
      ElMessage.warning("登录已过期，请重新登录");
      authStore.logout();
      router.push("/");
      return;
    }

    if (!response.ok) {
      throw new Error("请求失败");
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/event-stream")) {
      throw new Error("服务端未返回 SSE 流");
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("无法读取响应流");
    }

    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        if (buffer.trim()) {
          handleSseEvent(buffer);
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const eventText of events) {
        handleSseEvent(eventText);
      }
    }
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      return;
    }
    console.error("发送消息失败:", error);
    ElMessage.error("发送消息失败，请稍后重试");
    chatHistory.value[aiMessageIndex].content = "抱歉，网络连接出现问题。";
  } finally {
    isTyping.value = false;
    activeChatController = null;
    scrollToBottom();
  }
};

const goBack = () => {
  router.push("/home");
};

// 组件挂载时加载对话历史
onMounted(() => {
  authStore.initAuth();
  fetchChatHistory();
});

const stopChatStream = () => {
  activeChatController?.abort();
};
</script>

<template>
  <div class="chat-container" :style="containerStyle">
    <div class="chat-header">
      <el-button text @click="goBack" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h2 class="chat-title">AI 心理健康助手</h2>
      <div class="header-actions">
        <el-button
          type="danger"
          size="small"
          plain
          @click="toggleCrisisBanner"
          class="crisis-help-btn"
        >
          <el-icon><WarningFilled /></el-icon>
          危机帮助
        </el-button>
        <div class="theme-toggle" @click="toggleTheme">
          <el-icon :size="20" class="toggle-icon">
            <Sunny v-if="isDark" />
            <Moon v-else />
          </el-icon>
        </div>
      </div>
    </div>

    <!-- 危机干预横幅 -->
    <div v-if="showCrisisBanner" class="crisis-banner">
      <div class="crisis-banner-header">
        <el-icon :size="20"><WarningFilled /></el-icon>
        <span>如果你正在经历心理危机，请立即拨打求助热线</span>
        <el-button text @click="showCrisisBanner = false" class="crisis-close">✕</el-button>
      </div>
      <div class="crisis-hotlines">
        <div v-for="hotline in crisisHotlines" :key="hotline.number" class="hotline-card">
          <div class="hotline-name">{{ hotline.name }}</div>
          <div class="hotline-number">{{ hotline.number }}</div>
          <div class="hotline-desc">{{ hotline.desc }}</div>
        </div>
      </div>
    </div>

    <div class="chat-content" ref="chatContent">
      <!-- 加载中提示 -->
      <div v-if="isLoadingHistory" class="loading-tip">
        <el-icon class="is-loading" :size="20"><ChatDotRound /></el-icon>
        <span>加载对话历史中...</span>
      </div>

      <!-- 空状态提示 -->
      <div
        v-if="!isLoadingHistory && chatHistory.length === 0"
        class="empty-tip"
      >
        <el-icon :size="48"><ChatDotRound /></el-icon>
        <p>开始一段新的对话吧！</p>
      </div>

      <div
        v-for="(message, index) in chatHistory"
        :key="index"
        :class="['message', message.role]"
      >
        <div class="message-avatar">
          <img
            v-if="message.role === 'user'"
            :src="userAvatarUrl"
            alt="用户头像"
            class="avatar-image"
          />
          <el-icon v-else :size="24">
            <ChatDotRound />
          </el-icon>
        </div>
        <div class="message-body">
          <div
            v-if="message.role === 'assistant'"
            class="message-content markdown-body"
            v-html="renderMarkdown(message.content)"
          ></div>
          <div v-else class="message-content">{{ message.content }}</div>
          <div class="message-time">{{ message.time }}</div>
        </div>
      </div>

      <div v-if="isTyping" class="message assistant">
        <div class="message-avatar">
          <el-icon :size="24">
            <ChatDotRound />
          </el-icon>
        </div>
        <div class="message-body">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-input">
      <el-input
        v-model="inputMessage"
        type="textarea"
        :rows="3"
        placeholder="输入你的问题或想法..."
        @keyup.enter.ctrl="sendMessage"
      />
      <el-button
        type="primary"
        @click="isTyping ? stopChatStream() : sendMessage()"
        :disabled="!inputMessage.trim() && !isTyping"
      >
        {{ isTyping ? "停止" : "发送" }}
      </el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .back-btn {
    color: #ffffff;
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .chat-title {
    margin: 0;
    color: #ffffff;
    font-size: 20px;
    font-weight: 600;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .theme-toggle {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }

    .toggle-icon {
      color: #ffffff;
    }
  }

  .crisis-help-btn {
    border-color: rgba(255, 255, 255, 0.6) !important;
    color: #ffffff !important;
    background: rgba(255, 255, 255, 0.1) !important;
    font-size: 13px;

    &:hover {
      background: rgba(255, 255, 255, 0.25) !important;
      border-color: #ffffff !important;
    }
  }
}

/* 危机干预横幅 */
.crisis-banner {
  background: linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%);
  border: 1px solid #fecaca;
  border-width: 1px 0;
  padding: 16px 24px;

  .crisis-banner-header {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #dc2626;
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 14px;

    .crisis-close {
      margin-left: auto;
      color: #94a3b8;
      font-size: 16px;
      padding: 2px 6px;

      &:hover {
        color: #dc2626;
      }
    }
  }

  .crisis-hotlines {
    display: flex;
    gap: 12px;

    .hotline-card {
      flex: 1;
      background: #ffffff;
      border-radius: 10px;
      padding: 12px 16px;
      text-align: center;
      border: 1px solid #fee2e2;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

      .hotline-name {
        font-size: 12px;
        color: #64748b;
        margin-bottom: 4px;
      }

      .hotline-number {
        font-size: 18px;
        font-weight: 800;
        color: #dc2626;
        margin-bottom: 2px;
        letter-spacing: 0.5px;
      }

      .hotline-desc {
        font-size: 11px;
        color: #94a3b8;
      }
    }
  }
}

.chat-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  .loading-tip,
  .empty-tip {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #94a3b8;
    font-size: 14px;
  }

  .empty-tip {
    padding: 60px 20px;

    p {
      margin: 0;
      font-size: 16px;
    }
  }
}

.message {
  display: flex;
  gap: 12px;
  animation: fadeIn 0.3s ease-out;

  &.user {
    flex-direction: row-reverse;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  flex-shrink: 0;
  overflow: hidden;

  .user & {
    background: transparent;
  }

  .avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border: 2px solid rgba(102, 126, 234, 0.3);
  }
}

.message-body {
  max-width: 60%;
  display: flex;
  flex-direction: column;
  gap: 6px;

  .user & {
    align-items: flex-end;
  }
}

.message-content {
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 15px;
  line-height: 1.6;
  word-wrap: break-word;

  .assistant & {
    background: #ffffff;
    color: #1e293b;
    border-bottom-left-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .user & {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #ffffff;
    border-bottom-right-radius: 4px;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  }
}

.message-time {
  font-size: 12px;
  color: #94a3b8;
  padding: 0 4px;
}

/* ==================== Markdown 渲染样式 ==================== */
.markdown-body {
  :deep(p) {
    margin: 0 0 8px;
    &:last-child { margin-bottom: 0; }
  }

  :deep(strong) {
    font-weight: 700;
    color: #0f172a;
  }

  :deep(em) {
    font-style: italic;
  }

  :deep(ul), :deep(ol) {
    margin: 4px 0 8px;
    padding-left: 20px;
  }

  :deep(li) {
    margin-bottom: 2px;
    &::marker { color: #6366f1; }
  }

  :deep(h1), :deep(h2), :deep(h3), :deep(h4) {
    margin: 12px 0 6px;
    font-weight: 700;
    line-height: 1.3;
    color: #1e293b;
  }

  :deep(h1) { font-size: 20px; }
  :deep(h2) { font-size: 18px; }
  :deep(h3) { font-size: 16px; }
  :deep(h4) { font-size: 15px; }

  :deep(code) {
    background: #f1f5f9;
    color: #e11d48;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
    font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  }

  :deep(pre) {
    background: #1e293b;
    color: #e2e8f0;
    padding: 12px 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 8px 0;

    code {
      background: none;
      color: inherit;
      padding: 0;
      font-size: 13px;
    }
  }

  :deep(blockquote) {
    border-left: 3px solid #6366f1;
    margin: 8px 0;
    padding: 4px 14px;
    background: #f5f3ff;
    border-radius: 0 6px 6px 0;
    color: #475569;
  }

  :deep(a) {
    color: #6366f1;
    text-decoration: underline;
    &:hover { color: #4f46e5; }
  }

  :deep(hr) {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 12px 0;
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0;
    font-size: 13px;

    th, td {
      border: 1px solid #e2e8f0;
      padding: 6px 12px;
      text-align: left;
    }

    th {
      background: #f8fafc;
      font-weight: 600;
    }
  }
}

.typing-indicator {
  display: flex;
  gap: 6px;
  padding: 16px;

  span {
    width: 8px;
    height: 8px;
    background: #667eea;
    border-radius: 50%;
    animation: typing 1.4s infinite ease-in-out;

    &:nth-child(1) {
      animation-delay: 0s;
    }

    &:nth-child(2) {
      animation-delay: 0.2s;
    }

    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes typing {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.6;
  }
  30% {
    transform: translateY(-8px);
    opacity: 1;
  }
}

.chat-input {
  display: flex;
  gap: 12px;
  padding: 24px;
  background: #ffffff;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);

  .el-input {
    flex: 1;
  }

  .el-button {
    height: auto;
    padding: 0 32px;
  }
}
</style>
