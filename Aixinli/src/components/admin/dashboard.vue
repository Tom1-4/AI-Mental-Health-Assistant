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
      backgroundColor: "#ffffff",
      borderColor: "#e2e8f0",
      borderWidth: 1,
      textStyle: { color: "#1e293b", fontSize: 13 },
      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
      padding: [12, 16],
      extraCssText: "border-radius: 10px;",
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
      axisLine: { lineStyle: { color: "#e2e8f0" } },
      axisTick: { show: false },
      axisLabel: { color: "#94a3b8", fontSize: 11, rotate: 45 },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" } },
      axisLabel: { color: "#94a3b8", fontSize: 11 },
    },
    series: [
      {
        name: "日活跃用户",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        showSymbol: false,
        itemStyle: {
          color: "#6366f1",
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
              { offset: 0, color: "rgba(99, 102, 241, 0.25)" },
              { offset: 1, color: "rgba(99, 102, 241, 0.02)" },
            ],
          },
        },
        lineStyle: { width: 2.5, color: "#6366f1" },
        data: dailyStats.value.map((d: DailyStats) => d.users),
      },
    ],
  };

  // 使用趋势（多折线图）
  usageTrendOption.value = {
    tooltip: {
      trigger: "axis",
      backgroundColor: "#ffffff",
      borderColor: "#e2e8f0",
      borderWidth: 1,
      textStyle: { color: "#1e293b", fontSize: 13 },
      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
      padding: [12, 16],
      extraCssText: "border-radius: 10px;",
    },
    legend: {
      data: ["AI对话", "树洞发言", "心情日记"],
      top: 0,
      textStyle: { color: "#64748b", fontSize: 12 },
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 24,
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: "44px",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: dates,
      axisLine: { lineStyle: { color: "#e2e8f0" } },
      axisTick: { show: false },
      axisLabel: { color: "#94a3b8", fontSize: 11, rotate: 45 },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" } },
      axisLabel: { color: "#94a3b8", fontSize: 11 },
    },
    series: [
      {
        name: "AI对话",
        type: "line",
        smooth: true,
        showSymbol: false,
        itemStyle: { color: "#6366f1" },
        lineStyle: { width: 2 },
        data: dailyStats.value.map((d: DailyStats) => d.chats),
      },
      {
        name: "树洞发言",
        type: "line",
        smooth: true,
        showSymbol: false,
        itemStyle: { color: "#10b981" },
        lineStyle: { width: 2 },
        data: dailyStats.value.map((d: DailyStats) => d.posts),
      },
      {
        name: "心情日记",
        type: "line",
        smooth: true,
        showSymbol: false,
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
      backgroundColor: "#ffffff",
      borderColor: "#e2e8f0",
      borderWidth: 1,
      textStyle: { color: "#1e293b", fontSize: 13 },
      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
      padding: [12, 16],
      extraCssText: "border-radius: 10px;",
    },
    legend: {
      orient: "vertical",
      right: "5%",
      top: "center",
      textStyle: { color: "#64748b", fontSize: 12 },
      itemWidth: 8,
      itemHeight: 8,
    },
    series: [
      {
        name: "情绪分布",
        type: "pie",
        radius: ["45%", "75%"],
        center: ["35%", "50%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: "#fff",
          borderWidth: 3,
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 18,
            fontWeight: "bold",
          },
          scaleSize: 8,
        },
        labelLine: { show: false },
        data: [
          {
            value: emotionDistribution.value.positive,
            name: "正面情绪",
            itemStyle: { color: "#22c55e" },
          },
          {
            value: emotionDistribution.value.neutral,
            name: "中性情绪",
            itemStyle: { color: "#6366f1" },
          },
          {
            value: emotionDistribution.value.negative,
            name: "负面情绪",
            itemStyle: { color: "#f43f5e" },
          },
        ],
      },
    ],
  };

  // 活跃度柱状图
  activityBarOption.value = {
    tooltip: {
      trigger: "axis",
      backgroundColor: "#ffffff",
      borderColor: "#e2e8f0",
      borderWidth: 1,
      textStyle: { color: "#1e293b", fontSize: 13 },
      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
      padding: [12, 16],
      extraCssText: "border-radius: 10px;",
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
      axisLine: { lineStyle: { color: "#e2e8f0" } },
      axisTick: { show: false },
      axisLabel: { color: "#64748b", fontSize: 12 },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" } },
      axisLabel: { color: "#94a3b8", fontSize: 11 },
    },
    series: [
      {
        name: "活跃用户数",
        type: "bar",
        barWidth: "45%",
        itemStyle: {
          borderRadius: [10, 10, 0, 0],
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "#818cf8" },
              { offset: 1, color: "#6366f1" },
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
      '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
      '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6',
      '#06b6d4', '#3b82f6', '#2563eb', '#1d4ed8', '#7c3aed', '#c026d3'
    ];
    mbtiPieOption.value = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}人 ({d}%)',
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#1e293b', fontSize: 13 },
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        padding: [12, 16],
        extraCssText: 'border-radius: 10px;',
      },
      legend: {
        type: 'scroll',
        orient: 'vertical',
        right: '2%',
        top: 'center',
        textStyle: { color: '#64748b', fontSize: 11 },
        itemWidth: 8,
        itemHeight: 8,
        formatter: (name: string) => {
          const item = mbtiDistribution.value?.typeDistribution.find(d => d.type === name);
          return item ? `${name} ${item.typeInfo.name}` : name;
        }
      },
      series: [{
        name: 'MBTI分布',
        type: 'pie',
        radius: ['48%', '78%'],
        center: ['38%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 5,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' },
          scaleSize: 6,
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
import { watch } from "vue";
watch(
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
      <div class="header-left">
        <h2 class="page-title">
          <el-icon :size="26"><DataAnalysis /></el-icon>
          数据分析
        </h2>
        <p class="page-subtitle">实时监控平台核心指标与用户行为趋势</p>
      </div>
      <div class="header-actions">
        <el-tag type="info" size="small" effect="plain" class="update-tag">
          数据更新于 {{ new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}
        </el-tag>
        <el-button type="primary" :icon="Refresh" @click="handleRefresh" :loading="loading">
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon-wrapper" style="--icon-bg: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); --icon-shadow: rgba(99, 102, 241, 0.35);">
          <div class="stat-icon-bg"></div>
          <el-icon :size="24"><User /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">总用户数</div>
          <div class="stat-value">{{ stats.totalUsers.toLocaleString() }}</div>
          <div class="stat-trend up">较上月 +{{ stats.newUsersThisMonth || 0 }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrapper" style="--icon-bg: linear-gradient(135deg, #22c55e 0%, #10b981 100%); --icon-shadow: rgba(34, 197, 94, 0.35);">
          <div class="stat-icon-bg"></div>
          <el-icon :size="24"><UserFilled /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">本月新增</div>
          <div class="stat-value">{{ stats.newUsersThisMonth.toLocaleString() }}</div>
          <div class="stat-trend up">新注册用户</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrapper" style="--icon-bg: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); --icon-shadow: rgba(245, 158, 11, 0.35);">
          <div class="stat-icon-bg"></div>
          <el-icon :size="24"><ChatDotRound /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">AI对话次数</div>
          <div class="stat-value">{{ stats.totalChats.toLocaleString() }}</div>
          <div class="stat-trend">累计对话</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrapper" style="--icon-bg: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); --icon-shadow: rgba(59, 130, 246, 0.35);">
          <div class="stat-icon-bg"></div>
          <el-icon :size="24"><Collection /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">树洞发言</div>
          <div class="stat-value">{{ stats.totalPosts.toLocaleString() }}</div>
          <div class="stat-trend">累计发布</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrapper" style="--icon-bg: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%); --icon-shadow: rgba(236, 72, 153, 0.35);">
          <div class="stat-icon-bg"></div>
          <el-icon :size="24"><Document /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">心情日记</div>
          <div class="stat-value">{{ stats.totalDiaries.toLocaleString() }}</div>
          <div class="stat-trend">累计记录</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrapper" style="--icon-bg: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); --icon-shadow: rgba(139, 92, 246, 0.35);">
          <div class="stat-icon-bg"></div>
          <el-icon :size="24"><MagicStick /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">MBTI已测</div>
          <div class="stat-value">{{ (mbtiDistribution?.totalTestedUsers || 0).toLocaleString() }}</div>
          <div class="stat-trend">参与测试用户</div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-grid" v-loading="loading" element-loading-text="数据加载中...">
      <!-- 第一行：用户增长趋势 + 情绪分布 -->
      <div class="chart-card chart-large">
        <div class="chart-header">
          <div class="chart-title-group">
            <div class="chart-dot" style="background: #6366f1;"></div>
            <h3>用户活跃趋势</h3>
          </div>
          <span class="chart-hint">近30天</span>
        </div>
        <div class="chart-body">
          <v-chart class="chart" :option="userGrowthOption" autoresize />
        </div>
      </div>

      <div class="chart-card chart-small">
        <div class="chart-header">
          <div class="chart-title-group">
            <div class="chart-dot" style="background: #22c55e;"></div>
            <h3>情绪分布</h3>
          </div>
          <span class="chart-hint">总体统计</span>
        </div>
        <div class="chart-body">
          <v-chart class="chart" :option="emotionPieOption" autoresize />
        </div>
      </div>

      <!-- 第二行：使用趋势 + 活跃度 -->
      <div class="chart-card chart-wide">
        <div class="chart-header">
          <div class="chart-title-group">
            <div class="chart-dot" style="background: #6366f1;"></div>
            <h3>功能使用趋势</h3>
          </div>
          <span class="chart-hint">近30天 · AI对话 / 树洞发言 / 心情日记</span>
        </div>
        <div class="chart-body">
          <v-chart class="chart" :option="usageTrendOption" autoresize />
        </div>
      </div>

      <div class="chart-card chart-small">
        <div class="chart-header">
          <div class="chart-title-group">
            <div class="chart-dot" style="background: #818cf8;"></div>
            <h3>用户活跃度</h3>
          </div>
          <span class="chart-hint">时段分布</span>
        </div>
        <div class="chart-body">
          <v-chart class="chart" :option="activityBarOption" autoresize />
        </div>
      </div>

      <!-- 第三行：MBTI人格分布 -->
      <div v-if="mbtiDistribution && mbtiDistribution.typeDistribution.length > 0" class="chart-card chart-wide">
        <div class="chart-header">
          <div class="chart-title-group">
            <div class="chart-dot" style="background: #8b5cf6;"></div>
            <h3>MBTI 人格类型分布</h3>
          </div>
          <span class="chart-hint">共 {{ mbtiDistribution.totalTestedUsers }} 人参与测试</span>
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
}

