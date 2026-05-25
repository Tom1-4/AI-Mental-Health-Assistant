<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import {
  getMoodStats,
  type MoodStats,
  getMoodInfo,
} from "../../../services/moodDiary";
import { Calendar } from "@element-plus/icons-vue";

const moodStats = ref<MoodStats | null>(null);
const loading = ref(false);

const mostFrequentMood = computed(() => {
  if (!moodStats.value?.totalStats || moodStats.value.totalStats.length === 0) {
    return null;
  }

  const sorted = [...moodStats.value.totalStats].sort(
    (a, b) => b.count - a.count
  );
  return sorted[0];
});

const totalDiaries = computed(() => {
  if (!moodStats.value?.totalStats) return 0;
  return moodStats.value.totalStats.reduce((sum, item) => sum + item.count, 0);
});

const loadStats = async () => {
  loading.value = true;
  try {
    const response = await getMoodStats(30);
    if (response.success) {
      moodStats.value = response.data;
    }
  } catch (error) {
    console.error("加载统计数据失败:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadStats();
});
</script>

<template>
  <div class="mood-stats" v-loading="loading">
    <div v-if="moodStats" class="stats-content">
      <div class="stat-card main-stat">
        <div class="stat-title">总日记数</div>
        <div class="stat-value">{{ totalDiaries }}</div>
        <div class="stat-subtitle">近30天</div>
      </div>

      <div v-if="mostFrequentMood" class="stat-card mood-stat">
        <div class="stat-title">主要心情</div>
        <div class="stat-mood">
          <span class="mood-emoji">{{
            getMoodInfo(mostFrequentMood.mood).emoji
          }}</span>
          <span
            class="mood-label"
            :style="{ color: getMoodInfo(mostFrequentMood.mood).color }"
          >
            {{ getMoodInfo(mostFrequentMood.mood).label }}
          </span>
        </div>
        <div class="stat-subtitle">{{ mostFrequentMood.count }} 次记录</div>
      </div>

      <div class="stat-card distribution-stat">
        <div class="stat-title">心情分布</div>
        <div class="mood-distribution">
          <div
            v-for="stat in moodStats.totalStats"
            :key="stat.mood"
            class="distribution-item"
          >
            <div class="distribution-header">
              <span class="mood-icon">{{ getMoodInfo(stat.mood).emoji }}</span>
              <span class="mood-name">{{ getMoodInfo(stat.mood).label }}</span>
            </div>
            <div class="distribution-bar">
              <div
                class="bar-fill"
                :style="{
                  width: `${(stat.count / totalDiaries) * 100}%`,
                  backgroundColor: getMoodInfo(stat.mood).color,
                }"
              ></div>
            </div>
            <div class="distribution-count">{{ stat.count }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!loading" class="empty-state">
      <el-icon :size="40" class="empty-icon">
        <Calendar />
      </el-icon>
      <p>暂无统计数据</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mood-stats {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.stats-content {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  min-width: 200px;
  padding: 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-title {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 5px;
}

.stat-subtitle {
  font-size: 12px;
  opacity: 0.8;
}

.stat-mood {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.mood-emoji {
  font-size: 28px;
}

.mood-label {
  font-size: 20px;
  font-weight: 600;
}

.mood-stat,
.distribution-stat {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.mood-distribution {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.distribution-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.distribution-header {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 70px;
  font-size: 13px;
}

.mood-icon {
  font-size: 16px;
}

.mood-name {
  color: rgba(255, 255, 255, 0.9);
}

.distribution-bar {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.distribution-count {
  min-width: 25px;
  text-align: right;
  font-size: 12px;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-icon {
  color: #ddd;
  margin-bottom: 15px;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}
</style>
