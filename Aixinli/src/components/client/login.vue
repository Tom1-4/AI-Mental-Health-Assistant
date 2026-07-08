<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import {
  ChatDotRound,
  Lock,
  User as UserIcon,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { useAuthStore } from "../../stores/auth";
import { useThemeStyle } from "../../composables/useThemeStyle";

const router = useRouter();
const authStore = useAuthStore();
const { isDark, containerStyle, toggleTheme } = useThemeStyle();

const loginForm = reactive({
  username: "",
  password: "",
});

const loading = ref(false);
const showPlatformDialog = ref(false);
const currentUser = ref<any>(null);

const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning("请输入用户名/邮箱和密码");
    return;
  }

  loading.value = true;
  try {
    // 调用后端API登录
    const result = await authStore.login(
      loginForm.username,
      loginForm.password
    );

    if (result.success) {
      sessionStorage.setItem("clientAuthenticated", "true");
      // 如果是管理员，显示选择平台的对话框
      if (result.role === "admin") {
        currentUser.value = result;
        showPlatformDialog.value = true;
        ElMessage.success("管理员登录成功");
      } else {
        router.push("/home");
        ElMessage.success(result.message);
      }
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    ElMessage.error("登录失败");
  } finally {
    loading.value = false;
  }
};

const goToAdmin = () => {
  showPlatformDialog.value = false;
  router.push("/back/user");
};

const goToClient = () => {
  showPlatformDialog.value = false;
  router.push("/home");
};

const goToRegister = () => {
  router.push("/register");
};
</script>

<template>
  <div class="login-container" :style="containerStyle">
    <!-- 太阳 -->
    <!-- 天空装饰 + 主题切换 -->
    <ThemeDecorations :isDark="isDark" @toggle="toggleTheme" />

    <div class="login-box">
      <div class="login-header">
        <div class="logo-icon">
          <el-icon :size="48">
            <ChatDotRound />
          </el-icon>
        </div>
        <h1 class="login-title">AI 心理健康助手</h1>
        <p class="login-subtitle">欢迎回来，请登录您的账号</p>
      </div>

      <el-form class="login-form" @submit.prevent="handleLogin">
        <el-form-item>
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名或邮箱"
            size="large"
            clearable
          >
            <template #prefix>
              <el-icon><UserIcon /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleLogin"
            class="login-button"
          >
            {{ loading ? "登录中..." : "登录" }}
          </el-button>
        </el-form-item>

        <div class="login-tips">
          <span class="tip-text">还没有账号？</span>
          <el-link type="primary" underline="never" @click="goToRegister"
            >立即注册</el-link
          >
        </div>
      </el-form>
    </div>

    <!-- 管理员选择平台对话框 -->
    <el-dialog
      v-model="showPlatformDialog"
      title="选择登录平台"
      width="500px"
      :close-on-click-modal="false"
      class="platform-dialog"
    >
      <div class="platform-content">
        <p class="tip-text">检测到您是管理员，请选择要登录的平台：</p>
        <div class="platform-buttons">
          <button class="platform-button admin-button" @click="goToAdmin">
            <div class="button-icon">🔧</div>
            <div class="button-title">B端 - 后台管理</div>
            <div class="button-desc">管理用户、数据等内容</div>
          </button>
          <button class="platform-button client-button" @click="goToClient">
            <div class="button-icon">🏠</div>
            <div class="button-title">C端 - 客户端</div>
            <div class="button-desc">使用AI助手等客户端功能</div>
          </button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(to bottom, #0f0c29 0%, #302b63 50%, #24243e 100%);
  position: relative;
  overflow: hidden;
  transition: background 1.5s ease-in-out;
}

/* 太阳/月亮 */
.celestial-body {
  position: absolute;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  top: 15%;
  right: 20%;
}

