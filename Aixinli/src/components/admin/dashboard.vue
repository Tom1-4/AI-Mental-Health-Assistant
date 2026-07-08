<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  DataAnalysis,
  User,
  UserFilled,
  ChatDotRound,
  Collection,
  Document,
  Refresh,
  MagicStick,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart, PieChart, BarChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from "echarts/components";
import VChart from "vue-echarts";
import {
  getDashboardStats,
  type DashboardStats,
  type DailyStats,
  type EmotionDistribution,
} from "../../services/dashboard";
import {
  getMbtiDistribution,
  type MbtiDistribution,
} from "../../services/mbti";

use([
  CanvasRenderer,
  LineChart,
  PieChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
]);

// 数据状态
const loading = ref(false);

// 统计数据
const stats = ref<DashboardStats>({
  totalUsers: 0,
  newUsersThisMonth: 0,
  activeUsersToday: 0,
  activeUsersThisWeek: 0,
  activeUsersThisMonth: 0,
  totalChats: 0,
  totalPosts: 0,
  totalDiaries: 0,
});

// 每日统计数据
const dailyStats = ref<DailyStats[]>([]);

// 情绪分布
const emotionDistribution = ref<EmotionDistribution>({
  positive: 0,
  negative: 0,
  neutral: 0,
});

// MBTI分布
const mbtiDistribution = ref<MbtiDistribution | null>(null);

// 获取数据
const fetchData = async () => {
  loading.value = true;
  try {
    const response = await getDashboardStats();

    if (response.success && response.data) {
      stats.value = response.data.stats;
      dailyStats.value = response.data.dailyStats;
      emotionDistribution.value = response.data.emotionDistribution;
    } else {
      throw new Error("获取数据失败");
    }

    // 获取MBTI分布
    try {
      const mbtiRes = await getMbtiDistribution();
      if (mbtiRes.success && mbtiRes.data) {
        mbtiDistribution.value = mbtiRes.data;
      }
    } catch {
      // MBTI数据获取失败不中断主流程
      mbtiDistribution.value = null;
    }
  } catch (error: any) {
    console.error("获取仪表盘数据失败:", error);
    ElMessage.error("获取仪表盘数据失败: " + (error.message || "未知错误"));
  } finally {
    loading.value = false;
  }
};

// 刷新数据
const handleRefresh = () => {
  fetchData();
};

// 用户增长趋势图配置
const userGrowthOption = ref<any>({});

// 使用趋势图配置
const usageTrendOption = ref<any>({});

// 情绪分布图配置
const emotionPieOption = ref<any>({});

// 活跃度柱状图配置
const activityBarOption = ref<any>({});

// MBTI类型分布图
const mbtiPieOption = ref<any>({});

