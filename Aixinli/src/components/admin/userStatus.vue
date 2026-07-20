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

// 获取心情图标和标签
const moodConfig: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  happy:    { icon: "😄", label: "开心", color: "#16a34a", bg: "#f0fdf4" },
  sad:      { icon: "😢", label: "伤心", color: "#2563eb", bg: "#eff6ff" },
  anxious:  { icon: "😰", label: "焦虑", color: "#ea580c", bg: "#fff7ed" },
  angry:    { icon: "😠", label: "生气", color: "#dc2626", bg: "#fef2f2" },
  neutral:  { icon: "😐", label: "平静", color: "#64748b", bg: "#f8fafc" },
  excited:  { icon: "🤩", label: "兴奋", color: "#ca8a04", bg: "#fefce8" },
  tired:    { icon: "😴", label: "疲惫", color: "#7c3aed", bg: "#f5f3ff" },
  calm:     { icon: "😌", label: "放松", color: "#0891b2", bg: "#ecfeff" },
};

const getMoodConfig = (mood: string) => {
  return moodConfig[mood] || { icon: "😐", label: "未知", color: "#94a3b8", bg: "#f8fafc" };
};

// 用户头像颜色
const avatarColors = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];
const getAvatarColor = (username: string) => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

// 得分评级
const getScoreLevel = (score: number) => {
  if (score >= 80) return { text: '良好', color: '#22c55e', bg: '#f0fdf4' };
  if (score >= 60) return { text: '一般', color: '#eab308', bg: '#fefce8' };
  if (score >= 40) return { text: '需关注', color: '#f97316', bg: '#fff7ed' };
  return { text: '亟需关注', color: '#dc2626', bg: '#fef2f2' };
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="user-status">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <el-icon :size="26"><User /></el-icon>
          用户状态
        </h2>
        <p class="page-subtitle">查看用户活跃状态与心理健康概况</p>
      </div>
      <el-button type="primary" :icon="Refresh" @click="handleRefresh">
        刷新数据
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card primary">
        <div class="stat-icon-wrap">
          <el-icon :size="22"><User /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-number">{{ stats.totalUsers }}</div>
          <div class="stat-desc">总用户数</div>
        </div>
      </div>

      <div class="stat-card success">
        <div class="stat-icon-wrap">
          <el-icon :size="22"><Clock /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-number">{{ stats.activeUsers }}</div>
          <div class="stat-desc">本周活跃</div>
        </div>
      </div>

      <!-- 心情速览 -->
      <div class="stat-card mood-overview">
        <div class="mood-mini-grid">
          <div class="mood-mini-item">
            <span class="mood-mini-emoji">😄</span>
            <span class="mood-mini-count">{{ stats.moodStats.happy }}</span>
          </div>
          <div class="mood-mini-item">
            <span class="mood-mini-emoji">😢</span>
            <span class="mood-mini-count">{{ stats.moodStats.sad }}</span>
          </div>
          <div class="mood-mini-item">
            <span class="mood-mini-emoji">😰</span>
            <span class="mood-mini-count">{{ stats.moodStats.anxious }}</span>
          </div>
          <div class="mood-mini-item">
            <span class="mood-mini-emoji">😐</span>
            <span class="mood-mini-count">{{ stats.moodStats.neutral }}</span>
          </div>
        </div>
        <div class="mood-label-row">用户心情分布</div>
      </div>
    </div>

    <!-- 用户卡片网格 -->
    <div class="user-grid" v-loading="loading" element-loading-text="加载中...">
      <div
        v-for="user in userStatusList"
        :key="user.id"
        class="user-card"
      >
        <!-- 卡片装饰条 -->
        <div class="card-accent" :style="{ background: getAvatarColor(user.username) }"></div>

        <!-- 用户头部 -->
        <div class="card-header">
          <div
            class="card-avatar"
            :style="{ background: getAvatarColor(user.username) }"
          >
            <img v-if="user.avatar" :src="user.avatar" class="avatar-img" />
            <span v-else class="avatar-text">{{ user.username?.slice(0, 1)?.toUpperCase() || 'U' }}</span>
          </div>
          <div class="card-user-info">
            <div class="card-username">{{ user.username }}</div>
            <div class="card-login">
              <el-icon><Clock /></el-icon>
              {{ formatTime(user.lastLoginTime) }}
            </div>
          </div>
        </div>

        <!-- 心情展示 -->
        <div
          class="card-mood"
          :style="{
            background: getMoodConfig(user.latestMood).bg,
            color: getMoodConfig(user.latestMood).color,
          }"
        >
          <span class="mood-emoji-lg">{{ getMoodConfig(user.latestMood).icon }}</span>
          <span class="mood-label-lg">{{ getMoodConfig(user.latestMood).label }}</span>
        </div>

        <!-- 活动统计 -->
        <div class="card-stats">
          <div class="card-stat">
            <el-icon><ChatDotRound /></el-icon>
            <span class="card-stat-val">{{ user.chatCount }}</span>
            <span class="card-stat-label">对话</span>
          </div>
          <div class="card-stat">
            <el-icon><Collection /></el-icon>
            <span class="card-stat-val">{{ user.postCount }}</span>
            <span class="card-stat-label">发言</span>
          </div>
          <div class="card-stat">
            <el-icon><Document /></el-icon>
            <span class="card-stat-val">{{ user.diaryCount }}</span>
            <span class="card-stat-label">日记</span>
          </div>
        </div>

        <!-- 操作 -->
        <div class="card-action">
          <el-button
            type="primary"
            size="small"
            :icon="DataAnalysis"
            plain
            round
            @click="handleViewAssessment(user)"
            class="assess-btn"
          >
            心理评估
          </el-button>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty v-if="!loading && userStatusList.length === 0" description="暂无用户数据" class="empty-state" />
    </div>

    <!-- 心理评估对话框 -->
    <el-dialog
      v-model="assessmentDialogVisible"
      title="心理健康评估报告"
      width="640px"
      :close-on-click-modal="false"
      :destroy-on-close="true"
      class="assessment-dialog"
    >
      <div v-loading="assessmentLoading" element-loading-text="正在生成评估报告...">
        <div v-if="assessmentData" class="assessment-content">
          <!-- 用户信息 -->
          <div class="assess-user-banner">
            <div
              class="assess-avatar"
              :style="{ background: currentAssessUser ? getAvatarColor(currentAssessUser.username) : '#6366f1' }"
            >
              <img v-if="currentAssessUser?.avatar" :src="currentAssessUser.avatar" />
              <span v-else>{{ currentAssessUser?.username?.slice(0, 1)?.toUpperCase() || 'U' }}</span>
            </div>
            <div class="assess-user-meta">
              <div class="assess-username">{{ currentAssessUser?.username }}</div>
              <div class="assess-mood" :style="{ color: getMoodConfig(currentAssessUser?.latestMood || '').color }">
                {{ getMoodConfig(currentAssessUser?.latestMood || '').icon }}
                {{ getMoodConfig(currentAssessUser?.latestMood || '').label }}
              </div>
            </div>
          </div>

          <!-- 评分区域 -->
          <div class="assess-score-section">
            <div class="score-ring-wrapper">
              <svg class="score-ring" viewBox="0 0 120 120">
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke="#f1f5f9"
                  stroke-width="8"
                />
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  :stroke="assessmentData.score >= 60 ? '#22c55e' : '#f97316'"
                  stroke-width="8"
                  stroke-linecap="round"
                  :stroke-dasharray="Math.round(assessmentData.score / 100 * 327) + ' 327'"
                  transform="rotate(-90 60 60)"
                  class="score-ring-progress"
                />
              </svg>
              <div class="score-center">
                <span class="score-number" :style="{ color: assessmentData.score >= 60 ? '#22c55e' : '#f97316' }">
                  {{ assessmentData.score }}
                </span>
                <span class="score-unit">/100</span>
              </div>
            </div>
            <div class="score-meta">
              <el-tag
                :type="assessmentData.score >= 60 ? 'success' : 'warning'"
                size="large"
                round
                effect="light"
                class="score-status-tag"
              >
                {{ assessmentData.emotionStatus }}
              </el-tag>
              <span class="score-level" :style="{ color: getScoreLevel(assessmentData.score).color }">
                {{ getScoreLevel(assessmentData.score).text }}
              </span>
            </div>
          </div>

          <!-- 活动细节 -->
          <div class="assess-detail-row">
            <div class="assess-detail-item">
              <el-icon><ChatDotRound /></el-icon>
              <span class="detail-num">{{ assessmentData.details.chatCount }}</span>
              <span class="detail-label">AI对话</span>
            </div>
            <div class="assess-detail-item">
              <el-icon><Collection /></el-icon>
              <span class="detail-num">{{ assessmentData.details.postCount }}</span>
              <span class="detail-label">树洞发言</span>
            </div>
            <div class="assess-detail-item">
              <el-icon><Document /></el-icon>
              <span class="detail-num">{{ assessmentData.details.diaryCount }}</span>
              <span class="detail-label">心情日记</span>
            </div>
          </div>

          <!-- 情绪分布 -->
          <div class="assess-emotion-bar">
            <div class="emotion-segment positive" :style="{ flex: assessmentData.details.emotionCount.positive || 0.1 }" title="正面情绪">{{ assessmentData.details.emotionCount.positive }}</div>
            <div class="emotion-segment neutral" :style="{ flex: assessmentData.details.emotionCount.neutral || 0.1 }" title="中性情绪">{{ assessmentData.details.emotionCount.neutral }}</div>
            <div class="emotion-segment negative" :style="{ flex: assessmentData.details.emotionCount.negative || 0.1 }" title="负面情绪">{{ assessmentData.details.emotionCount.negative }}</div>
          </div>
          <div class="emotion-legend">
            <span><span class="legend-dot positive"></span>正面 {{ assessmentData.details.emotionCount.positive }}</span>
            <span><span class="legend-dot neutral"></span>中性 {{ assessmentData.details.emotionCount.neutral }}</span>
            <span><span class="legend-dot negative"></span>负面 {{ assessmentData.details.emotionCount.negative }}</span>
          </div>

          <!-- 建议 -->
          <div class="assess-suggestion">
            <div class="suggestion-header">
              <span class="suggestion-icon">💡</span>
              <span>AI 建议</span>
            </div>
            <p>{{ assessmentData.suggestion }}</p>
          </div>

          <!-- 详细报告 -->
          <div v-if="assessmentReport" class="assess-report">
            <div class="report-header">
              <span class="report-icon">📋</span>
              <span>详细报告</span>
            </div>
            <pre class="report-text">{{ assessmentReport }}</pre>
          </div>
        </div>
        <el-empty v-else-if="!assessmentLoading" description="暂无评估数据" />
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.user-status {
  width: 100%;
}

