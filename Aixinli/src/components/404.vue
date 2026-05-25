<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="error-container">
    <div class="error-content">
      <div class="error-number">404</div>
      <div class="error-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M15 9l-6 6"/>
          <path d="M9 9l6 6"/>
        </svg>
      </div>
      <h1 class="error-title">页面不存在</h1>
      <p class="error-description">
        抱歉,您访问的页面可能已被删除、重命名或暂时不可用
      </p>
      <div class="error-actions">
        <el-button type="primary" size="large" @click="goHome" class="home-button">
          返回首页
        </el-button>
        <el-button size="large" @click="router.back()" class="back-button">
          返回上一页
        </el-button>
      </div>
    </div>

    <!-- 装饰元素 -->
    <div class="decorative-circle circle-1"></div>
    <div class="decorative-circle circle-2"></div>
    <div class="decorative-circle circle-3"></div>
  </div>
</template>

<style scoped lang="scss">
.error-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.error-content {
  text-align: center;
  position: relative;
  z-index: 10;
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-number {
  font-size: 180px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.15);
  line-height: 1;
  margin-bottom: -40px;
  position: relative;
  user-select: none;
  letter-spacing: -10px;
}

.error-icon {
  margin-bottom: 24px;
  color: rgba(255, 255, 255, 0.9);

  svg {
    width: 80px;
    height: 80px;
    animation: float 3s ease-in-out infinite;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.error-title {
  font-size: 36px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 16px 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  letter-spacing: 1px;
}

.error-description {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.85);
  max-width: 480px;
  margin: 0 auto 40px 0;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.home-button {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border: none;
  height: 48px;
  padding: 0 32px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(245, 87, 108, 0.4);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(245, 87, 108, 0.5);
  }

  &:active {
    transform: translateY(0);
  }
}

.back-button {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  height: 48px;
  padding: 0 32px;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
}

.decorative-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  pointer-events: none;
}

.circle-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  right: -100px;
  animation: rotate 20s linear infinite;
}

.circle-2 {
  width: 200px;
  height: 200px;
  bottom: -50px;
  left: -50px;
  animation: rotate 25s linear infinite reverse;
}

.circle-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  right: 10%;
  animation: rotate 15s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>