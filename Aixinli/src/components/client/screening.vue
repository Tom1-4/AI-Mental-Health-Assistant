<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  getScreeningQuestions,
  submitScreeningTest,
  getScreeningResult,
  type ScreeningQuestion,
  type ScreeningOption,
  type ScreeningResult,
} from '../../services/screening'

const router = useRouter()
const route = useRoute()

// 测试类型：phq9 或 gad7
const testType = computed(() => (route.path === '/gad7' ? 'gad7' : 'phq9'))

// 测试配置
const testTitle = computed(() => testType.value === 'phq9' ? 'PHQ-9 抑郁筛查量表' : 'GAD-7 焦虑筛查量表')
const testDesc = computed(() => testType.value === 'phq9'
  ? 'PHQ-9（Patient Health Questionnaire-9）是国际通用的抑郁症状快速筛查工具，帮助您了解过去两周的情绪状态。'
  : 'GAD-7（Generalized Anxiety Disorder-7）是国际通用的焦虑症状快速筛查工具，帮助您了解过去两周的焦虑程度。'
)
const disclaimerText = '⚠️ 本测评仅为筛查工具，不能替代专业诊断。如有疑虑请咨询专业心理医生。如您正在经历严重心理困扰，请拨打心理援助热线：希望24热线 400-161-9995。'
const severityText = computed(() => {
  if (testType.value === 'phq9') {
    return [
      { range: '0-4分', level: '无明显抑郁', color: '#22c55e' },
      { range: '5-9分', level: '轻度抑郁', color: '#eab308' },
      { range: '10-14分', level: '中度抑郁', color: '#f97316' },
      { range: '15-19分', level: '中重度抑郁', color: '#ef4444' },
      { range: '20-27分', level: '重度抑郁', color: '#dc2626' },
    ]
  }
  return [
    { range: '0-4分', level: '无明显焦虑', color: '#22c55e' },
    { range: '5-9分', level: '轻度焦虑', color: '#eab308' },
    { range: '10-14分', level: '中度焦虑', color: '#f97316' },
    { range: '15-21分', level: '重度焦虑', color: '#dc2626' },
  ]
})

// 状态
const currentStep = ref<'ready' | 'testing' | 'result'>('ready')
const questions = ref<ScreeningQuestion[]>([])
const options = ref<ScreeningOption[]>([])
const answers = ref<Record<string, number>>({})
const currentQuestionIndex = ref(0)
const result = ref<ScreeningResult | null>(null)
const loading = ref(false)
const submitting = ref(false)

// 当前题目
const currentQuestion = computed(() => questions.value[currentQuestionIndex.value])
const totalQuestions = computed(() => questions.value.length)
const answeredCount = computed(() => Object.keys(answers.value).length)
const progressPercent = computed(() =>
  totalQuestions.value > 0 ? Math.round((answeredCount.value / totalQuestions.value) * 100) : 0
)
const isFirstQuestion = computed(() => currentQuestionIndex.value === 0)
const isLastQuestion = computed(() => currentQuestionIndex.value === totalQuestions.value - 1)
const canNext = computed(() => answers.value[String(currentQuestion.value?.id)] !== undefined)

// 加载题目和已有结果
onMounted(async () => {
  try {
    const res = await getScreeningQuestions()
    if (res.success) {
      const data = testType.value === 'phq9' ? res.data.phq9 : res.data.gad7
      questions.value = data.questions
      options.value = data.options
    }

    // 检查是否已有结果
    const existingRes = await getScreeningResult(testType.value)
    if (existingRes.success && existingRes.data) {
      result.value = existingRes.data
      currentStep.value = 'result'
    }
  } catch {
    ElMessage.error('加载题目失败')
  }
})

// 开始测试
const startTest = () => {
  currentStep.value = 'testing'
  currentQuestionIndex.value = 0
  answers.value = {}
  result.value = null
}