// 初始化图表配置
const initChartOptions = () => {
  const dates = dailyStats.value.map((d: DailyStats) => d.date.slice(5));

  // 用户增长趋势
  userGrowthOption.value = {
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#e0e7ff",
      textStyle: { color: "#333" },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: dates,
      axisLine: { lineStyle: { color: "#e0e7ff" } },
      axisLabel: { color: "#64748b", rotate: 45 },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      splitLine: { lineStyle: { color: "#f1f5f9" } },
      axisLabel: { color: "#64748b" },
    },
    series: [
      {
        name: "日活跃用户",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        itemStyle: {
          color: "#667eea",
          borderWidth: 2,
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(102, 126, 234, 0.4)" },
              { offset: 1, color: "rgba(102, 126, 234, 0.05)" },
            ],
          },
        },
        lineStyle: { width: 3, color: "#667eea" },
        data: dailyStats.value.map((d: DailyStats) => d.users),
      },
    ],
  };

  // 使用趋势（多折线图）
  usageTrendOption.value = {
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#e0e7ff",
      textStyle: { color: "#333" },
    },
    legend: {
      data: ["AI对话", "树洞发言", "心情日记"],
      top: 0,
      textStyle: { color: "#64748b" },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: "40px",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: dates,
      axisLine: { lineStyle: { color: "#e0e7ff" } },
      axisLabel: { color: "#64748b", rotate: 45 },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      splitLine: { lineStyle: { color: "#f1f5f9" } },
      axisLabel: { color: "#64748b" },
    },
    series: [
      {
        name: "AI对话",
        type: "line",
        smooth: true,
        itemStyle: { color: "#667eea" },
        lineStyle: { width: 2 },
        data: dailyStats.value.map((d: DailyStats) => d.chats),
      },
      {
        name: "树洞发言",
        type: "line",
        smooth: true,
        itemStyle: { color: "#43e97b" },
        lineStyle: { width: 2 },
        data: dailyStats.value.map((d: DailyStats) => d.posts),
      },
      {
        name: "心情日记",
        type: "line",
        smooth: true,
        itemStyle: { color: "#f59e0b" },
        lineStyle: { width: 2 },
        data: dailyStats.value.map((d: DailyStats) => d.diaries),
      },
    ],
  };

  // 情绪分布饼图
  emotionPieOption.value = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#e0e7ff",
      textStyle: { color: "#333" },
    },
    legend: {
      orient: "vertical",
      right: "5%",
      top: "center",
      textStyle: { color: "#64748b" },
    },
    series: [
      {
        name: "情绪分布",
        type: "pie",
        radius: ["40%", "70%"],
        center: ["35%", "50%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: "bold",
          },
        },
        labelLine: { show: false },
        data: [
          {
            value: emotionDistribution.value.positive,
            name: "正面情绪",
            itemStyle: { color: "#67C23A" },
          },
          {
            value: emotionDistribution.value.neutral,
            name: "中性情绪",
            itemStyle: { color: "#909399" },
          },
          {
            value: emotionDistribution.value.negative,
            name: "负面情绪",
            itemStyle: { color: "#F56C6C" },
          },
        ],
      },
    ],
  };

  // 活跃度柱状图
  activityBarOption.value = {
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#e0e7ff",
      textStyle: { color: "#333" },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: ["今日活跃", "本周活跃", "本月活跃"],
      axisLine: { lineStyle: { color: "#e0e7ff" } },
      axisLabel: { color: "#64748b" },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      splitLine: { lineStyle: { color: "#f1f5f9" } },
      axisLabel: { color: "#64748b" },
    },
    series: [
      {
        name: "活跃用户数",
        type: "bar",
        barWidth: "50%",
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "#667eea" },
              { offset: 1, color: "#764ba2" },
            ],
          },
        },
        data: [
          stats.value.activeUsersToday,
          stats.value.activeUsersThisWeek,
          stats.value.activeUsersThisMonth,
        ],
      },
    ],
  };

  // MBTI类型分布图
  if (mbtiDistribution.value && mbtiDistribution.value.typeDistribution.length > 0) {
    const mbtiColors = [
      '#667eea', '#764ba2', '#43e97b', '#f59e0b', '#ec4899',
      '#3b82f6', '#8b5cf6', '#06b6d4', '#f97316', '#ef4444',
      '#84cc16', '#14b8a6', '#6366f1', '#d946ef', '#0ea5e9', '#e11d48'
    ];
    mbtiPieOption.value = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}人 ({d}%)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e0e7ff',
        textStyle: { color: '#333' },
      },
      legend: {
        type: 'scroll',
        orient: 'vertical',
        right: '2%',
        top: 'center',
        textStyle: { color: '#64748b', fontSize: 11 },
        formatter: (name: string) => {
          const item = mbtiDistribution.value?.typeDistribution.find(d => d.type === name);
          return item ? `${name} ${item.typeInfo.name}` : name;
        }
      },
      series: [{
        name: 'MBTI分布',
        type: 'pie',
        radius: ['45%', '75%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' },
        },
        labelLine: { show: false },
        data: mbtiDistribution.value.typeDistribution.map((item, idx) => ({
          value: item.count,
          name: item.type,
          itemStyle: { color: mbtiColors[idx % mbtiColors.length] }
        })),
      }],
    };
  }
};

// 页面加载时获取数据
onMounted(() => {
  fetchData();
});

// 监听数据变化更新图表
const updateCharts = () => {
  if (dailyStats.value.length > 0) {
    initChartOptions();
  }
};

// 监听数据变化
const stopWatch = ref<() => void>();
import { watch } from "vue";
stopWatch.value = watch(
  [dailyStats, stats, emotionDistribution, mbtiDistribution],
  () => {
    updateCharts();
  },
  { deep: true }
);
</script>

