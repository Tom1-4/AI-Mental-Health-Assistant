<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useThemeStyle } from '../../composables/useThemeStyle'
import {
  getMbtiQuestions,
  submitMbtiTest,
  getMyMbtiResult,
  type MbtiQuestion,
  type MbtiOption,
  type MbtiResult
} from '../../services/mbti'

const router = useRouter()
const { containerStyle } = useThemeStyle('soft')

// 状态
const loading = ref(true)
const submitting = ref(false)
const currentStep = ref<'ready' | 'testing' | 'result'>('ready')
const currentQuestionIndex = ref(0)
const questions = ref<MbtiQuestion[]>([])
const options = ref<MbtiOption[]>([])
const answers = ref<Record<string, number>>({})
const result = ref<MbtiResult | null>(null)
const errorMessage = ref('')

// 当前维度名称
const dimensionNames: Record<string, string> = {
  EI: '外向(E) vs 内向(I)',
  SN: '感觉(S) vs 直觉(N)',
  TF: '思维(T) vs 情感(F)',
  JP: '判断(J) vs 感知(P)'
}

const currentDimension = computed(() => {
  if (questions.value.length === 0) return ''
  return dimensionNames[questions.value[currentQuestionIndex.value]?.dimension] || ''
})

const progressPercent = computed(() => {
  return Math.round((Object.keys(answers.value).length / 28) * 100)
})

// 获取已答题数
const answeredCount = computed(() => Object.keys(answers.value).length)

// 加载题目
const loadQuestions = async () => {
  loading.value = true
  try {
    const response = await getMbtiQuestions()
    if (response.success && response.data) {
      questions.value = response.data.questions
      options.value = response.data.options
    } else {
      throw new Error('获取题目失败')
    }
  } catch (error: any) {
    errorMessage.value = error.message || '获取题目失败'
    ElMessage.error('获取题目失败')
  } finally {
    loading.value = false
  }
}

// 检查是否已有测试结果
const checkExistingResult = async () => {
  try {
    const response = await getMyMbtiResult()
    if (response.success && response.data) {
      result.value = response.data
      currentStep.value = 'result'
    } else {
      currentStep.value = 'ready'
    }
  } catch {
    currentStep.value = 'ready'
  }
}

// 开始测试
const startTest = () => {
  currentStep.value = 'testing'
  currentQuestionIndex.value = 0
  answers.value = {}
}

// 重新测试
const retakeTest = () => {
  result.value = null
  startTest()
}

// 选择答案
const selectAnswer = (value: number) => {
  const q = questions.value[currentQuestionIndex.value]
  answers.value[String(q.id)] = value

  if (currentQuestionIndex.value < questions.value.length - 1) {
    // 下一题
    currentQuestionIndex.value++
  } else {
    // 全部答完，提交
    submitTest()
  }
}

// 上一题
const prevQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
  }
}

// 下一题（已答题时）
const nextQuestion = () => {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++
  }
}

