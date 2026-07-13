<script setup lang="ts">
import { ref, onBeforeUnmount, computed } from 'vue'
import {
  Headset, VideoPause, VideoPlay, Timer,
  Sunny, Moon, Cloudy, WindPower, Loading,
} from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { storeToRefs } from 'pinia'
import { useThemeStyle } from '../../composables/useThemeStyle'

const router = useRouter()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const { isDark, containerStyle, toggleTheme } = useThemeStyle()

const defaultAvatar = '/default.jpeg'
const userAvatarUrl = computed(() => user.value?.avatar || defaultAvatar)
const showUserMenu = ref(false)

const toggleUserMenu = () => { showUserMenu.value = !showUserMenu.value }
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  const container = document.querySelector('.user-menu-container')
  if (container && !container.contains(target)) showUserMenu.value = false
}
const goToHome = () => router.push('/home')
const goToChat = () => router.push('/chat')

// ========== 声音类型定义（使用真实MP3音频文件） ==========
interface SoundType {
  id: string
  name: string
  icon: any
  description: string
  color: string
  src: string
}

// 音频来源：https://asoftmurmur.com（开源、无防盗链、专业环境音）
// CDN 子域名规则: label.length % 3 + 1 → st{1-3}
const soundTypes: SoundType[] = [
  {
    id: 'rain',
    name: '雨声',
    icon: Cloudy,
    description: '淅沥雨声，营造宁静氛围，安抚焦虑情绪',
    color: '#7eb8da',
    src: 'https://st2.asoftmurmur.com/assets/p/content/rain/main-rain.mp4',
  },
  {
    id: 'thunder',
    name: '雷声',
    icon: Moon,
    description: '远处雷鸣，沉稳而有力，助你深沉放松',
    color: '#5b6eab',
    src: 'https://st2.asoftmurmur.com/assets/p/content/thunder/main-thunder.mp4',
  },
  {
    id: 'waves',
    name: '海浪',
    icon: Headset,
    description: '潮起潮落，舒缓减压，仿佛置身海边',
    color: '#4a90d9',
    src: 'https://st3.asoftmurmur.com/assets/p/content/waves/main-waves.mp4',
  },
  {
    id: 'wind',
    name: '风声',
    icon: WindPower,
    description: '微风拂面，轻柔自然，放松紧绷的神经',
    color: '#89b4c4',
    src: 'https://st2.asoftmurmur.com/assets/p/content/wind/main-wind.mp4',
  },
  {
    id: 'birds',
    name: '鸟鸣',
    icon: Sunny,
    description: '清脆鸟鸣，仿佛置身林间，回归自然怀抱',
    color: '#6b9e3a',
    src: 'https://st3.asoftmurmur.com/assets/p/content/birds/main-birds.mp4',
  },
  {
    id: 'fire',
    name: '篝火',
    icon: Sunny,
    description: '噼啪作响的篝火声，温暖安心，伴你入眠',
    color: '#e8943a',
    src: 'https://st2.asoftmurmur.com/assets/p/content/fire/main-fire.mp4',
  },
]

// ========== 音频播放 ==========
const audioRef = ref<HTMLAudioElement | null>(null)
const activeSound = ref<string | null>(null)
const isPlaying = ref(false)
const isLoading = ref(false)
const volume = ref(0.5)
const timerMinutes = ref(0)
const timerRemaining = ref(0)
const timerActive = ref(false)
let timerInterval: ReturnType<typeof setInterval> | null = null

// 保存旧 audio 的事件引用，用于彻底清理
let lastAudio: HTMLAudioElement | null = null
let lastAudioEvents: { type: string; handler: () => void }[] = []