<template>
  <div class="dashboard">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">
        <el-icon :size="24"><DataAnalysis /></el-icon>
        数据分析
      </h2>
      <el-button type="primary" :icon="Refresh" @click="handleRefresh">
        刷新数据
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card stat-card-primary">
        <div class="stat-icon">
          <el-icon :size="32"><User /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalUsers }}</div>
          <div class="stat-label">总用户数</div>
        </div>
      </div>

      <div class="stat-card stat-card-success">
        <div class="stat-icon">
          <el-icon :size="32"><UserFilled /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.newUsersThisMonth }}</div>
          <div class="stat-label">本月新增</div>
        </div>
      </div>

      <div class="stat-card stat-card-warning">
        <div class="stat-icon">
          <el-icon :size="32"><ChatDotRound /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalChats }}</div>
          <div class="stat-label">AI对话次数</div>
        </div>
      </div>

      <div class="stat-card stat-card-info">
        <div class="stat-icon">
          <el-icon :size="32"><Collection /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalPosts }}</div>
          <div class="stat-label">树洞发言</div>
        </div>
      </div>

      <div class="stat-card stat-card-danger">
        <div class="stat-icon">
          <el-icon :size="32"><Document /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalDiaries }}</div>
          <div class="stat-label">心情日记</div>
        </div>
      </div>

      <div class="stat-card" style="--card-gradient: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)">
        <div class="stat-icon" style="background: var(--card-gradient)">
          <el-icon :size="32"><MagicStick /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ mbtiDistribution?.totalTestedUsers || 0 }}</div>
          <div class="stat-label">MBTI已测用户</div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-grid" v-loading="loading">
      <!-- 第一行：用户增长趋势 + 情绪分布 -->
      <div class="chart-card chart-large">
        <div class="chart-header">
          <h3>用户活跃趋势（近30天）</h3>
        </div>
        <div class="chart-body">
          <v-chart class="chart" :option="userGrowthOption" autoresize />
        </div>
      </div>

      <div class="chart-card chart-small">
        <div class="chart-header">
          <h3>情绪分布</h3>
        </div>
        <div class="chart-body">
          <v-chart class="chart" :option="emotionPieOption" autoresize />
        </div>
      </div>

      <!-- 第二行：使用趋势 + 活跃度 -->
      <div class="chart-card chart-wide">
        <div class="chart-header">
          <h3>功能使用趋势（近30天）</h3>
        </div>
        <div class="chart-body">
          <v-chart class="chart" :option="usageTrendOption" autoresize />
        </div>
      </div>

      <div class="chart-card chart-small">
        <div class="chart-header">
          <h3>用户活跃度</h3>
        </div>
        <div class="chart-body">
          <v-chart class="chart" :option="activityBarOption" autoresize />
        </div>
      </div>

      <!-- 第三行：MBTI人格分布 -->
      <div v-if="mbtiDistribution && mbtiDistribution.typeDistribution.length > 0" class="chart-card chart-wide">
        <div class="chart-header">
          <h3>MBTI 人格类型分布</h3>
        </div>
        <div class="chart-body">
          <v-chart class="chart" :option="mbtiPieOption" autoresize />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dashboard {
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
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid #e5e7eb;

  .page-title {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

// 统计卡片
.stats-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  margin-bottom: 24px;

  @media (max-width: 1400px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-card {
    background: #ffffff;
    border-radius: 16px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 20px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }

    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
    }

    .stat-info {
      flex: 1;

      .stat-value {
        font-size: 32px;
        font-weight: 700;
        color: #1e293b;
        line-height: 1;
        margin-bottom: 8px;
      }

      .stat-label {
        font-size: 14px;
        color: #64748b;
      }
    }
  }

  .stat-card-primary {
    .stat-icon {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
  }

  .stat-card-success {
    .stat-icon {
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
    }
  }

  .stat-card-warning {
    .stat-icon {
      background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
    }
  }

  .stat-card-info {
    .stat-icon {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    }
  }

  .stat-card-danger {
    .stat-icon {
      background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
    }
  }
}

// 图表网格
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }

  .chart-card {
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    overflow: hidden;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }

    &.chart-large {
      grid-column: span 1;
    }

    &.chart-small {
      grid-column: span 1;
    }

    &.chart-wide {
      grid-column: span 2;

      @media (max-width: 1200px) {
        grid-column: span 1;
      }
    }

    .chart-header {
      padding: 20px 24px;
      border-bottom: 1px solid #f1f5f9;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
      }
    }

    .chart-body {
      padding: 16px;
      height: 300px;

      .chart {
        width: 100%;
        height: 100%;
      }
    }
  }
}
</style>
