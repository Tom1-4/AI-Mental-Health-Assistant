<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  Lock,
  User as UserIcon,
  Message,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { useAuthStore } from "../../stores/auth";
import { useThemeStyle } from "../../composables/useThemeStyle";

const defaultAvatar = "/default.jpeg";

const router = useRouter();
const authStore = useAuthStore();
const { isDark, containerStyle, toggleTheme } = useThemeStyle();

const registerForm = reactive({
  username: "",
  password: "",
  confirmPassword: "",
  email: "",
});

const avatarUrl = ref<string>("");

// 初始化默认头像
onMounted(() => {
  avatarUrl.value = defaultAvatar;
});

const loading = ref(false);

const handleRegister = async () => {
  if (
    !registerForm.username ||
    !registerForm.password ||
    !registerForm.confirmPassword ||
    !registerForm.email
  ) {
    ElMessage.warning("请填写所有字段");
    return;
  }

  if (registerForm.password !== registerForm.confirmPassword) {
    ElMessage.error("两次输入的密码不一致");
    return;
  }

  if (registerForm.password.length < 6) {
    ElMessage.error("密码长度不能少于6位");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(registerForm.email)) {
    ElMessage.error("请输入有效的邮箱地址");
    return;
  }

  loading.value = true;
  try {
    // 调用后端注册API，使用默认头像
    const result = await authStore.register(
      registerForm.username,
      registerForm.email,
      registerForm.password,
      defaultAvatar
    );

    if (result.success) {
      ElMessage.success("注册成功，请登录");
      router.push("/");
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    ElMessage.error("注册失败");
  } finally {
    loading.value = false;
  }
};

const goToLogin = () => {
  router.push("/");
};
</script>

<template>
  <div class="register-container" :style="containerStyle">
    <!-- 太阳 -->
    <!-- 天空装饰 + 主题切换 -->
    <ThemeDecorations :isDark="isDark" @toggle="toggleTheme" />

    <div class="register-box">
      <div class="register-header">
        <h1 class="register-title">AI 心理健康助手</h1>
        <p class="register-subtitle">创建您的账号，开始心灵之旅</p>
      </div>

      <el-form class="register-form" @submit.prevent="handleRegister">
        <el-form-item>
          <el-input
            v-model="registerForm.username"
            placeholder="请输入用户名"
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
            v-model="registerForm.email"
            placeholder="请输入邮箱"
            size="large"
            clearable
          >
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码（至少6位）"
            size="large"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请确认密码"
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
            @click="handleRegister"
            class="register-button"
          >
            {{ loading ? "注册中..." : "注册" }}
          </el-button>
        </el-form-item>

        <div class="register-tips">
          <span class="tip-text">已有账号？</span>
          <el-link type="primary" underline="never" @click="goToLogin"
            >立即登录</el-link
          >
        </div>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.register-container {
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

.register-box {
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

.register-header {
  text-align: center;
  margin-bottom: 20px;
}

.register-title {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 8px 0;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.register-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.register-form {
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

.register-button {
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

.register-tips {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;

  .tip-text {
    color: #64748b;
  }
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
</style>