// 选择答案
const selectAnswer = (value: number) => {
  if (!currentQuestion.value) return
  answers.value[String(currentQuestion.value.id)] = value

  // 自动跳到下一题
  if (!isLastQuestion.value) {
    setTimeout(() => {
      currentQuestionIndex.value++
    }, 200)
  }
}

// 上一题
const prevQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
  }
}

// 下一题
const nextQuestion = () => {
  if (currentQuestionIndex.value < totalQuestions.value - 1) {
    currentQuestionIndex.value++
  }
}

// 提交测试
const submitTest = async () => {
  if (answeredCount.value < totalQuestions.value) {
    ElMessage.warning(`请完成全部 ${totalQuestions.value} 道题目`)
    return
  }

  submitting.value = true
  try {
    const res = await submitScreeningTest(testType.value, answers.value)
    if (res.success) {
      result.value = res.data
      currentStep.value = 'result'
    } else {
      ElMessage.error(res.message || '提交失败')
    }
  } catch {
    ElMessage.error('提交测评失败')
  } finally {
    submitting.value = false
  }
}

// 重新测试
const retakeTest = () => {
  startTest()
}

// 返回
const goBack = () => {
  router.push('/profile')
}

// 获取严重程度颜色
const getSeverityColor = (severity: string) => {
  const colors: Record<string, string> = {
    'none': '#22c55e',
    'mild': '#eab308',
    'moderate': '#f97316',
    'moderately-severe': '#ef4444',
    'severe': '#dc2626',
  }
  return colors[severity] || '#94a3b8'
}
</script>