function startSound(soundId: string) {
  const sound = soundTypes.find(s => s.id === soundId)
  if (!sound) return

  // === 彻底清理旧音频 ===
  // 1. 清理旧的 Audio 元素
  if (lastAudio) {
    lastAudio.pause()
    // 移除所有已注册的事件监听
    lastAudioEvents.forEach(({ type, handler }) => {
      lastAudio!.removeEventListener(type, handler)
    })
    lastAudio.src = '' // 触发卸载
    lastAudio.load()   // 确保立即卸载
    lastAudio = null
    lastAudioEvents = []
  }
  // 2. 清理 ref（可能与 lastAudio 是同一个）
  if (audioRef.value) {
    audioRef.value.pause()
    audioRef.value.src = ''
    audioRef.value = null
  }
  // 3. 停止 AudioContext 回退音源
  stopAudioCtx()

  // === 创建新音频 ===
  const audio = new Audio()
  audio.src = sound.src
  audio.loop = true
  audio.volume = volume.value * 0.7
  audio.preload = 'auto'

  audioRef.value = audio
  lastAudio = audio
  activeSound.value = soundId
  isLoading.value = true

  // 绑定事件并记录引用，以便切换时移除
  const onCanPlayThrough = () => {
    isLoading.value = false
    audio.play().catch(() => {
      isLoading.value = false
    })
    isPlaying.value = true
  }
  const onPlaying = () => {
    isLoading.value = false
    isPlaying.value = true
  }
  const onError = () => {
    isLoading.value = false
    isPlaying.value = false
    stopTimer()
    fallbackToNoise()
  }

  audio.addEventListener('canplaythrough', onCanPlayThrough)
  audio.addEventListener('playing', onPlaying)
  audio.addEventListener('error', onError)

  lastAudioEvents = [
    { type: 'canplaythrough', handler: onCanPlayThrough },
    { type: 'playing', handler: onPlaying },
    { type: 'error', handler: onError },
  ]

  audio.load()
}

function fallbackToNoise() {
  // 创建AudioContext来播放合成白噪音作为回退
  const ctx = new AudioContext()
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 10, ctx.sampleRate)
  const data  = buffer.getChannelData(0)

  // 粉红噪音（比纯白噪音更悦耳）
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + white * 0.0555179
    b1 = 0.99332 * b1 + white * 0.0750759
    b2 = 0.96900 * b2 + white * 0.1538520
    b3 = 0.86650 * b3 + white * 0.3104856
    b4 = 0.55000 * b4 + white * 0.5329522
    b5 = -0.7616 * b5 - white * 0.0168980
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.09
    b6 = white * 0.115926
  }

  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.loop = true
  const gain = ctx.createGain()
  gain.gain.value = volume.value * 0.5
  src.connect(gain)
  gain.connect(ctx.destination)
  src.start()

  // 清理旧的，存新的
  stopAudioCtx()
  audioCtxRef = { ctx, src, gain }
  isPlaying.value = true
}

let audioCtxRef: { ctx: AudioContext; src: AudioBufferSourceNode; gain: GainNode } | null = null

function stopAudioCtx() {
  if (audioCtxRef) {
    try { audioCtxRef.src.stop() } catch (_) { /* */ }
    audioCtxRef.ctx.close()
    audioCtxRef = null
  }
}

function stopSound() {
  // 清理旧 Audio 事件
  if (lastAudio) {
    lastAudio.pause()
    lastAudioEvents.forEach(({ type, handler }) => {
      lastAudio!.removeEventListener(type, handler)
    })
    lastAudio.src = ''
    lastAudio.load()
    lastAudio = null
    lastAudioEvents = []
  }
  if (audioRef.value) {
    audioRef.value.pause()
    audioRef.value.src = ''
    audioRef.value = null
  }
  stopAudioCtx()
  activeSound.value = null
  isPlaying.value = false
  isLoading.value = false
  stopTimer()
}

function toggleSound(soundId: string) {
  if (activeSound.value === soundId) {
    if (isPlaying.value) {
      audioRef.value?.pause()
      isPlaying.value = false
      pauseTimer()
    } else {
      audioRef.value?.play().catch(() => {})
      isPlaying.value = true
      resumeTimer()
    }
  } else {
    startSound(soundId)
  }
}

