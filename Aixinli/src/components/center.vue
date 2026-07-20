<template>
  <div class="conversation-records">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <el-icon :size="26"><ChatDotRound /></el-icon>
          对话记录
        </h2>
        <p class="page-subtitle">浏览所有用户的 AI 心理健康助手对话历史</p>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-bar">
      <div class="filter-left">
        <el-select
          v-model="selectedUserId"
          placeholder="按用户筛选..."
          clearable
          filterable
          size="default"
          @change="handleUserChange"
          class="user-filter"
        >
          <el-option
            v-for="user in userList"
            :key="user.id"
            :label="user.username"
            :value="user.id"
          />
        </el-select>
        <el-button @click="resetFilter" class="reset-btn">
          <el-icon><Refresh /></el-icon>
          重置筛选
        </el-button>
      </div>
      <div class="filter-right">
        <span class="record-count">
          <span class="count-num">{{ total }}</span>
          <span class="count-label">条记录</span>
        </span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <span>加载对话记录中...</span>
    </div>

    <!-- 空状态 -->
    <div v-else-if="conversationList.length === 0" class="empty-state">
      <el-empty description="暂无对话记录">
        <template #image>
          <div class="empty-illustration">
            <el-icon :size="64"><ChatDotRound /></el-icon>
          </div>
        </template>
      </el-empty>
    </div>

    <!-- 对话列表 -->
    <div v-else class="conversation-list">
      <div
        v-for="record in conversationList"
        :key="record.id"
        class="conversation-card"
      >
        <!-- 对话头部 -->
        <div class="conv-header">
          <div class="conv-user">
            <div class="conv-avatar">
              {{ record.username?.charAt(0)?.toUpperCase() || 'U' }}
            </div>
            <div class="conv-user-meta">
              <span class="conv-username">{{ record.username || '未知用户' }}</span>
              <span v-if="record.email" class="conv-email">{{ record.email }}</span>
            </div>
          </div>
          <div class="conv-meta">
            <el-tag v-if="record.risk_flag === 1" type="danger" size="small" effect="dark" class="risk-tag">
              <el-icon><WarningFilled /></el-icon>
              需关注
            </el-tag>
            <span class="conv-id">#{{ record.id }}</span>
            <span class="conv-time">{{ formatTime(record.created_at) }}</span>
          </div>
        </div>

        <!-- 对话气泡 -->
        <div class="conv-bubbles">
          <!-- 用户提问 -->
          <div class="bubble-row user-row">
            <div class="bubble-avatar user-bubble-avatar">
              <el-icon :size="16"><User /></el-icon>
            </div>
            <div class="bubble-content user-bubble">
              <div class="bubble-label">用户提问</div>
              <div class="bubble-text">{{ record.user_message }}</div>
            </div>
          </div>

          <!-- AI 回复 -->
          <div class="bubble-row ai-row">
            <div class="bubble-avatar ai-bubble-avatar">
              <el-icon :size="16"><Service /></el-icon>
            </div>
            <div class="bubble-content ai-bubble">
              <div class="bubble-label">AI 回复</div>
              <div class="bubble-text markdown-body" v-html="renderMarkdown(record.ai_response)"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > 0" class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatDotRound, User, Service, Refresh, Loading, WarningFilled } from '@element-plus/icons-vue'
import { marked } from 'marked'
import { getAllChatHistory } from '../services/chatHistory'

marked.setOptions({ breaks: true, gfm: true })

const renderMarkdown = (text: string): string => {
  if (!text) return ''
  try {
    return marked.parse(text) as string
  } catch {
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
}
import { getUserList } from '../services/adminUser'
import type { ChatRecord } from '../services/chatHistory'
import type { UserData } from '../services/adminUser'

// 数据
const conversationList = ref<ChatRecord[]>([])
const userList = ref<UserData[]>([])
const loading = ref(false)
const selectedUserId = ref<number | null>(null)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 加载对话记录
const loadConversationRecords = async () => {
  loading.value = true
  try {
    const result = await getAllChatHistory({
      userId: selectedUserId.value || undefined,
      limit: pageSize.value,
      offset: (currentPage.value - 1) * pageSize.value
    })

    if (result.success) {
      conversationList.value = result.data.history
      total.value = result.data.total
    }
  } catch (error) {
    console.error('加载对话记录失败:', error)
    ElMessage.error('加载对话记录失败')
  } finally {
    loading.value = false
  }
}

// 加载用户列表
const loadUserList = async () => {
  try {
    const result = await getUserList({ pageSize: 100 })
    if (result.success) {
      userList.value = result.data.users
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
  }
}

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 筛选用户变化
const handleUserChange = () => {
  currentPage.value = 1
  loadConversationRecords()
}

// 重置筛选
const resetFilter = () => {
  selectedUserId.value = null
  currentPage.value = 1
  loadConversationRecords()
}

// 分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page
  loadConversationRecords()
}

// 每页条数变化
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadConversationRecords()
}

// 初始化
onMounted(() => {
  loadUserList()
  loadConversationRecords()
})
</script>

<style scoped lang="scss">
.conversation-records {
  width: 100%;
}

/* ==================== 页面头部 ==================== */
.page-header {
  margin-bottom: 24px;

  .header-left {
    .page-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 6px 0;
      font-size: 26px;
      font-weight: 700;
      color: #1e293b;
    }

    .page-subtitle {
      margin: 0 0 0 38px;
      font-size: 14px;
      color: #94a3b8;
    }
  }
}

