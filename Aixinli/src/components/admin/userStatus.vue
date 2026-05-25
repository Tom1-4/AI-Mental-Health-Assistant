<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  User,
  Refresh,
  DataAnalysis,
  Clock,
  ChatDotRound,
  Collection,
  Document,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import type { UserStatus, MoodStats } from "../../services/userStatus";
import { getUserStatus } from "../../services/userStatus";
import { getPsychologicalAssessment } from "../../services/adminUser";

const loading = ref(false);
const userStatusList = ref<UserStatus[]>([]);
const stats = ref({
  totalUsers: 0,
  activeUsers: 0,
  moodStats: {
    happy: 0,
    sad: 0,
    anxious: 0,
    neutral: 0,
    other: 0,
  } as MoodStats,
});

// 心理评估相关
const assessmentDialogVisible = ref(false);
const assessmentLoading = ref(false);
const assessmentData = ref<{
  score: number;
  emotionStatus: string;
  suggestion: string;
  details: {
    chatCount: number;
    postCount: number;
    diaryCount: number;
    emotionCount: { positive: number; negative: number; neutral: number };
  };
} | null>(null);
const assessmentReport = ref("");
const currentAssessUser = ref<UserStatus | null>(null);

// 获取数据
const fetchData = async () => {
  loading.value = true;
  try {
    const response = await getUserStatus();
    if (response.success && response.data) {
      userStatusList.value = response.data.users;
      stats.value = response.data.stats;
    } else {
      throw new Error("获取数据失败");
    }
  } catch (error: any) {
    console.error("获取用户状态失败:", error);
    ElMessage.error("获取用户状态失败: " + (error.message || "未知错误"));
  } finally {
    loading.value = false;
  }
};

// 刷新
const handleRefresh = () => {
  fetchData();
};

// 查看心理评估
const handleViewAssessment = async (user: UserStatus) => {
  currentAssessUser.value = user;
  assessmentDialogVisible.value = true;
  assessmentLoading.value = true;
  assessmentReport.value = "";
  assessmentData.value = null;

  try {
    const response = await getPsychologicalAssessment(user.id);
    if (response.success) {
      assessmentReport.value = response.data.report;
      assessmentData.value = response.data;
    } else {
      ElMessage.error(response.message || "获取心理评估失败");
    }
  } catch (error: any) {
    console.error("获取心理评估失败:", error);
    ElMessage.error("获取心理评估失败");
  } finally {
    assessmentLoading.value = false;
  }
};

// 格式化时间
const formatTime = (dateString: string) => {
  if (!dateString) return "从未登录";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "刚刚";
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return date.toLocaleDateString("zh-CN");
};