<template>
  <div class="screening-page">
    <!-- 头部 -->
    <div class="screening-header">
      <div class="back-btn" @click="goBack">
        <el-icon :size="20"><ArrowLeft /></el-icon>
        <span>返回</span>
      </div>
      <h1 class="screening-title">{{ testTitle }}</h1>
      <p class="screening-desc">{{ testDesc }}</p>
    </div>

    <!-- ====== 步骤 1: 准备页 ====== -->
    <div v-if="currentStep === 'ready'" class="screening-card ready-card">
      <div class="ready-info">
        <div class="ready-icon">📝</div>
        <div class="ready-meta">
          <span class="ready-label">题目数量</span>
          <span class="ready-value">{{ totalQuestions }} 题</span>
        </div>
        <div class="ready-meta">
          <span class="ready-label">预计时间</span>
          <span class="ready-value">约 2 分钟</span>
        </div>
      </div>

      <!-- 评分标准 -->
      <div class="severity-reference">
        <h3>评分参考标准</h3>
        <div class="severity-list">
          <div
            v-for="item in severityText"
            :key="item.range"
            class="severity-row"
          >
            <span class="severity-dot" :style="{ background: item.color }"></span>
            <span class="severity-range">{{ item.range }}</span>
            <span class="severity-level">{{ item.level }}</span>
          </div>
        </div>
      </div>

      <!-- 选项说明 -->
      <div class="option-reference">
        <h3>选项说明</h3>
        <div class="option-list">
          <div class="option-row">
            <span class="option-score">0</span>
            <span>完全不会</span>
          </div>
          <div class="option-row">
            <span class="option-score">1</span>
            <span>好几天</span>
          </div>
          <div class="option-row">
            <span class="option-score">2</span>
            <span>一半以上的天数</span>
          </div>
          <div class="option-row">
            <span class="option-score">3</span>
            <span>几乎每天</span>
          </div>
        </div>
      </div>

      <p class="disclaimer">{{ disclaimerText }}</p>

      <el-button
        type="primary"
        size="large"
        class="start-btn"
        @click="startTest"
      >
        开始测评
      </el-button>
    </div>

    <!-- ====== 步骤 2: 答题页 ====== -->
    <div v-if="currentStep === 'testing'" class="screening-card testing-card">
      <!-- 进度条 -->
      <div class="progress-section">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <span class="progress-text">{{ answeredCount }} / {{ totalQuestions }}</span>
      </div>

      <!-- 题目卡片 -->
      <div class="question-card" v-if="currentQuestion">
        <div class="question-number">Q{{ currentQuestion.id }}</div>
        <div class="question-text">{{ currentQuestion.text }}</div>
      </div>

      <!-- 选项 -->
      <div class="options-grid">
        <div
          v-for="opt in options"
          :key="opt.value"
          class="option-card"
          :class="{
            selected: answers[String(currentQuestion?.id)] === opt.value,
          }"
          @click="selectAnswer(opt.value)"
        >
          <div class="option-score-badge">{{ opt.value }}</div>
          <div class="option-label">{{ opt.label }}</div>
        </div>
      </div>

      <!-- 导航 -->
      <div class="question-nav">
        <el-button
          :disabled="isFirstQuestion"
          @click="prevQuestion"
          size="large"
        >
          上一题
        </el-button>
        <span class="question-indicator">{{ currentQuestionIndex + 1 }} / {{ totalQuestions }}</span>
        <el-button
          v-if="!isLastQuestion"
          type="primary"
          size="large"
          :disabled="!canNext"
          @click="nextQuestion"
        >
          下一题
        </el-button>
        <el-button
          v-else
          type="primary"
          size="large"
          :loading="submitting"
          @click="submitTest"
        >
          提交测评
        </el-button>
      </div>
    </div>

    <!-- ====== 步骤 3: 结果页 ====== -->
    <div v-if="currentStep === 'result' && result" class="screening-card result-card">
      <!-- 评分环 -->
      <div class="result-score-section">
        <div
          class="result-score-circle"
          :style="{ borderColor: getSeverityColor(result.severity) }"
        >
          <span
            class="result-score-number"
            :style="{ color: getSeverityColor(result.severity) }"
          >
            {{ result.totalScore }}
          </span>
          <span class="result-score-max">/ {{ testType === 'phq9' ? 27 : 21 }}</span>
        </div>
        <div
          class="result-severity-badge"
          :style="{
            background: getSeverityColor(result.severity) + '18',
            color: getSeverityColor(result.severity),
            borderColor: getSeverityColor(result.severity) + '40',
          }"
        >
          {{ result.severityLabel }}
        </div>
      </div>

      <!-- 建议 -->
      <div class="result-recommendation">
        <div class="recommendation-header">
          <span>💡</span>
          <span>专业建议</span>
        </div>
        <p>{{ result.recommendation }}</p>
      </div>

      <!-- 严重程度参考 -->
      <div class="result-reference">
        <div class="ref-item" v-for="item in severityText" :key="item.range">
          <span class="ref-dot" :style="{ background: item.color }"></span>
          <span class="ref-range">{{ item.range }}</span>
          <span class="ref-label">{{ item.level }}</span>
          <span v-if="result.severityLabel === item.level" class="ref-you">← 您在这里</span>
        </div>
      </div>

      <p class="disclaimer">{{ disclaimerText }}</p>

      <!-- 操作按钮 -->
      <div class="result-actions">
        <el-button type="primary" size="large" @click="retakeTest">
          重新测试
        </el-button>
        <el-button size="large" @click="goBack">
          返回个人中心
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.screening-page {
  max-width: 640px;
  margin: 0 auto;
  padding: 40px 20px;
}

/* 头部 */
.screening-header {
  text-align: center;
  margin-bottom: 32px;

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    color: #6366f1;
    font-size: 14px;
    margin-bottom: 16px;
    transition: all 0.2s;

    &:hover {
      color: #4f46e5;
      transform: translateX(-4px);
    }
  }

  .screening-title {
    font-size: 28px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 8px;
  }

  .screening-desc {
    font-size: 14px;
    color: #64748b;
    margin: 0;
    line-height: 1.6;
  }
}

/* 卡片基础 */
.screening-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #f1f5f9;
}

/* ====== 准备页 ====== */
.ready-card {
  text-align: center;
}

.ready-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 32px;
  margin-bottom: 28px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 14px;

  .ready-icon {
    font-size: 36px;
  }

  .ready-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .ready-label {
      font-size: 12px;
      color: #94a3b8;
    }

    .ready-value {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
    }
  }
}