/* ==================== 页面头部 ==================== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

/* ==================== 统计卡片行 ==================== */
.stats-row {
  display: flex;
  gap: 18px;
  margin-bottom: 24px;

  @media (max-width: 900px) {
    flex-direction: column;
  }
}

.stat-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
  }

  &.primary .stat-icon-wrap {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
  }
  &.success .stat-icon-wrap {
    background: linear-gradient(135deg, #22c55e, #10b981);
  }

  .stat-icon-wrap {
    width: 48px;
    height: 48px;
    min-width: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .stat-body {
    .stat-number {
      font-size: 26px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.1;
      font-variant-numeric: tabular-nums;
    }
    .stat-desc {
      font-size: 13px;
      color: #94a3b8;
      font-weight: 500;
    }
  }

  // 心情概览卡片
  &.mood-overview {
    flex: 1;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;

    .mood-mini-grid {
      display: flex;
      justify-content: space-around;

      .mood-mini-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;

        .mood-mini-emoji {
          font-size: 22px;
        }
        .mood-mini-count {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
        }
      }
    }

    .mood-label-row {
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      font-weight: 500;
    }
  }
}

/* ==================== 用户卡片网格 ==================== */
.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 18px;

  .empty-state {
    grid-column: 1 / -1;
    padding: 60px 0;
  }
}