/* 太阳样式 */
.celestial-body.sun {
  background: radial-gradient(circle, #ffd700 0%, #ffa500 50%, #ff8c00 100%);
  box-shadow: 0 0 60px 20px rgba(255, 215, 0, 0.6),
    0 0 100px 40px rgba(255, 165, 0, 0.4), 0 0 140px 60px rgba(255, 140, 0, 0.2);
}

/* 太阳升起 */
.celestial-body.sun:not(.setting) {
  animation: sunrise 1.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 太阳落下 */
.celestial-body.sun.setting {
  animation: sunset 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

/* 月亮样式 */
.celestial-body.moon {
  background: radial-gradient(
    circle at 30% 30%,
    #f5f5dc 0%,
    #e6e6fa 50%,
    #d8bfd8 100%
  );
  box-shadow: 0 0 40px 10px rgba(255, 255, 255, 0.5),
    inset -15px -15px 20px rgba(0, 0, 0, 0.1);
}

/* 月亮升起 */
.celestial-body.moon:not(.setting) {
  animation: moonrise 1.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 月亮落下 */
.celestial-body.moon.setting {
  animation: moonset 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

/* 日出动画 (从左下升起) */
@keyframes sunrise {
  0% {
    transform: translateX(-200vw) translateY(100vh);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateX(0) translateY(0);
    opacity: 1;
  }
}

/* 日落动画 (向右下落下) */
@keyframes sunset {
  0% {
    transform: translateX(0) translateY(0);
    opacity: 1;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateX(200vw) translateY(100vh);
    opacity: 0;
  }
}

/* 月亮升起动画 */
@keyframes moonrise {
  0% {
    transform: translateX(-200vw) translateY(50vh);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateX(0) translateY(0);
    opacity: 1;
  }
}

/* 月亮落下动画 */
@keyframes moonset {
  0% {
    transform: translateX(0) translateY(0);
    opacity: 1;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateX(200vw) translateY(50vh);
    opacity: 0;
  }
}

/* 云朵 */
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
  content: "";
  position: absolute;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
}

.cloud-1 {
  width: 100px;
  height: 40px;
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.cloud-1::before {
  width: 50px;
  height: 50px;
  top: -25px;
  left: 15px;
}

.cloud-1::after {
  width: 40px;
  height: 40px;
  top: -20px;
  left: 45px;
}

.cloud-2 {
  width: 120px;
  height: 45px;
  top: 35%;
  right: 15%;
  animation-delay: 5s;
}

.cloud-2::before {
  width: 60px;
  height: 60px;
  top: -30px;
  left: 20px;
}

.cloud-2::after {
  width: 45px;
  height: 45px;
  top: -25px;
  left: 55px;
}

.cloud-3 {
  width: 80px;
  height: 35px;
  top: 50%;
  left: 30%;
  animation-delay: 10s;
}

.cloud-3::before {
  width: 40px;
  height: 40px;
  top: -20px;
  left: 10px;
}

.cloud-3::after {
  width: 35px;
  height: 35px;
  top: -18px;
  left: 35px;
}

@keyframes floatCloud {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(30px);
  }
}

/* 主题切换按钮 */
.theme-toggle {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 100;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }

  &:active {
    transform: scale(0.95);
  }

  .toggle-icon {
    color: #ffffff;
    transition: color 0.3s ease;
  }
}

.login-box {
  width: 420px;
  padding: 48px 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  position: relative;
  z-index: 10;
  animation: slideUp 0.6s ease-out;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 12px 32px rgba(102, 126, 234, 0.6);
  }
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 8px 0;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.login-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.login-form {
  .el-form-item {
    margin-bottom: 24px;
  }

  :deep(.el-input__wrapper) {
    border-radius: 12px;
    padding: 8px 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
    }

    &.is-focus {
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
    }
  }

  :deep(.el-input__inner) {
    font-size: 15px;
  }

  :deep(.el-input__prefix) {
    color: #94a3b8;
  }
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
  }

  &:active {
    transform: translateY(0);
  }
}

.login-tips {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;

  .tip-text {
    color: #64748b;
  }
}

.admin-login-link {
  text-align: center;
  margin-top: 12px;
}

/* 流星雨背景 */
.meteor-shower {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  overflow: hidden;
}

/* 星星 */
.star {
  position: absolute;
  width: 3px;
  height: 3px;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 6px 2px rgba(255, 255, 255, 0.8);
  animation: twinkle 2s ease-in-out infinite;
}

.star-1 {
  top: 5%;
  left: 10%;
  animation-delay: 0s;
}
.star-2 {
  top: 8%;
  left: 25%;
  animation-delay: 0.3s;
  width: 2px;
  height: 2px;
}
.star-3 {
  top: 12%;
  left: 40%;
  animation-delay: 0.6s;
}
.star-4 {
  top: 15%;
  left: 55%;
  animation-delay: 0.9s;
  width: 2px;
  height: 2px;
}
.star-5 {
  top: 18%;
  left: 70%;
  animation-delay: 1.2s;
}
.star-6 {
  top: 20%;
  left: 85%;
  animation-delay: 0.1s;
  width: 2px;
  height: 2px;
}
.star-7 {
  top: 25%;
  left: 12%;
  animation-delay: 1.5s;
}
.star-8 {
  top: 28%;
  left: 28%;
  animation-delay: 1.8s;
}
.star-9 {
  top: 30%;
  left: 45%;
  animation-delay: 0.2s;
  width: 2px;
  height: 2px;
}
.star-10 {
  top: 32%;
  left: 60%;
  animation-delay: 0.5s;
}
.star-11 {
  top: 35%;
  left: 75%;
  animation-delay: 0.8s;
  width: 2px;
  height: 2px;
}
.star-12 {
  top: 38%;
  left: 90%;
  animation-delay: 1.1s;
}
.star-13 {
  top: 42%;
  left: 8%;
  animation-delay: 1.4s;
}
.star-14 {
  top: 45%;
  left: 22%;
  animation-delay: 0.4s;
  width: 2px;
  height: 2px;
}
.star-15 {
  top: 48%;
  left: 38%;
  animation-delay: 0.7s;
}
.star-16 {
  top: 50%;
  left: 52%;
  animation-delay: 1s;
}
.star-17 {
  top: 52%;
  left: 68%;
  animation-delay: 0.2s;
  width: 2px;
  height: 2px;
}
.star-18 {
  top: 55%;
  left: 82%;
  animation-delay: 0.5s;
}
.star-19 {
  top: 58%;
  left: 15%;
  animation-delay: 0.8s;
}
.star-20 {
  top: 60%;
  left: 35%;
  animation-delay: 1.1s;
  width: 2px;
  height: 2px;
}
.star-21 {
  top: 62%;
  left: 50%;
  animation-delay: 1.4s;
}
.star-22 {
  top: 65%;
  left: 65%;
  animation-delay: 0.3s;
}
.star-23 {
  top: 68%;
  left: 80%;
  animation-delay: 0.6s;
  width: 2px;
  height: 2px;
}
.star-24 {
  top: 72%;
  left: 20%;
  animation-delay: 0.9s;
}
.star-25 {
  top: 75%;
  left: 45%;
  animation-delay: 1.2s;
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.5);
  }
}

