<script setup lang="ts">
const props = defineProps<{
  isDark: boolean
}>()
</script>

<template>
  <!-- 太阳 -->
  <div v-if="!isDark" class="celestial-body sun"></div>

  <!-- 月亮 -->
  <div v-if="isDark" class="celestial-body moon"></div>

  <!-- 云朵 (白天显示) -->
  <div v-if="!isDark" class="clouds">
    <div class="cloud cloud-1"></div>
    <div class="cloud cloud-2"></div>
    <div class="cloud cloud-3"></div>
  </div>

  <!-- 流星雨背景 (夜晚显示) -->
  <div v-if="isDark" class="meteor-shower">
    <div class="star star-1"></div>
    <div class="star star-2"></div>
    <div class="star star-3"></div>
    <div class="star star-4"></div>
    <div class="star star-5"></div>
    <div class="star star-6"></div>
    <div class="star star-7"></div>
    <div class="star star-8"></div>
    <div class="star star-9"></div>
    <div class="star star-10"></div>
    <div class="star star-11"></div>
    <div class="star star-12"></div>
    <div class="star star-13"></div>
    <div class="star star-14"></div>
    <div class="star star-15"></div>
    <div class="meteor meteor-1"></div>
    <div class="meteor meteor-2"></div>
    <div class="meteor meteor-3"></div>
  </div>
</template>

<style scoped lang="scss">
/* 天体样式 */
.celestial-body {
  position: absolute;
  border-radius: 50%;
}

.sun {
  top: 60px;
  right: 100px;
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, #FFD700 0%, #FFA500 100%);
  box-shadow: 0 0 60px #FFD700;
  animation: pulse 3s ease-in-out infinite;
}

.moon {
  top: 80px;
  right: 120px;
  width: 60px;
  height: 60px;
  background: radial-gradient(circle, #f5f5dc 0%, #e0e0d0 100%);
  box-shadow: 0 0 30px rgba(245, 245, 220, 0.5);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
}

/* 云朵样式 */
.clouds {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;
  overflow: hidden;
}

.cloud {
  position: absolute;
  background: white;
  border-radius: 50%;
  opacity: 0.8;
  animation: float 20s linear infinite;
}

.cloud::before,
.cloud::after {
  content: '';
  position: absolute;
  background: white;
  border-radius: 50%;
}

.cloud-1 {
  width: 100px;
  height: 40px;
  top: 60px;
  left: -100px;
  animation-duration: 25s;
}

.cloud-1::before {
  width: 50px;
  height: 50px;
  top: -25px;
  left: 15px;
}

.cloud-1::after {
  width: 60px;
  height: 60px;
  top: -30px;
  left: 40px;
}

.cloud-2 {
  width: 120px;
  height: 50px;
  top: 100px;
  left: -150px;
  animation-duration: 30s;
  animation-delay: 5s;
}

.cloud-2::before {
  width: 60px;
  height: 60px;
  top: -30px;
  left: 20px;
}

.cloud-2::after {
  width: 70px;
  height: 70px;
  top: -35px;
  left: 50px;
}

.cloud-3 {
  width: 80px;
  height: 30px;
  top: 50px;
  left: -80px;
  animation-duration: 20s;
  animation-delay: 10s;
}

.cloud-3::before {
  width: 40px;
  height: 40px;
  top: -20px;
  left: 10px;
}

.cloud-3::after {
  width: 50px;
  height: 50px;
  top: -25px;
  left: 30px;
}

@keyframes float {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(calc(100vw + 200px));
  }
}

/* 星星样式 */
.star {
  position: absolute;
  width: 3px;
  height: 3px;
  background: white;
  border-radius: 50%;
  animation: twinkle 2s ease-in-out infinite;
}

.star:nth-child(odd) {
  animation-delay: 1s;
}

.star-1 { top: 10%; left: 10%; animation-delay: 0.1s; }
.star-2 { top: 15%; left: 30%; animation-delay: 0.3s; }
.star-3 { top: 8%; left: 50%; animation-delay: 0.5s; }
.star-4 { top: 20%; left: 70%; animation-delay: 0.7s; }
.star-5 { top: 12%; left: 90%; animation-delay: 0.9s; }
.star-6 { top: 25%; left: 20%; animation-delay: 0.2s; }
.star-7 { top: 18%; left: 40%; animation-delay: 0.4s; }
.star-8 { top: 22%; left: 60%; animation-delay: 0.6s; }
.star-9 { top: 14%; left: 80%; animation-delay: 0.8s; }
.star-10 { top: 28%; left: 5%; animation-delay: 1s; }
.star-11 { top: 30%; left: 25%; animation-delay: 0.1s; }
.star-12 { top: 26%; left: 45%; animation-delay: 0.3s; }
.star-13 { top: 32%; left: 65%; animation-delay: 0.5s; }
.star-14 { top: 29%; left: 85%; animation-delay: 0.7s; }
.star-15 { top: 35%; left: 15%; animation-delay: 0.9s; }

@keyframes twinkle {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

/* 流星样式 */
.meteor {
  position: absolute;
  width: 120px;
  height: 2px;
  background: linear-gradient(to right, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0));
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
  box-shadow: 0 0 10px 3px rgba(255, 255, 255, 0.9);
}

.meteor-1 {
  top: 5%;
  left: 10%;
  animation-duration: 3s;
  animation-delay: 0s;
}

.meteor-2 {
  top: 10%;
  left: 30%;
  width: 150px;
  animation-duration: 4s;
  animation-delay: 1.5s;
}

.meteor-3 {
  top: 8%;
  left: 50%;
  width: 100px;
  animation-duration: 3.5s;
  animation-delay: 2.5s;
}

@keyframes meteorShower {
  0% {
    transform: translateX(0) translateY(0) rotate(45deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 0.8;
  }
  100% {
    transform: translateX(calc(100vw * 1.5)) translateY(calc(100vw * 1.5)) rotate(45deg);
    opacity: 0;
  }
}
</style>