.user-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  padding: 0 0 20px 0;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
  }
}

// 顶部装饰线
.card-accent {
  height: 3px;
  width: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 20px 0 20px;

  .card-avatar {
    width: 52px;
    height: 52px;
    min-width: 52px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 20px;
    font-weight: 700;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .card-user-info {
    flex: 1;
    min-width: 0;

    .card-username {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .card-login {
      font-size: 12px;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
}

// 心情展示
.card-mood {
  margin: 14px 20px;
  padding: 14px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-weight: 600;

  .mood-emoji-lg {
    font-size: 28px;
    line-height: 1;
  }

  .mood-label-lg {
    font-size: 16px;
  }
}

// 活动统计
.card-stats {
  display: flex;
  justify-content: space-around;
  padding: 14px 20px;
  border-top: 1px solid #f8fafc;
  border-bottom: 1px solid #f8fafc;

  .card-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    color: #94a3b8;

    .card-stat-val {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      font-variant-numeric: tabular-nums;
    }

    .card-stat-label {
      font-size: 11px;
      font-weight: 500;
    }

    .el-icon {
      font-size: 15px;
      color: #cbd5e1;
    }
  }
}

// 操作按钮
.card-action {
  display: flex;
  justify-content: center;
  padding: 16px 20px 0 20px;

  .assess-btn {
    width: 100%;
    font-weight: 600;
  }
}

/* ==================== 评估对话框 ==================== */
:deep(.assessment-dialog) {
  .el-dialog {
    border-radius: 20px;
    overflow: hidden;
  }

  .el-dialog__header {
    padding: 20px 28px;
    border-bottom: 1px solid #f1f5f9;
    margin: 0;

    .el-dialog__title {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
    }
  }

  .el-dialog__body {
    padding: 0;
  }
}

.assessment-content {
  padding: 0;
}

// 用户横幅
.assess-user-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 28px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);

  .assess-avatar {
    width: 56px;
    height: 56px;
    min-width: 56px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 22px;
    font-weight: 700;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .assess-user-meta {
    .assess-username {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 4px;
    }
    .assess-mood {
      font-size: 14px;
      font-weight: 500;
    }
  }
}

// 评分区域
.assess-score-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
  padding: 28px;
}

.score-ring-wrapper {
  position: relative;
  width: 120px;
  height: 120px;

  .score-ring {
    width: 100%;
    height: 100%;

    .score-ring-progress {
      transition: stroke-dasharray 1s ease-in-out;
    }
  }

  .score-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    line-height: 1.1;

    .score-number {
      font-size: 34px;
      font-weight: 800;
      display: block;
    }
    .score-unit {
      font-size: 13px;
      color: #94a3b8;
      font-weight: 500;
    }
  }
}