/* 流星 */
.meteor {
  position: absolute;
  width: 120px;
  height: 2px;
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 0.9),
    rgba(255, 255, 255, 0)
  );
  border-radius: 50%;
  animation: meteorShower linear infinite;
  opacity: 0;
}

.meteor::before {
  content: "";
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
  top: 15%;
  left: 30%;
  width: 150px;
  animation-duration: 4s;
  animation-delay: 1.5s;
}

.meteor-3 {
  top: 10%;
  left: 50%;
  width: 100px;
  animation-duration: 3.5s;
  animation-delay: 2.5s;
}

.meteor-4 {
  top: 25%;
  left: 20%;
  width: 130px;
  animation-duration: 4.5s;
  animation-delay: 0.8s;
}

.meteor-5 {
  top: 20%;
  left: 70%;
  width: 110px;
  animation-duration: 3.2s;
  animation-delay: 2s;
}

.meteor-6 {
  top: 12%;
  left: 15%;
  width: 140px;
  animation-duration: 3.8s;
  animation-delay: 1.2s;
}

.meteor-7 {
  top: 18%;
  left: 45%;
  width: 125px;
  animation-duration: 4.2s;
  animation-delay: 2.8s;
}

.meteor-8 {
  top: 22%;
  left: 60%;
  width: 135px;
  animation-duration: 3.6s;
  animation-delay: 0.5s;
}

.meteor-9 {
  top: 28%;
  left: 35%;
  width: 115px;
  animation-duration: 4.1s;
  animation-delay: 1.8s;
}

.meteor-10 {
  top: 30%;
  left: 55%;
  width: 145px;
  animation-duration: 3.4s;
  animation-delay: 2.2s;
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
    transform: translateX(calc(100vw * 1.5)) translateY(calc(100vw * 1.5))
      rotate(45deg);
    opacity: 0;
  }
}

/* 平台选择对话框样式 */
.platform-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
  }
}

.platform-content {
  padding: 10px 0;
}

.platform-content .tip-text {
  font-size: 15px;
  color: #333;
  text-align: center;
  margin-bottom: 24px;
}

.platform-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.platform-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 16px;
  border-radius: 12px;
  border: 2px solid transparent;
  background: #f5f7fa;
  cursor: pointer;
  transition: all 0.3s ease;
  height: 140px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(-2px);
  }
}

.button-icon {
  font-size: 40px;
  margin-bottom: 8px;
}

.button-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.button-desc {
  font-size: 12px;
  color: #666;
  text-align: center;
  line-height: 1.4;
}

.admin-button:hover {
  border-color: #667eea;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.1) 0%,
    rgba(118, 75, 162, 0.1) 100%
  );
}

.client-button:hover {
  border-color: #10b981;
  background: linear-gradient(
    135deg,
    rgba(16, 185, 129, 0.1) 0%,
    rgba(52, 211, 153, 0.1) 100%
  );
}

.admin-button .button-title {
  color: #667eea;
}

.client-button .button-title {
  color: #10b981;
}
</style>