// 获取心情图标
const getMoodIcon = (mood: string) => {
  const icons: Record<string, string> = {
    happy: "😄",
    sad: "😢",
    anxious: "😰",
    angry: "😠",
    neutral: "😐",
    excited: "🤩",
    tired: "😴",
    calm: "😌",
  };
  return icons[mood] || "😐";
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="user-status">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">
        <el-icon :size="24"><User /></el-icon>
        用户状态
      </h2>
      <el-button type="primary" :icon="Refresh" @click="handleRefresh">
        刷新
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card stat-primary">
        <div class="stat-icon">
          <el-icon :size="28"><User /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalUsers }}</div>
          <div class="stat-label">总用户数</div>
        </div>
      </div>
      <div class="stat-card stat-success">
        <div class="stat-icon">
          <el-icon :size="28"><Clock /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.activeUsers }}</div>
          <div class="stat-label">本周活跃</div>
        </div>
      </div>
      <div class="stat-card stat-grid">
        <div class="mood-item">
          <span class="mood-emoji">😄</span>
          <span class="mood-count">{{ stats.moodStats.happy }}</span>
          <span class="mood-label">开心</span>
        </div>
        <div class="mood-item">
          <span class="mood-emoji">😢</span>
          <span class="mood-count">{{ stats.moodStats.sad }}</span>
          <span class="mood-label">伤心</span>
        </div>
        <div class="mood-item">
          <span class="mood-emoji">😰</span>
          <span class="mood-count">{{ stats.moodStats.anxious }}</span>
          <span class="mood-label">焦虑</span>
        </div>
        <div class="mood-item">
          <span class="mood-emoji">😐</span>
          <span class="mood-count">{{ stats.moodStats.neutral }}</span>
          <span class="mood-label">平静</span>
        </div>
      </div>
    </div>

    <!-- 用户列表 -->
    <div class="user-grid" v-loading="loading">
      <div v-for="user in userStatusList" :key="user.id" class="user-card">
        <div class="user-header">
          <el-avatar :size="60" :src="user.avatar" class="user-avatar">
            {{ user.username.slice(0, 1) }}
          </el-avatar>
          <div class="user-info">
            <div class="username">{{ user.username }}</div>
            <div class="login-time">
              <el-icon><Clock /></el-icon>
              {{ formatTime(user.lastLoginTime) }}
            </div>
          </div>
        </div>

        <div class="mood-display">
          <span class="mood-emoji-large">{{
            getMoodIcon(user.latestMood)
          }}</span>
          <span class="mood-text" :style="{ color: user.moodColor }">
            {{ user.moodLabel }}
          </span>
        </div>

        <div class="user-stats">
          <div class="stat-item">
            <el-icon><ChatDotRound /></el-icon>
            <span>{{ user.chatCount }}</span>
          </div>
          <div class="stat-item">
            <el-icon><Collection /></el-icon>
            <span>{{ user.postCount }}</span>
          </div>
          <div class="stat-item">
            <el-icon><Document /></el-icon>
            <span>{{ user.diaryCount }}</span>
          </div>
        </div>

        <div class="user-actions">
          <el-button
            type="primary"
            size="small"
            :icon="DataAnalysis"
            @click="handleViewAssessment(user)"
          >
            心理评估
          </el-button>
        </div>
      </div>
    </div>

    <!-- 心理评估对话框 -->
    <el-dialog
      v-model="assessmentDialogVisible"
      title="心理健康评估报告"
      width="600px"
      :close-on-click-modal="false"
    >
      <div v-loading="assessmentLoading">
        <div v-if="assessmentData" class="assessment-content">
          <div class="user-info-header">
            <el-avatar :size="50" :src="currentAssessUser?.avatar">
              {{ currentAssessUser?.username?.slice(0, 1) }}
            </el-avatar>
            <div>
              <div class="assessment-username">
                {{ currentAssessUser?.username }}
              </div>
              <div
                class="assessment-mood"
                :style="{ color: currentAssessUser?.moodColor }"
              >
                当前心情：{{ currentAssessUser?.moodLabel }}
              </div>
            </div>
          </div>

          <div class="score-section">
            <div
              class="score-circle"
              :style="{
                borderColor: assessmentData.score >= 50 ? '#67C23A' : '#F56C6C',
              }"
            >
              <span
                class="score-value"
                :style="{
                  color: assessmentData.score >= 50 ? '#67C23A' : '#F56C6C',
                }"
              >
                {{ assessmentData.score }}
              </span>
              <span class="score-label">/ 100</span>
            </div>
            <el-tag
              :type="assessmentData.score >= 50 ? 'success' : 'warning'"
              size="large"
            >
              {{ assessmentData.emotionStatus }}
            </el-tag>
          </div>

          <div class="stats-row">
            <div class="stat-box">
              <el-icon><ChatDotRound /></el-icon>
              <span>对话 {{ assessmentData.details.chatCount }} 条</span>
            </div>
            <div class="stat-box">
              <el-icon><Collection /></el-icon>
              <span>发言 {{ assessmentData.details.postCount }} 条</span>
            </div>
            <div class="stat-box">
              <el-icon><Document /></el-icon>
              <span>日记 {{ assessmentData.details.diaryCount }} 篇</span>
            </div>
          </div>

          <div class="suggestion-box">
            <h4>建议</h4>
            <p>{{ assessmentData.suggestion }}</p>
          </div>

          <div class="report-box">
            <pre>{{ assessmentReport }}</pre>
          </div>
        </div>
        <el-empty v-else description="暂无评估数据" />
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.user-status {
  width: 100%;
  animation: fadeIn 0.3s ease-in-out;
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

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e5e7eb;

  .page-title {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0;
    font-size: 26px;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;

  .stat-card {
    background: #fff;
    border-radius: 16px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);

    &.stat-primary .stat-icon {
      background: linear-gradient(135deg, #667eea, #764ba2);
    }
    &.stat-success .stat-icon {
      background: linear-gradient(135deg, #43e97b, #38f9d7);
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }

    .stat-info {
      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: #1e293b;
      }
      .stat-label {
        font-size: 14px;
        color: #64748b;
      }
    }

    &.stat-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;

      .mood-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 12px;
        background: #f8fafc;
        border-radius: 12px;

        .mood-emoji {
          font-size: 24px;
        }
        .mood-count {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
        }
        .mood-label {
          font-size: 12px;
          color: #64748b;
        }
      }
    }
  }
}

.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;

  .user-card {
    background: #fff;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }

    .user-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;

      .user-info {
        flex: 1;
        .username {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }
        .login-time {
          font-size: 12px;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }
    }

    .mood-display {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 12px;
      margin-bottom: 16px;

      .mood-emoji-large {
        font-size: 36px;
      }
      .mood-text {
        font-size: 18px;
        font-weight: 600;
      }
    }

    .user-stats {
      display: flex;
      justify-content: space-around;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f1f5f9;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #64748b;
        font-size: 14px;
      }
    }

    .user-actions {
      display: flex;
      justify-content: center;
    }
  }
}

.assessment-content {
  .user-info-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 12px;

    .assessment-username {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
    }
    .assessment-mood {
      font-size: 14px;
    }
  }

  .score-section {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    margin-bottom: 20px;

    .score-circle {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      border: 6px solid;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .score-value {
        font-size: 32px;
        font-weight: 700;
      }
      .score-label {
        font-size: 14px;
        color: #909399;
      }
    }
  }

  .stats-row {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-bottom: 20px;

    .stat-box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: #f5f7fa;
      border-radius: 8px;
      color: #606266;
    }
  }

  .suggestion-box {
    padding: 16px;
    background: #fdf6ec;
    border-radius: 8px;
    margin-bottom: 16px;

    h4 {
      margin: 0 0 12px;
      color: #e6a23c;
    }
    p {
      margin: 0;
      color: #606266;
      line-height: 1.6;
    }
  }

  .report-box {
    background: #f5f7fa;
    border-radius: 8px;
    padding: 16px;
    max-height: 300px;
    overflow-y: auto;

    pre {
      margin: 0;
      white-space: pre-wrap;
      font-size: 13px;
      line-height: 1.8;
    }
  }
}
</style>