// 提交测试
const submitTest = async () => {
  submitting.value = true
  try {
    const response = await submitMbtiTest(answers.value)
    if (response.success && response.data) {
      result.value = response.data
      currentStep.value = 'result'
      ElMessage.success('测试完成！')
    } else {
      throw new Error(response.message || '提交失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '提交测试失败')
  } finally {
    submitting.value = false
  }
}

// 获取选项样式
const getOptionClass = (optionValue: number) => {
  const q = questions.value[currentQuestionIndex.value]
  const selected = answers.value[String(q?.id)]
  if (selected === optionValue) return 'option-item selected'
  return 'option-item'
}

// 返回
const goBack = () => {
  router.push('/home')
}

// 进入个人中心
const goToProfile = () => {
  router.push('/profile')
}

// 维度百分比转颜色
const getPercentColor = (percent: number) => {
  if (percent >= 70) return '#67C23A'
  if (percent >= 50) return '#409EFF'
  return '#E6A23C'
}

onMounted(() => {
  loadQuestions()
  checkExistingResult()
})
</script>

<template>
  <div class="mbti-container" :style="containerStyle">
    <!-- 头部 -->
    <div class="mbti-header">
      <el-button text @click="goBack" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h2 class="mbti-title">MBTI 人格测试</h2>
      <div style="width: 80px"></div>
    </div>

    <div class="mbti-content">
      <!-- 加载中 -->
      <div v-if="loading" class="loading-box">
        <el-icon class="is-loading" :size="48"><ArrowLeft /></el-icon>
        <p>加载题目中...</p>
      </div>

      <!-- 开始页 -->
      <div v-else-if="currentStep === 'ready'" class="ready-page">
        <div class="ready-card">
          <div class="ready-icon">🧠</div>
          <h1>MBTI 人格测试</h1>
          <p class="ready-desc">
            MBTI（Myers-Briggs Type Indicator）是世界上使用最广泛的人格评估工具之一。
            通过28道题目，帮助你了解自己在四个维度上的偏好：
          </p>
          <div class="dimension-intro">
            <div class="dim-item">
              <span class="dim-label">外向(E) vs 内向(I)</span>
              <span class="dim-desc">你从哪里获取能量</span>
            </div>
            <div class="dim-item">
              <span class="dim-label">感觉(S) vs 直觉(N)</span>
              <span class="dim-desc">你如何获取信息</span>
            </div>
            <div class="dim-item">
              <span class="dim-label">思维(T) vs 情感(F)</span>
              <span class="dim-desc">你如何做决定</span>
            </div>
            <div class="dim-item">
              <span class="dim-label">判断(J) vs 感知(P)</span>
              <span class="dim-desc">你如何对待生活</span>
            </div>
          </div>
          <div class="ready-info">
            <span>📋 共28道题目</span>
            <span>⏱️ 大约需要5-8分钟</span>
            <span>🔒 结果仅自己可见</span>
          </div>
          <el-button type="primary" size="large" class="start-btn" @click="startTest">
            开始测试
          </el-button>
          <p class="ready-tip">
            请根据您的真实感受作答，没有对错之分
          </p>
        </div>
      </div>

      <!-- 答题页 -->
      <div v-else-if="currentStep === 'testing'" class="testing-page">
        <!-- 进度条 -->
        <div class="progress-bar-wrap">
          <div class="progress-info">
            <span>第 {{ currentQuestionIndex + 1 }} / 28 题</span>
            <span>{{ progressPercent }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
        </div>

        <!-- 维度标签 -->
        <div class="dimension-tag">{{ currentDimension }}</div>

        <!-- 题目卡片 -->
        <div class="question-card" v-if="questions[currentQuestionIndex]">
          <div class="question-number">Q{{ questions[currentQuestionIndex].id }}</div>
          <div class="question-text">{{ questions[currentQuestionIndex].text }}</div>

          <!-- 选项 -->
          <div class="options-grid">
            <div
              v-for="option in options"
              :key="option.value"
              :class="getOptionClass(option.value)"
              @click="selectAnswer(option.value)"
            >
              <span class="option-value">{{ option.label }}</span>
            </div>
          </div>
        </div>

        <!-- 导航按钮 -->
        <div class="nav-buttons">
          <el-button
            @click="prevQuestion"
            :disabled="currentQuestionIndex === 0"
            size="large"
          >
            上一题
          </el-button>
          <span class="answered-count">已答 {{ answeredCount }} / 28</span>
          <el-button
            v-if="currentQuestionIndex < 27"
            @click="nextQuestion"
            :disabled="!answers[String(questions[currentQuestionIndex]?.id)]"
            size="large"
            type="primary"
          >
            下一题
          </el-button>
          <el-button
            v-else
            @click="submitTest"
            :loading="submitting"
            :disabled="answeredCount < 28"
            size="large"
            type="success"
          >
            提交测试
          </el-button>
        </div>
      </div>

      <!-- 结果页 -->
      <div v-else-if="currentStep === 'result' && result" class="result-page">
        <div class="result-header">
          <div class="result-type-badge">{{ result.type }}</div>
          <h1 class="result-type-name">{{ result.typeName }}</h1>
          <p class="result-type-desc">{{ result.typeDescription }}</p>
        </div>

        <!-- 特质标签 -->
        <div class="traits-section">
          <el-tag
            v-for="trait in result.typeTraits"
            :key="trait"
            size="large"
            effect="dark"
            class="trait-tag"
          >
            {{ trait }}
          </el-tag>
        </div>

        <!-- 四维度详情 -->
        <div class="dimensions-section">
          <h3>各维度分析</h3>
          <div class="dimension-cards">
            <div v-for="(dim, key) in result.dimensions" :key="key" class="dimension-card">
              <div class="dim-header">
                <span class="dim-name">{{ key === 'EI' ? '外向/内向' : key === 'SN' ? '感觉/直觉' : key === 'TF' ? '思维/情感' : '判断/感知' }}</span>
                <span class="dim-result" :style="{ color: dim.result === 'E' || dim.result === 'S' || dim.result === 'T' || dim.result === 'J' ? '#409EFF' : '#E6A23C' }">
                  {{ dim.result }}
                </span>
              </div>
              <div class="dim-bar-wrap">
                <div class="dim-bar">
                  <div
                    class="dim-bar-fill"
                    :style="{ width: dim.percent + '%', background: getPercentColor(dim.percent) }"
                  ></div>
                </div>
                <span class="dim-percent">{{ dim.percent }}%</span>
              </div>
              <p class="dim-desc">{{ dim.description }}</p>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="result-actions">
          <el-button size="large" type="primary" @click="retakeTest">
            重新测试
          </el-button>
          <el-button size="large" @click="goToProfile">
            查看个人中心
          </el-button>
          <el-button size="large" @click="goBack">
            返回首页
          </el-button>
        </div>

        <p class="result-time">
          测试时间：{{ new Date(result.createdAt).toLocaleString() }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mbti-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.mbti-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  z-index: 10;

  .back-btn {
    color: #666;
  }

  .mbti-title {
    font-size: 20px;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.mbti-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 24px;
  overflow-y: auto;
}

// 加载
.loading-box {
  text-align: center;
  margin-top: 120px;
  color: #64748b;

  p {
    margin-top: 16px;
    font-size: 16px;
  }
}

// 开始页
.ready-page {
  width: 100%;
  max-width: 680px;
}

.ready-card {
  background: #fff;
  border-radius: 20px;
  padding: 48px 40px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);

  .ready-icon {
    font-size: 64px;
    margin-bottom: 16px;
  }

  h1 {
    font-size: 32px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 16px;
  }

  .ready-desc {
    font-size: 15px;
    color: #64748b;
    line-height: 1.8;
    margin: 0 0 24px;
  }

  .dimension-intro {
    text-align: left;
    background: #f8fafc;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;

    .dim-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e2e8f0;

      &:last-child {
        border-bottom: none;
      }

      .dim-label {
        font-weight: 600;
        color: #334155;
      }

      .dim-desc {
        color: #94a3b8;
        font-size: 14px;
      }
    }
  }

  .ready-info {
    display: flex;
    justify-content: center;
    gap: 32px;
    margin-bottom: 32px;
    color: #64748b;
    font-size: 14px;
  }

  .start-btn {
    width: 240px;
    height: 52px;
    font-size: 18px;
    border-radius: 26px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
    }
  }

  .ready-tip {
    margin-top: 16px;
    font-size: 13px;
    color: #94a3b8;
  }
}

// 答题页
.testing-page {
  width: 100%;
  max-width: 720px;
}

.progress-bar-wrap {
  margin-bottom: 16px;

  .progress-info {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: #64748b;
    margin-bottom: 8px;
  }

  .progress-bar {
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;

    .progress-fill {
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 4px;
      transition: width 0.3s ease;
    }
  }
}

.dimension-tag {
  display: inline-block;
  padding: 6px 16px;
  background: linear-gradient(135deg, #667eea15, #764ba215);
  color: #667eea;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 24px;
}

.question-card {
  background: #fff;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);

  .question-number {
    font-size: 14px;
    color: #667eea;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .question-text {
    font-size: 20px;
    font-weight: 600;
    color: #1e293b;
    line-height: 1.6;
    margin-bottom: 32px;
  }
}

.options-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-item {
  padding: 16px 24px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
  text-align: center;

  .option-value {
    font-size: 16px;
    color: #475569;
    font-weight: 500;
  }

  &:hover {
    border-color: #667eea;
    background: #f0f4ff;
    transform: translateX(4px);
  }

  &.selected {
    border-color: #667eea;
    background: linear-gradient(135deg, #667eea15, #764ba215);
    transform: translateX(8px);

    .option-value {
      color: #667eea;
      font-weight: 600;
    }
  }
}

.nav-buttons {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 32px;

  .answered-count {
    font-size: 14px;
    color: #94a3b8;
  }
}

// 结果页
.result-page {
  width: 100%;
  max-width: 800px;
}

.result-header {
  text-align: center;
  background: #fff;
  border-radius: 20px;
  padding: 48px 40px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);

  .result-type-badge {
    display: inline-block;
    padding: 10px 32px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    font-size: 36px;
    font-weight: 800;
    border-radius: 16px;
    letter-spacing: 4px;
    margin-bottom: 16px;
  }

  .result-type-name {
    font-size: 28px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 12px;
  }

  .result-type-desc {
    font-size: 16px;
    color: #64748b;
    line-height: 1.8;
    margin: 0;
  }
}

.traits-section {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;

  .trait-tag {
    padding: 8px 20px;
    font-size: 15px;
    border-radius: 24px;
  }
}

.dimensions-section {
  background: #fff;
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);

  h3 {
    font-size: 20px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 20px;
  }

  .dimension-cards {
    display: grid;
    gap: 16px;
  }

  .dimension-card {
    padding: 20px;
    background: #f8fafc;
    border-radius: 12px;

    .dim-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .dim-name {
        font-size: 14px;
        color: #64748b;
      }

      .dim-result {
        font-size: 24px;
        font-weight: 800;
      }
    }

    .dim-bar-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;

      .dim-bar {
        flex: 1;
        height: 10px;
        background: #e2e8f0;
        border-radius: 5px;
        overflow: hidden;

        .dim-bar-fill {
          height: 100%;
          border-radius: 5px;
          transition: width 1s ease;
        }
      }

      .dim-percent {
        font-size: 14px;
        font-weight: 600;
        color: #475569;
        min-width: 42px;
      }
    }

    .dim-desc {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.6;
      margin: 0;
    }
  }
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
}

.result-time {
  text-align: center;
  font-size: 13px;
  color: #94a3b8;
}
</style>
