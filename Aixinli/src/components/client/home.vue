<script setup lang="ts">
import { computed, h, ref, onMounted, onUnmounted } from "vue";
import {
  ChatDotRound,
  User,
  Calendar,
  Clock,
  ArrowDown,
  MagicStick,
  Headset,
} from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { storeToRefs } from "pinia";
import { ElMessageBox, ElMessage } from "element-plus";
import { useThemeStyle } from "../../composables/useThemeStyle";

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
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const { isDark, containerStyle, toggleTheme } = useThemeStyle();

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

const goToMbti = () => {
  router.push("/mbti");
};

const goToRelax = () => {
  router.push("/relax");
};
const goToScreening = (type: string) => {
  router.push(`/${type}`);
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
    <!-- 天空装饰 + 主题切换 -->
    <ThemeDecorations :isDark="isDark" @toggle="toggleTheme" />

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
          <el-button text @click="goToMbti">
            <el-icon><MagicStick /></el-icon>
            人格测试
          </el-button>
          <el-button text @click="goToRelax">
            <el-icon><Headset /></el-icon>
            白噪音
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
              <div class="menu-section-label">心理测评</div>
              <div class="menu-item" @click="goToMbti">
                <el-icon><MagicStick /></el-icon>
                <span>MBTI 人格测试</span>
              </div>
              <div class="menu-item" @click="goToScreening('phq9')">
                <span class="menu-item-icon">📋</span>
                <span>PHQ-9 抑郁筛查</span>
              </div>
              <div class="menu-item" @click="goToScreening('gad7')">
                <span class="menu-item-icon">🧠</span>
                <span>GAD-7 焦虑筛查</span>
              </div>
              <div class="menu-divider"></div>
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
            <el-button size="large" @click="goToRelax">
              <el-icon><Headset /></el-icon>
              白噪音放松
            </el-button>
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

    .menu-section-label {
      font-size: 11px;
      color: #94a3b8;
      font-weight: 600;
      padding: 6px 12px 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
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

      .menu-item-icon {
        font-size: 14px;
        width: 16px;
        text-align: center;
        display: inline-block;
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


</style>