function handleVolumeChange(val: number) {
  volume.value = val
  if (audioRef.value) {
    audioRef.value.volume = val * 0.7
  }
  if (audioCtxRef) {
    audioCtxRef.gain.gain.value = val * 0.5
  }
}

// ========== 定时器 ==========
function setTimer(minutes: number) {
  stopTimer()
  timerMinutes.value = minutes
  timerRemaining.value = minutes * 60
  timerActive.value = true
  timerInterval = setInterval(() => {
    timerRemaining.value--
    if (timerRemaining.value <= 0) {
      stopSound()
      stopTimer()
    }
  }, 1000)
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = null
  timerActive.value = false
  timerMinutes.value = 0
  timerRemaining.value = 0
}

function pauseTimer() {
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = null
}

function resumeTimer() {
  if (timerActive.value && timerRemaining.value > 0) {
    timerInterval = setInterval(() => {
      timerRemaining.value--
      if (timerRemaining.value <= 0) {
        stopSound()
        stopTimer()
      }
    }, 1000)
  }
}

const formattedTime = computed(() => {
  const m = Math.floor(timerRemaining.value / 60)
  const s = timerRemaining.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

// ========== 生命周期 ==========
onBeforeUnmount(() => {
  stopSound()
  stopTimer()
  document.removeEventListener('click', handleClickOutside)
})

import { onMounted } from 'vue'
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="relax-container" :style="containerStyle">
    <ThemeDecorations :isDark="isDark" @toggle="toggleTheme" />

    <!-- 头部导航 -->
    <div class="header">
      <div class="header-content">
        <div class="logo" @click="goToHome" style="cursor: pointer">
          <el-icon :size="28"><Headset /></el-icon>
          <span>白噪音 · 助眠放松</span>
        </div>
        <div class="nav-items">
          <el-button text @click="goToHome">首页</el-button>
          <el-button text @click="goToChat">AI对话</el-button>
          <div class="user-menu-container">
            <div class="user-avatar-section" @click.stop="toggleUserMenu">
              <img :src="userAvatarUrl" alt="头像" class="user-avatar" />
            </div>
            <div v-show="showUserMenu" class="user-dropdown-menu">
              <div class="menu-header">
                <img :src="userAvatarUrl" alt="头像" class="menu-avatar" />
                <div class="menu-user-info">
                  <div class="menu-username">{{ user?.username }}</div>
                  <div class="menu-email">{{ user?.email }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主内容 -->
    <div class="main-content">
      <div class="page-header">
        <h1>白噪音放松</h1>
        <p>选择一种声音，闭上眼睛，享受片刻宁静</p>
      </div>

      <!-- 声音卡片 -->
      <div class="sound-grid">
        <div
          v-for="sound in soundTypes"
          :key="sound.id"
          :class="['sound-card', { active: activeSound === sound.id }]"
          @click="toggleSound(sound.id)"
        >
          <div class="sound-icon" :style="{ background: sound.color }">
            <component :is="sound.icon" :size="36" />
          </div>
          <h3>{{ sound.name }}</h3>
          <p>{{ sound.description }}</p>
          <div class="play-indicator" v-if="activeSound === sound.id">
            <el-icon :size="20" v-if="isLoading" class="spin-icon"><Loading /></el-icon>
            <el-icon :size="20" v-else-if="isPlaying"><VideoPause /></el-icon>
            <el-icon :size="20" v-else><VideoPlay /></el-icon>
          </div>
        </div>
      </div>

      <!-- 控制面板 -->
      <div v-if="activeSound" class="control-panel">
        <div class="control-row">
          <label>音量</label>
          <el-slider
            v-model="volume"
            :min="0"
            :max="1"
            :step="0.05"
            @input="handleVolumeChange"
            class="volume-slider"
          />
          <span class="volume-label">{{ Math.round(volume * 100) }}%</span>
        </div>

        <div class="control-row">
          <label>定时关闭</label>
          <div class="timer-buttons">
            <el-button
              v-for="mins in [15, 30, 45, 60]"
              :key="mins"
              :type="timerMinutes === mins ? 'primary' : 'default'"
              size="small"
              round
              @click.stop="setTimer(mins)"
            >
              {{ mins }}分钟
            </el-button>
            <el-button
              v-if="timerActive"
              size="small"
              type="danger"
              round
              @click.stop="stopTimer"
            >
              取消
            </el-button>
          </div>
        </div>

        <div v-if="timerActive" class="timer-display">
          <el-icon :size="20"><Timer /></el-icon>
          <span>剩余 {{ formattedTime }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.relax-container {
  min-height: 100vh;
  background: linear-gradient(to bottom, #0f0c29 0%, #302b63 50%, #24243e 100%);
  position: relative;
  overflow-x: hidden;
  transition: background 1.5s ease-in-out;
}

.header {
  position: fixed;
  top: 0; left: 0; right: 0;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  z-index: 50;

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #fff;
    font-size: 18px;
    font-weight: 600;
  }

  .nav-items {
    display: flex;
    gap: 12px;
    align-items: center;

    .el-button { color: rgba(255,255,255,0.85); font-size: 14px;
      &:hover { color: #667eea; }
    }

    .user-menu-container { position: relative; }
    .user-avatar-section {
      cursor: pointer;
      .user-avatar {
        width: 36px; height: 36px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid rgba(255,255,255,0.3);
      }
    }
    .user-dropdown-menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      min-width: 200px;
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(20px);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      padding: 14px;
      z-index: 100;
      .menu-header {
        display: flex; align-items: center; gap: 10px;
        .menu-avatar { width: 40px; height: 40px; border-radius: 50%; }
        .menu-username { font-size: 14px; font-weight: 600; color: #1e293b; }
        .menu-email { font-size: 11px; color: #64748b; }
      }
    }
  }
}

.main-content {
  padding-top: 100px;
  max-width: 1000px;
  margin: 0 auto;
  padding-left: 24px;
  padding-right: 24px;
  padding-bottom: 60px;
}

.page-header {
  text-align: center;
  margin-bottom: 48px;
  h1 {
    font-size: 36px; font-weight: 700;
    color: #fff; margin: 0 0 12px;
  }
  p {
    font-size: 16px;
    color: rgba(255,255,255,0.7);
    margin: 0;
  }
}

.sound-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 40px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.sound-card {
  background: rgba(255,255,255,0.08);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  padding: 32px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(255,255,255,0.25);
    background: rgba(255,255,255,0.12);
  }

  &.active {
    border-color: #667eea;
    background: rgba(102,126,234,0.15);
    box-shadow: 0 0 30px rgba(102,126,234,0.2);
  }

  .sound-icon {
    width: 72px; height: 72px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    color: #fff;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  }

  h3 {
    font-size: 18px; font-weight: 600;
    color: #1a0707; margin: 0 0 8px;
  }

  p {
    font-size: 13px;
    color: rgba(20, 7, 7, 0.6);
    margin: 0;
    line-height: 1.5;
  }

  .play-indicator {
    position: absolute;
    top: 12px; right: 12px;
    width: 32px; height: 32px;
    border-radius: 50%;
    background: #667eea;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.control-panel {
  background: rgba(255,255,255,0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  padding: 28px 32px;
  animation: fadeIn 0.4s ease;

  .control-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;

    &:last-child { margin-bottom: 0; }

    label {
      font-size: 14px; font-weight: 500;
      color: rgba(255,255,255,0.8);
      min-width: 70px;
    }
  }

  .volume-slider {
    flex: 1;
  }

  .volume-label {
    font-size: 14px;
    color: rgba(255,255,255,0.6);
    min-width: 40px;
  }

  .timer-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .timer-display {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #667eea;
    font-size: 16px;
    font-weight: 600;
    padding: 12px 20px;
    background: rgba(102,126,234,0.1);
    border-radius: 12px;
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