.score-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  .score-status-tag {
    font-size: 14px;
    font-weight: 600;
  }

  .score-level {
    font-size: 13px;
    font-weight: 600;
  }
}

// 活动细节
.assess-detail-row {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 0 28px 24px;

  .assess-detail-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 18px;
    background: #f8fafc;
    border-radius: 10px;
    font-size: 13px;
    color: #64748b;

    .detail-num {
      font-weight: 700;
      color: #1e293b;
      font-size: 16px;
      font-variant-numeric: tabular-nums;
    }

    .detail-label {
      color: #94a3b8;
    }
  }
}

// 情绪分布条
.assess-emotion-bar {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  margin: 0 28px 12px;

  .emotion-segment {
    transition: flex 0.5s ease;
    font-size: 0;
    color: transparent;
    min-width: 2px;

    &.positive { background: #22c55e; }
    &.neutral  { background: #6366f1; }
    &.negative { background: #f43f5e; }
  }
}

.emotion-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 24px;
  font-size: 12px;
  color: #64748b;

  span {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;

    &.positive { background: #22c55e; }
    &.neutral  { background: #6366f1; }
    &.negative { background: #f43f5e; }
  }
}

// 建议
.assess-suggestion {
  margin: 0 28px 16px;
  padding: 16px;
  background: #fffbeb;
  border-radius: 12px;
  border: 1px solid #fde68a;

  .suggestion-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 700;
    color: #92400e;
    margin-bottom: 8px;

    .suggestion-icon {
      font-size: 16px;
    }
  }

  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.7;
    color: #78350f;
  }
}

// 详细报告
.assess-report {
  margin: 0 28px 24px;
  background: #f8fafc;
  border-radius: 12px;
  overflow: hidden;

  .report-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 14px 16px;
    font-size: 13px;
    font-weight: 700;
    color: #475569;
    border-bottom: 1px solid #e2e8f0;
  }

  .report-text {
    margin: 0;
    padding: 16px;
    font-size: 13px;
    line-height: 1.8;
    color: #334155;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 250px;
    overflow-y: auto;
    font-family: inherit;
  }
}
</style>
