<script setup lang="ts">
import { computed, h, ref, onMounted, onUnmounted } from "vue";
import {
  ChatDotRound,
  User,
  Calendar,
  Clock,
  Sunny,
  Moon,
  ArrowDown,
} from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import { useThemeStore } from "../../stores/theme";
import { useAuthStore } from "../../stores/auth";
import { storeToRefs } from "pinia";
import { ElMessageBox, ElMessage } from "element-plus";

const defaultAvatar = "/default.jpeg";

// 自定义树图标组件
const TreeIcon = () => {
  return h(
    "svg",
    {
      viewBox: "0 0 24 24",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
    },
    [
      h("path", {
        d: "M12 2L4 10H7V18H10V14H14V18H17V10H20L12 2Z",
        fill: "currentColor",
        fillOpacity: "0.8",
      }),
      h("path", {
        d: "M8 18V22H16V18",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
      }),
    ]
  );
};

const router = useRouter();
const themeStore = useThemeStore();
const authStore = useAuthStore();
const { isDark } = storeToRefs(themeStore);
const { user } = storeToRefs(authStore);

// 用户头像
const userAvatarUrl = computed(() => {
  return user.value?.avatar || defaultAvatar;
});

// 下拉菜单显示状态
const showUserMenu = ref(false);

// 切换用户菜单
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value;
};

// 点击其他地方关闭菜单
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  const userMenuContainer = document.querySelector(".user-menu-container");
  if (userMenuContainer && !userMenuContainer.contains(target)) {
    showUserMenu.value = false;
  }
};

const containerStyle = computed(() => ({
  background: !isDark.value
    ? "linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 50%, #B0E0E6 100%)"
    : "linear-gradient(to bottom, #0f0c29 0%, #302b63 50%, #24243e 100%)",
}));

const toggleTheme = () => {
  themeStore.toggleTheme();
};

const goToChat = () => {
  router.push("/chat");
};

const goToTreehole = () => {
  router.push("/treehole");
};

const goToDiary = () => {
  router.push("/diary");
};

const goToProfile = () => {
  router.push("/profile");
};

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm("确定要退出登录吗？", "退出登录", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await authStore.logout();
    ElMessage.success("退出登录成功");
    router.push("/");
  } catch {
    // 用户取消退出
  }
};

