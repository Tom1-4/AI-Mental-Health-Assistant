<script lang="ts">
import { defineComponent } from 'vue'
import { Sunny, Moon } from '@element-plus/icons-vue'

export default defineComponent({
  name: 'ThemeDecorations',
  components: { Sunny, Moon },
  props: {
    isDark: { type: Boolean, required: true },
    showToggle: { type: Boolean, default: true }
  },
  emits: ['toggle']
})
</script>

<template>
  <!-- 太阳 -->
  <div v-if="!isDark" class="celestial-body sun"></div>

  <!-- 月亮 -->
  <div v-if="isDark" class="celestial-body moon"></div>

  <!-- 云朵 (白天) -->
  <div v-if="!isDark" class="clouds">
    <div class="cloud cloud-1"></div>
    <div class="cloud cloud-2"></div>
    <div class="cloud cloud-3"></div>
  </div>

  <!-- 流星雨背景 (夜晚) -->
  <div v-if="isDark" class="meteor-shower">
    <div v-for="i in 25" :key="'star-' + i" :class="['star', 'star-' + i]"></div>
    <div v-for="i in 5" :key="'meteor-' + i" :class="['meteor', 'meteor-' + i]"></div>
  </div>

  <!-- 主题切换按钮 -->
  <div v-if="showToggle" class="theme-toggle" @click="$emit('toggle')">
    <el-icon :size="24" class="toggle-icon">
      <Sunny v-if="isDark" />
      <Moon v-else />
    </el-icon>
  </div>
</template>

<style scoped lang="scss">
/* ====== 天体（太阳/月亮） ====== */
.celestial-body {
  position: absolute;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  top: 15%;
  right: 10%;
  transition: all 1.5s ease;
}

.sun {
  background: linear-gradient(135deg, #ffd93d 0%, #ff8c00 100%);
  box-shadow: 0 0 60px rgba(255, 217, 61, 0.6), 0 0 100px rgba(255, 140, 0, 0.4);
  animation: sunPulse 4s ease-in-out infinite;
}

.moon {
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
  box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(200, 200, 200, 0.2);
  animation: moonFloat 6s ease-in-out infinite;
}

@keyframes sunPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes moonFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* ====== 云朵 ====== */
.clouds {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  overflow: hidden;
}

.cloud {
  position: absolute;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: floatCloud 20s ease-in-out infinite;
}

.cloud::before,
.cloud::after {
  content: '';
  position: absolute;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
}

.cloud-1 {
  width: 100px; height: 40px;
  top: 20%; left: 10%;
  animation-delay: 0s;
}
.cloud-1::before { width: 50px; height: 50px; top: -25px; left: 15px; }
.cloud-1::after  { width: 40px; height: 40px; top: -20px; left: 45px; }

.cloud-2 {
  width: 120px; height: 45px;
  top: 35%; right: 15%;
  animation-delay: 5s;
}
.cloud-2::before { width: 60px; height: 60px; top: -30px; left: 20px; }
.cloud-2::after  { width: 45px; height: 45px; top: -25px; left: 55px; }

.cloud-3 {
  width: 80px; height: 35px;
  top: 50%; left: 30%;
  animation-delay: 10s;
}
.cloud-3::before { width: 40px; height: 40px; top: -20px; left: 10px; }
.cloud-3::after  { width: 35px; height: 35px; top: -18px; left: 35px; }

@keyframes floatCloud {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(20px); }
}

/* ====== 流星雨 ====== */
.meteor-shower {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  overflow: hidden;
}

.star {
  position: absolute;
  background: #ffffff;
  border-radius: 50%;
  animation: twinkle 3s ease-in-out infinite;
}

.star:nth-child(odd)  { animation-duration: 2s; }
.star:nth-child(even) { animation-duration: 4s; }

/* 使用 CSS 变量控制随机位置，避免 SCSS @for 循环 */
.star-1  { width:3px; height:3px; top:5%;  left:10%; animation-delay:0s; }
.star-2  { width:2px; height:2px; top:8%;  left:25%; animation-delay:0.3s; }
.star-3  { width:3px; height:3px; top:12%; left:40%; animation-delay:0.6s; }
.star-4  { width:2px; height:2px; top:15%; left:55%; animation-delay:0.9s; }
.star-5  { width:3px; height:3px; top:18%; left:70%; animation-delay:1.2s; }
.star-6  { width:2px; height:2px; top:20%; left:85%; animation-delay:0.1s; }
.star-7  { width:3px; height:3px; top:25%; left:12%; animation-delay:1.5s; }
.star-8  { width:2px; height:2px; top:28%; left:28%; animation-delay:1.8s; }
.star-9  { width:3px; height:3px; top:30%; left:45%; animation-delay:0.2s; }
.star-10 { width:2px; height:2px; top:32%; left:60%; animation-delay:0.5s; }
.star-11 { width:3px; height:3px; top:35%; left:75%; animation-delay:0.8s; }
.star-12 { width:2px; height:2px; top:38%; left:90%; animation-delay:1.1s; }
.star-13 { width:3px; height:3px; top:42%; left:8%;  animation-delay:1.4s; }
.star-14 { width:2px; height:2px; top:45%; left:22%; animation-delay:0.4s; }
.star-15 { width:3px; height:3px; top:48%; left:38%; animation-delay:0.7s; }
.star-16 { width:2px; height:2px; top:50%; left:52%; animation-delay:1s; }
.star-17 { width:3px; height:3px; top:52%; left:68%; animation-delay:0.2s; }
.star-18 { width:2px; height:2px; top:55%; left:82%; animation-delay:0.5s; }
.star-19 { width:3px; height:3px; top:58%; left:15%; animation-delay:0.8s; }
.star-20 { width:2px; height:2px; top:60%; left:35%; animation-delay:1.1s; }
.star-21 { width:3px; height:3px; top:62%; left:50%; animation-delay:1.4s; }
.star-22 { width:2px; height:2px; top:65%; left:65%; animation-delay:0.3s; }
.star-23 { width:3px; height:3px; top:68%; left:80%; animation-delay:0.6s; }
.star-24 { width:2px; height:2px; top:72%; left:20%; animation-delay:0.9s; }
.star-25 { width:3px; height:3px; top:75%; left:45%; animation-delay:1.2s; }

@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* 流星 */
.meteor {
  position: absolute;
  width: 120px;
  height: 2px;
  background: linear-gradient(to right, rgba(255,255,255,0.9), transparent);
  border-radius: 50%;
  animation: meteorShower linear infinite;
  opacity: 0;
}

.meteor::before {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 10px 3px rgba(255,255,255,0.9);
}

.meteor-1 { top:5%;  left:10%; animation-duration:3s;  animation-delay:0s; }
.meteor-2 { top:15%; left:30%; width:150px; animation-duration:4s; animation-delay:1.5s; }
.meteor-3 { top:10%; left:50%; width:100px; animation-duration:3.5s; animation-delay:2.5s; }
.meteor-4 { top:25%; left:20%; width:130px; animation-duration:4.5s; animation-delay:0.8s; }
.meteor-5 { top:20%; left:70%; width:110px; animation-duration:3.2s; animation-delay:2s; }

@keyframes meteorShower {
  0%   { transform: translateX(0) translateY(0) rotate(45deg); opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 0.8; }
  100% { transform: translateX(150vw) translateY(150vw) rotate(45deg); opacity: 0; }
}

/* ====== 主题切换按钮 ====== */
.theme-toggle {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 100;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }

  .toggle-icon {
    color: #ffffff;
  }
}
</style>
