<template>
  <div class="conversation-records">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><ChatDotRound /></el-icon>
        <span>对话记录</span>
      </h2>
      <p class="page-desc">查看所有用户的AI心理健康助手对话记录</p>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <el-select
        v-model="selectedUserId"
        placeholder="按用户筛选"
        clearable
        filterable
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
      <el-button @click="resetFilter">
        <el-icon><Refresh /></el-icon>
        重置筛选
      </el-button>
      <span class="total-count">共 {{ total }} 条记录</span>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <!-- 无数据提示 -->
    <el-empty v-else-if="conversationList.length === 0" description="暂无对话记录" />

    <!-- 对话记录列表 -->
    <div v-else class="conversation-list">
      <div
        v-for="(record, index) in conversationList"
        :key="record.id"
        class="conversation-item"
      >
        <!-- 用户信息头部 -->
        <div class="conversation-header">
          <div class="user-info">
            <el-avatar :size="32" class="user-avatar">
              {{ record.username?.charAt(0).toUpperCase() || 'U' }}
            </el-avatar>
            <div class="user-details">
              <span class="username">{{ record.username || '未知用户' }}</span>
              <span class="email">{{ record.email || '' }}</span>
            </div>
          </div>
          <span class="conversation-time">{{ formatTime(record.created_at) }}</span>
        </div>

        <!-- 一问一答内容 -->
        <div class="qa-pair">
          <!-- 用户提问 -->
          <div class="question">
            <div class="qa-label">
              <el-icon><User /></el-icon>
              <span>用户提问</span>
            </div>
            <div class="qa-content">{{ record.user_message }}</div>
          </div>

          <!-- AI回复 -->
          <div class="answer">
            <div class="qa-label ai-label">
              <el-icon><Service /></el-icon>
              <span>AI回复</span>
            </div>
            <div class="qa-content ai-content">{{ record.ai_response }}</div>
          </div>
        </div>

        <!-- 分隔线 -->
        <div v-if="index < conversationList.length - 1" class="item-divider" />
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > 0" class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatDotRound, User, Service, Refresh, Loading } from '@element-plus/icons-vue'
import { getAllChatHistory } from '../services/chatHistory'
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
  padding: 0;
}

.page-header {
  margin-bottom: 24px;

  .page-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 24px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 8px 0;
  }

  .page-desc {
    color: #64748b;
    font-size: 14px;
    margin: 0;
  }
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;

  .user-filter {
    width: 200px;
  }

  .total-count {
    margin-left: auto;
    color: #64748b;
    font-size: 14px;
  }
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 60px 0;
  color: #64748b;
  font-size: 14px;
}

.conversation-list {
  background: #ffffff;
  border-radius: 16px 16px 0 0;
}

.conversation-item {
  padding: 20px 24px;

  .conversation-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .user-avatar {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        font-size: 14px;
        font-weight: 600;
      }

      .user-details {
        display: flex;
        flex-direction: column;

        .username {
          font-weight: 600;
          color: #1e293b;
          font-size: 14px;
        }

        .email {
          font-size: 12px;
          color: #94a3b8;
        }
      }
    }

    .conversation-time {
      font-size: 12px;
      color: #94a3b8;
    }
  }

  .qa-pair {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .question,
  .answer {
    border-radius: 12px;
    overflow: hidden;
  }

  .question {
    background: #f1f5f9;
    border-left: 3px solid #3b82f6;
  }

  .answer {
    background: #faf5ff;
    border-left: 3px solid #8b5cf6;
  }

  .qa-label {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    background: rgba(0, 0, 0, 0.03);

    &.ai-label {
      color: #7c3aed;
    }
  }

  .qa-content {
    padding: 12px 16px;
    font-size: 14px;
    line-height: 1.6;
    color: #334155;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .ai-content {
    color: #1e293b;
  }

  .item-divider {
    height: 1px;
    background: #e2e8f0;
    margin-top: 20px;
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: 24px;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  border-radius: 0 0 16px 16px;
}
</style>