// 添加点击事件监听
onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div class="home-container" :style="containerStyle">
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
      <div class="star star-16"></div>
      <div class="star star-17"></div>
      <div class="star star-18"></div>
      <div class="star star-19"></div>
      <div class="star star-20"></div>
      <div class="star star-21"></div>
      <div class="star star-22"></div>
      <div class="star star-23"></div>
      <div class="star star-24"></div>
      <div class="star star-25"></div>
      <div class="meteor meteor-1"></div>
      <div class="meteor meteor-2"></div>
      <div class="meteor meteor-3"></div>
      <div class="meteor meteor-4"></div>
      <div class="meteor meteor-5"></div>
    </div>

    <!-- 主题切换按钮 -->
    <div class="theme-toggle" @click="toggleTheme">
      <el-icon :size="24" class="toggle-icon">
        <Sunny v-if="isDark" />
        <Moon v-else />
      </el-icon>
    </div>

    <!-- 头部导航 -->
    <div class="header">
      <div class="header-content">
        <div class="logo">
          <el-icon :size="32">
            <ChatDotRound />
          </el-icon>
          <span>AI 心理健康助手</span>
        </div>
        <div class="nav-items">
          <el-button text @click="goToChat">
            <el-icon><ChatDotRound /></el-icon>
            开始对话
          </el-button>
          <el-button text @click="goToTreehole">
            <div class="tree-icon-small">
              <TreeIcon />
            </div>
            心灵树洞
          </el-button>
          <el-button text @click="goToDiary">
            <el-icon><Calendar /></el-icon>
            心情日记
          </el-button>

          <!-- 用户头像和下拉菜单 -->
          <div class="user-menu-container">
            <div class="user-avatar-section" @click.stop="toggleUserMenu">
              <img :src="userAvatarUrl" alt="用户头像" class="user-avatar" />
              <el-icon class="dropdown-arrow" :size="14">
                <ArrowDown />
              </el-icon>
            </div>

            <!-- 下拉菜单 -->
            <div v-show="showUserMenu" class="user-dropdown-menu">
              <div class="menu-header">
                <img :src="userAvatarUrl" alt="用户头像" class="menu-avatar" />
                <div class="menu-user-info">
                  <div class="menu-username">{{ user?.username }}</div>
                  <div class="menu-email">{{ user?.email }}</div>
                </div>
              </div>
              <div class="menu-divider"></div>
              <div class="menu-item" @click="goToProfile">
                <el-icon><User /></el-icon>
                <span>个人中心</span>
              </div>
              <div class="menu-item menu-item-danger" @click="handleLogout">
                <el-icon><User /></el-icon>
                <span>退出登录</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <div class="welcome-section">
        <div class="welcome-card">
          <div class="welcome-icon">
            <el-icon :size="80">
              <ChatDotRound />
            </el-icon>
          </div>
          <h1 class="welcome-title">欢迎回来！</h1>
          <p class="welcome-subtitle">让我们一起探索心理健康，获得专业指导</p>
          <div class="welcome-actions">
            <el-button
              type="primary"
              size="large"
              @click="goToChat"
              class="start-chat-btn"
            >
              开始对话
            </el-button>
            <el-button size="large" @click="goToTreehole"> 心灵树洞 </el-button>
            <el-button size="large" @click="goToDiary"> 心情日记 </el-button>
            <el-button size="large" @click="goToProfile"> 查看档案 </el-button>
          </div>
        </div>

        <div class="feature-cards">
          <div class="feature-card">
            <el-icon :size="48" class="feature-icon">
              <ChatDotRound />
            </el-icon>
            <h3>智能对话</h3>
            <p>与 AI 助手进行实时对话，获得专业心理建议</p>
          </div>

          <div class="feature-card">
            <el-icon :size="48" class="feature-icon">
              <Calendar />
            </el-icon>
            <h3>心理档案</h3>
            <p>记录您的心理健康历程，查看历史对话记录</p>
          </div>

          <div class="feature-card">
            <el-icon :size="48" class="feature-icon">
              <Clock />
            </el-icon>
            <h3>全天候服务</h3>
            <p>24 小时在线，随时为您提供心理健康支持</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.home-container {
  min-height: 100vh;
  background: linear-gradient(to bottom, #0f0c29 0%, #302b63 50%, #24243e 100%);
  position: relative;
  overflow-x: hidden;
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
  animation: sunGlow 3s ease-in-out infinite;
}

@keyframes sunGlow {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
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
  top: 25%;
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
  top: 40%;
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
  top: 55%;
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

/* 头部导航 */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
    gap: 12px;
    color: #ffffff;
    font-size: 20px;
    font-weight: 600;
  }

  .nav-items {
    display: flex;
    gap: 16px;
    align-items: center;

    .el-button {
      color: #ffffff;
      font-size: 15px;

      &:hover {
        color: #667eea;
      }
    }

    /* 用户头像区域 */
    .user-menu-container {
      position: relative;
    }

    .user-avatar-section {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.3s ease;
      background: rgba(255, 255, 255, 0.1);

      &:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .user-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid rgba(255, 255, 255, 0.3);
      }

      .dropdown-arrow {
        color: #ffffff;
        transition: transform 0.3s ease;
      }

      &:hover .dropdown-arrow {
        transform: rotate(180deg);
      }
    }

    /* 用户下拉菜单 */
    .user-dropdown-menu {
      position: absolute;
      top: calc(100% + 12px);
      right: 0;
      min-width: 240px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      padding: 16px;
      z-index: 1000;
      animation: slideDown 0.3s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .menu-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-bottom: 12px;

      .menu-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid rgba(102, 126, 234, 0.3);
      }

      .menu-user-info {
        flex: 1;
        overflow: hidden;

        .menu-username {
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .menu-email {
          font-size: 12px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }

    .menu-divider {
      height: 1px;
      background: rgba(0, 0, 0, 0.1);
      margin: 12px 0;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #475569;
      font-size: 14px;

      &:hover {
        background: rgba(102, 126, 234, 0.1);
        color: #667eea;
      }

      .el-icon {
        font-size: 16px;
      }

      &.menu-item-danger {
        &:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
      }
    }
  }
}

/* 主内容区 */
.main-content {
  padding-top: 80px;
  min-height: 100vh;
}

.welcome-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 24px;
}

.welcome-card {
  text-align: center;
  margin-bottom: 80px;
  animation: fadeInUp 0.8s ease-out;
}

.welcome-icon {
  width: 120px;
  height: 120px;
  margin: 0 auto 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 12px 40px rgba(102, 126, 234, 0.6);
  }
}

.welcome-title {
  font-size: 48px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 16px 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.welcome-subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 48px 0;
}

.welcome-actions {
  display: flex;
  justify-content: center;
  gap: 24px;

  .start-chat-btn {
    padding: 14px 48px;
    font-size: 16px;
    font-weight: 600;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(102, 126, 234, 0.5);
    }
  }

  .el-button--large {
    padding: 14px 36px;
    font-size: 16px;
  }
}

/* 功能卡片 */
.feature-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
  margin-top: 60px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 40px 32px;
  text-align: center;
  transition: all 0.3s ease;
  animation: fadeInUp 0.8s ease-out;
  animation-fill-mode: both;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    background: rgba(255, 255, 255, 0.15);
  }

  &:nth-child(1) {
    animation-delay: 0.2s;
  }

  &:nth-child(2) {
    animation-delay: 0.4s;
  }

  &:nth-child(3) {
    animation-delay: 0.6s;
  }
}

.feature-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

/* 树图标样式 */
.tree-icon-small {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  color: #ffffff;

  svg {
    width: 100%;
    height: 100%;
  }
}

.feature-card {
  h3 {
    font-size: 24px;
    font-weight: 600;
    color: #ffffff;
    margin: 0 0 12px 0;
  }

  p {
    font-size: 15px;
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
    line-height: 1.6;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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