/* ==================== 筛选栏 ==================== */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  margin-bottom: 20px;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 12px;

  .user-filter {
    width: 220px;
  }

  .reset-btn {
    border: 1px solid #e2e8f0;
    color: #64748b;
    transition: all 0.2s ease;

    &:hover {
      border-color: #6366f1;
      color: #6366f1;
      background: #f5f3ff;
    }
  }
}

.filter-right {
  .record-count {
    display: flex;
    align-items: baseline;
    gap: 4px;

    .count-num {
      font-size: 20px;
      font-weight: 800;
      color: #6366f1;
      font-variant-numeric: tabular-nums;
    }

    .count-label {
      font-size: 13px;
      color: #94a3b8;
      font-weight: 500;
    }
  }
}

/* ==================== 加载/空状态 ==================== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 0;
  color: #94a3b8;
  font-size: 14px;

  .loading-icon {
    font-size: 28px;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-state {
  padding: 60px 0;

  .empty-illustration {
    color: #cbd5e1;
  }
}

/* ==================== 对话列表 ==================== */
.conversation-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.conversation-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  transition: all 0.25s ease;

  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border-color: #e2e8f0;
  }
}

/* 对话头部 */
.conv-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fafbfc;
  border-bottom: 1px solid #f1f5f9;
}

.conv-user {
  display: flex;
  align-items: center;
  gap: 12px;

  .conv-avatar {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  }

  .conv-user-meta {
    display: flex;
    flex-direction: column;

    .conv-username {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
    }

    .conv-email {
      font-size: 12px;
      color: #94a3b8;
    }
  }
}

.conv-meta {
  display: flex;
  align-items: center;
  gap: 16px;

  .conv-id {
    font-size: 12px;
    color: #cbd5e1;
    font-weight: 600;
    font-family: 'SF Mono', 'Fira Code', monospace;
  }

  .conv-time {
    font-size: 12px;
    color: #94a3b8;
  }

  .risk-tag {
    font-weight: 600;
    .el-icon { margin-right: 2px; }
  }
}

/* 对话气泡 */
.conv-bubbles {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bubble-row {
  display: flex;
  gap: 12px;
  max-width: 90%;

  &.ai-row {
    align-self: flex-end;
    flex-direction: row-reverse;
  }
}

.bubble-avatar {
  width: 32px;
  height: 32px;
  min-width: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  align-self: flex-start;
  margin-top: 2px;
}

.user-bubble-avatar {
  background: #6366f1;
}

.ai-bubble-avatar {
  background: #8b5cf6;
}

.bubble-content {
  padding: 14px 18px;
  border-radius: 14px;
  position: relative;

  .bubble-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }

  .bubble-text {
    font-size: 14px;
    line-height: 1.7;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

.user-bubble {
  background: #f1f5f9;
  border-bottom-left-radius: 4px;

  .bubble-label {
    color: #6366f1;
  }

  .bubble-text {
    color: #334155;
  }
}

.ai-bubble {
  background: #f5f3ff;
  border-bottom-right-radius: 4px;

  .bubble-label {
    color: #8b5cf6;
  }

  .bubble-text {
    color: #1e293b;
  }
}

/* ==================== 分页 ==================== */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 28px 0;

  :deep(.el-pagination) {
    --el-pagination-bg-color: #f8fafc;

    .el-pager li {
      border-radius: 8px;
      margin: 0 3px;
      font-weight: 600;
      border: 1px solid #e2e8f0;
      transition: all 0.2s ease;

      &:hover {
        border-color: #6366f1;
        color: #6366f1;
      }

      &.is-active {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        border-color: transparent;
        color: #ffffff;
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
      }
    }

    .btn-prev,
    .btn-next {
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      background: #ffffff;

      &:hover {
        border-color: #6366f1;
        color: #6366f1;
      }
    }
  }
}

/* ==================== Markdown 渲染样式 ==================== */
.markdown-body {
  :deep(p) {
    margin: 0 0 6px;
    &:last-child { margin-bottom: 0; }
  }
  :deep(strong) { font-weight: 700; color: #0f172a; }
  :deep(em) { font-style: italic; }
  :deep(ul), :deep(ol) { margin: 4px 0 8px; padding-left: 20px; }
  :deep(li) { margin-bottom: 2px; &::marker { color: #6366f1; } }
  :deep(h1) { font-size: 20px; }
  :deep(h2) { font-size: 18px; }
  :deep(h3) { font-size: 16px; }
  :deep(h1), :deep(h2), :deep(h3), :deep(h4) { margin: 12px 0 6px; font-weight: 700; color: #1e293b; }
  :deep(code) { background: #f1f5f9; color: #e11d48; padding: 2px 6px; border-radius: 4px; font-size: 13px; font-family: monospace; }
  :deep(pre) { background: #1e293b; color: #e2e8f0; padding: 10px 14px; border-radius: 8px; overflow-x: auto; margin: 8px 0;
    code { background: none; color: inherit; padding: 0; font-size: 13px; }
  }
  :deep(blockquote) { border-left: 3px solid #6366f1; margin: 8px 0; padding: 4px 14px; background: #f5f3ff; border-radius: 0 6px 6px 0; color: #475569; }
  :deep(a) { color: #6366f1; text-decoration: underline; }
  :deep(hr) { border: none; border-top: 1px solid #e2e8f0; margin: 12px 0; }
  :deep(table) { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 13px;
    th, td { border: 1px solid #e2e8f0; padding: 6px 12px; text-align: left; }
    th { background: #f8fafc; font-weight: 600; }
  }
}
</style>