.severity-reference,
.option-reference {
  margin-bottom: 24px;
  text-align: left;

  h3 {
    font-size: 15px;
    font-weight: 600;
    color: #475569;
    margin: 0 0 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f1f5f9;
  }
}

.severity-list {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .severity-row {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;

    .severity-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .severity-range {
      font-weight: 600;
      color: #475569;
      min-width: 50px;
    }

    .severity-level {
      color: #64748b;
    }
  }
}

.option-list {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .option-row {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    color: #475569;

    .option-score {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: #6366f1;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
    }
  }
}

.disclaimer {
  font-size: 13px;
  color: #f97316;
  line-height: 1.6;
  margin: 0 0 20px;
  padding: 12px 16px;
  background: #fff7ed;
  border-radius: 10px;
  text-align: left;
}

.start-btn {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
}

/* ====== 答题页 ====== */
.progress-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;

  .progress-bar {
    flex: 1;
    height: 8px;
    background: #f1f5f9;
    border-radius: 4px;
    overflow: hidden;

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #6366f1, #8b5cf6);
      border-radius: 4px;
      transition: width 0.3s ease;
    }
  }

  .progress-text {
    font-size: 14px;
    font-weight: 600;
    color: #6366f1;
    min-width: 60px;
    text-align: right;
  }
}

.question-card {
  background: #f8fafc;
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 24px;
  text-align: center;

  .question-number {
    font-size: 13px;
    font-weight: 700;
    color: #6366f1;
    margin-bottom: 12px;
    letter-spacing: 1px;
  }

  .question-text {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    line-height: 1.6;
  }
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;

  @media (max-width: 500px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.option-card {
  padding: 16px 8px;
  border-radius: 14px;
  border: 2px solid #e2e8f0;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #ffffff;

  &:hover {
    border-color: #6366f1;
    background: #f5f3ff;
  }

  &.selected {
    border-color: #6366f1;
    background: #eef2ff;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);

    .option-score-badge {
      background: #6366f1;
      color: #ffffff;
    }
  }

  .option-score-badge {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: #f1f5f9;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 16px;
    margin: 0 auto 8px;
    transition: all 0.2s ease;
  }

  .option-label {
    font-size: 13px;
    color: #475569;
    font-weight: 500;
  }
}

.question-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .question-indicator {
    font-size: 14px;
    color: #94a3b8;
    font-weight: 500;
  }
}

/* ====== 结果页 ====== */
.result-score-section {
  text-align: center;
  margin-bottom: 28px;
}

.result-score-circle {
  width: 130px;
  height: 130px;
  border-radius: 50%;
  border: 6px solid;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  background: #ffffff;

  .result-score-number {
    font-size: 42px;
    font-weight: 800;
    line-height: 1;
  }

  .result-score-max {
    font-size: 14px;
    color: #94a3b8;
  }
}

.result-severity-badge {
  display: inline-block;
  padding: 8px 24px;
  border-radius: 20px;
  border: 1px solid;
  font-size: 16px;
  font-weight: 700;
}

.result-recommendation {
  padding: 20px;
  background: #fefce8;
  border-radius: 14px;
  border: 1px solid #fde68a;
  margin-bottom: 24px;

  .recommendation-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 700;
    color: #92400e;
    margin-bottom: 8px;
    font-size: 15px;
  }

  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.7;
    color: #78350f;
  }
}

.result-reference {
  margin-bottom: 20px;
  text-align: left;

  .ref-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    font-size: 13px;

    .ref-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .ref-range {
      font-weight: 600;
      color: #475569;
      min-width: 48px;
    }

    .ref-label {
      color: #64748b;
    }

    .ref-you {
      color: #6366f1;
      font-weight: 700;
      font-size: 12px;
    }
  }
}

.result-actions {
  display: flex;
  gap: 12px;

  .el-button {
    flex: 1;
    border-radius: 12px;
    font-weight: 600;
    height: 44px;
  }
}
</style>