/* ==================== 页面头部 ==================== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;

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
      margin: 0;
      font-size: 14px;
      color: #94a3b8;
      margin-left: 38px;
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;

    .update-tag {
      font-size: 12px;
      border-radius: 6px;
    }
  }
}

/* ==================== 统计卡片 ==================== */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 18px;
  margin-bottom: 28px;

  @media (max-width: 1600px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 1000px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 22px 24px;
  display: flex;
  align-items: center;
  gap: 18px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, transparent 0%, rgba(0, 0, 0, 0.01) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
    border-color: rgba(0, 0, 0, 0.08);

    &::after {
      opacity: 1;
    }

    .stat-icon-wrapper {
      transform: scale(1.05);
    }
  }
}

.stat-icon-wrapper {
  width: 52px;
  height: 52px;
  min-width: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  position: relative;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  .stat-icon-bg {
    position: absolute;
    inset: 0;
    border-radius: 14px;
    background: var(--icon-bg);
    opacity: 0.9;
  }

  .el-icon {
    position: relative;
    z-index: 1;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
  }

  // 发光效果
  &::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 16px;
    background: var(--icon-bg);
    opacity: 0.15;
    z-index: -1;
    filter: blur(8px);
  }
}

.stat-info {
  flex: 1;
  min-width: 0;

  .stat-label {
    font-size: 13px;
    color: #94a3b8;
    font-weight: 500;
    margin-bottom: 4px;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.1;
    margin-bottom: 4px;
    letter-spacing: -0.5px;
    font-variant-numeric: tabular-nums;
  }

  .stat-trend {
    font-size: 12px;
    color: #94a3b8;

    &.up {
      color: #22c55e;
      font-weight: 500;

      &::before {
        content: '↑ ';
        font-size: 10px;
      }
    }

    &.down {
      color: #f43f5e;
      font-weight: 500;

      &::before {
        content: '↓ ';
        font-size: 10px;
      }
    }
  }
}

/* ==================== 图表网格 ==================== */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;

  @media (max-width: 1400px) {
    grid-template-columns: 1fr;

    .chart-wide {
      grid-column: span 1 !important;
    }
  }
}

.chart-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.04);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
  }

  &.chart-large { grid-column: span 1; }
  &.chart-small { grid-column: span 1; }

  &.chart-wide {
    grid-column: span 2;

    @media (max-width: 1400px) {
      grid-column: span 1;
    }
  }
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid #f8fafc;

  .chart-title-group {
    display: flex;
    align-items: center;
    gap: 10px;

    .chart-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      box-shadow: 0 0 6px currentColor;
    }

    h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
    }
  }

  .chart-hint {
    font-size: 12px;
    color: #94a3b8;
  }
}

.chart-body {
  padding: 16px 20px;
  height: 320px;

  .chart {
    width: 100%;
    height: 100%;
  }
}
</style>
