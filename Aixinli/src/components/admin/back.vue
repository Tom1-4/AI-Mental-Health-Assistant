<template>
  <div class="back-layout">
    <el-container class="layout-container">
      <!-- 侧边栏 -->
      <el-aside :width="isCollapse ? '80px' : '240px'" class="layout-aside">
        <!-- Logo 区域 -->
        <div class="aside-logo" @click="isCollapse = !isCollapse">
          <div class="logo-icon">
            <el-icon :size="28"><ChatDotRound /></el-icon>
          </div>
          <transition name="fade-text">
            <div v-show="!isCollapse" class="logo-text">
              <span class="logo-title">AI 心理健康</span>
              <span class="logo-subtitle">管理后台</span>
            </div>
          </transition>
        </div>

        <!-- 导航菜单 -->
        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapse"
          :collapse-transition="false"
          router
          class="aside-menu"
          background-color="transparent"
          text-color="rgba(255,255,255,0.65)"
          active-text-color="#ffffff"
        >
          <el-menu-item index="/back/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>数据分析</span>
          </el-menu-item>
          <el-menu-item index="/back/user">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/back/user-status">
            <el-icon><Monitor /></el-icon>
            <span>用户状态</span>
          </el-menu-item>
          <el-menu-item index="/back/center">
            <el-icon><DataAnalysis /></el-icon>
            <span>对话记录</span>
          </el-menu-item>
        </el-menu>

        <!-- 底部装饰 -->
        <div class="aside-footer">
          <div class="footer-decoration">
            <span class="footer-dot"></span>
            <transition name="fade-text">
              <span v-show="!isCollapse" class="footer-text">系统运行中</span>
            </transition>
          </div>
        </div>
      </el-aside>

      <!-- 右侧主体 -->
      <el-container class="main-container">
        <!-- 头部 -->
        <el-header class="layout-header">
          <div class="header-content">
            <!-- 左侧：面包屑 -->
            <div class="header-left">
              <el-breadcrumb separator="/">
                <el-breadcrumb-item :to="{ path: '/back/dashboard' }">
                  <el-icon><HomeFilled /></el-icon>
                  首页
                </el-breadcrumb-item>
                <el-breadcrumb-item v-if="currentPageTitle">
                  {{ currentPageTitle }}
                </el-breadcrumb-item>
              </el-breadcrumb>
            </div>

            <!-- 右侧：用户区 -->
            <div class="header-right">
              <!-- 系统状态指示器 -->
              <div class="status-indicator">
                <span class="status-dot"></span>
                <span class="status-text">系统正常</span>
              </div>

              <!-- 通知图标 -->
              <el-badge :value="0" :max="99" class="header-badge" :hidden="true">
                <el-button class="header-icon-btn" circle>
                  <el-icon :size="18"><Bell /></el-icon>
                </el-button>
              </el-badge>

              <!-- 主题切换 -->
              <el-button class="header-icon-btn" circle @click="toggleTheme">
                <el-icon :size="18"><Moon v-if="!isDark" /><Sunny v-else /></el-icon>
              </el-button>

              <!-- 管理员信息 -->
              <el-dropdown trigger="click" class="admin-dropdown">
                <div class="admin-info">
                  <el-avatar :size="36" class="admin-avatar">
                    <el-icon :size="20"><UserFilled /></el-icon>
                  </el-avatar>
                  <div class="admin-meta">
                    <span class="admin-name">{{ adminName }}</span>
                    <span class="admin-role">超级管理员</span>
                  </div>
                  <el-icon class="dropdown-arrow"><ArrowDown /></el-icon>
                </div>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item disabled>
                      <el-icon><User /></el-icon>
                      {{ adminName }}
                    </el-dropdown-item>
                    <el-dropdown-item divided @click="handleLogout">
                      <el-icon><SwitchButton /></el-icon>
                      退出登录
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </el-header>

        <!-- 主内容区 -->
        <el-main class="layout-main">
          <div class="main-content">
            <router-view v-slot="{ Component }">
              <transition name="page-fade" mode="out-in">
                <component :is="Component" />
              </transition>
            </router-view>
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ChatDotRound, User, DataAnalysis, Odometer, Monitor,
  HomeFilled, Bell, Moon, Sunny, ArrowDown, SwitchButton, UserFilled
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const isCollapse = ref(false)
const isDark = ref(false)

const activeMenu = computed(() => route.path)

// 管理员名称
const adminName = computed(() => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    return user.username || '管理员'
  } catch {
    return '管理员'
  }
})

// 当前页面标题
const currentPageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/back/dashboard': '数据分析',
    '/back/user': '用户管理',
    '/back/user-status': '用户状态',
    '/back/center': '对话记录',
  }
  return titles[route.path] || ''
})

const toggleTheme = () => {
  isDark.value = !isDark.value
}

const handleLogout = () => {
  sessionStorage.removeItem('adminAuthenticated')
  router.push('/')
}
</script>

<style scoped lang="scss">
/* ==================== 全局重置 ==================== */
.back-layout {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #f0f2f5;
}

.layout-container {
  height: 100%;
}

/* ==================== 侧边栏 ==================== */
.layout-aside {
  background: linear-gradient(180deg, #1a1f36 0%, #1e293b 100%);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.12);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;
  z-index: 10;

  // 顶部光效
  &::before {
    content: '';
    position: absolute;
    top: -60px;
    right: -60px;
    width: 180px;
    height: 180px;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }
}

/* Logo 区域 */
.aside-logo {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 24px 20px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  .logo-icon {
    width: 44px;
    height: 44px;
    min-width: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    transition: all 0.3s ease;
  }

  .logo-text {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    white-space: nowrap;

    .logo-title {
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 0.5px;
      line-height: 1.3;
    }

    .logo-subtitle {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.45);
      letter-spacing: 1px;
    }
  }
}

/* 导航菜单 */
.aside-menu {
  border: none;
  padding: 12px 8px;
  flex: 1;

  :deep(.el-menu-item) {
    height: 48px;
    line-height: 48px;
    margin: 4px 8px;
    border-radius: 10px;
    font-size: 14px;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 0;
      height: 60%;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0 6px 6px 0;
      transition: width 0.25s ease;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.06) !important;
      color: #ffffff !important;

      &::before {
        width: 3px;
      }

      .el-icon {
        transform: scale(1.1);
      }
    }

    &.is-active {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.35) 0%, rgba(139, 92, 246, 0.35) 100%) !important;
      color: #ffffff !important;
      font-weight: 600;
      box-shadow: 0 2px 12px rgba(99, 102, 241, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1);

      &::before {
        width: 3px;
        background: #818cf8;
      }

      .el-icon {
        color: #a5b4fc;
      }
    }

    .el-icon {
      font-size: 18px;
      transition: transform 0.25s ease;
    }
  }

  // 折叠状态
  :deep(.el-menu--collapse) {
    .el-menu-item {
      padding: 0 !important;
      display: flex;
      align-items: center;
      justify-content: center;

      .el-icon {
        margin: 0;
      }
    }
  }
}

/* 侧边栏底部 */
.aside-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);

  .footer-decoration {
    display: flex;
    align-items: center;
    gap: 10px;

    .footer-dot {
      width: 8px;
      height: 8px;
      min-width: 8px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
      animation: pulse-dot 2s ease-in-out infinite;
    }

    .footer-text {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.4);
      white-space: nowrap;
    }
  }
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(34, 197, 94, 0.5); }
  50% { opacity: 0.6; box-shadow: 0 0 4px rgba(34, 197, 94, 0.3); }
}

/* ==================== 主容器 ==================== */
.main-container {
  flex-direction: column;
  background: #f0f2f5;
}

/* ==================== 头部 ==================== */
.layout-header {
  height: 64px !important;
  padding: 0 24px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 12px rgba(0, 0, 0, 0.04);
  z-index: 9;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

/* 面包屑 */
.header-left {
  :deep(.el-breadcrumb) {
    font-size: 14px;

    .el-breadcrumb__item {
      .el-breadcrumb__inner {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: #64748b;
        font-weight: 500;
        transition: color 0.2s;

        &:hover {
          color: #6366f1;
        }
      }

      &:last-child .el-breadcrumb__inner {
        color: #1e293b;
        font-weight: 600;
      }

      .el-breadcrumb__separator {
        color: #cbd5e1;
      }
    }
  }
}

/* 头部右侧 */
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 系统状态 */
.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: #f0fdf4;
  border-radius: 20px;
  border: 1px solid rgba(34, 197, 94, 0.15);

  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 6px rgba(34, 197, 94, 0.4);
  }

  .status-text {
    font-size: 12px;
    color: #166534;
    font-weight: 500;
  }
}

/* 图标按钮 */
.header-icon-btn {
  width: 38px;
  height: 38px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #64748b;
  transition: all 0.2s ease;

  &:hover {
    border-color: #6366f1;
    color: #6366f1;
    background: #f5f3ff;
  }
}

.header-badge {
  :deep(.el-badge__content) {
    border: 2px solid #ffffff;
  }
}

/* 管理员下拉 */
.admin-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;

  &:hover {
    background: #f8fafc;
    border-color: #e2e8f0;
  }

  .admin-avatar {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: #ffffff;
    font-weight: 600;
  }

  .admin-meta {
    display: flex;
    flex-direction: column;
    line-height: 1.3;

    .admin-name {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }

    .admin-role {
      font-size: 11px;
      color: #94a3b8;
    }
  }

  .dropdown-arrow {
    color: #94a3b8;
    font-size: 12px;
    transition: transform 0.2s;
  }
}

.admin-dropdown {
  :deep(.el-dropdown-menu) {
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid #f1f5f9;
    padding: 8px;

    .el-dropdown-menu__item {
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;

      &:hover {
        background: #f5f3ff;
        color: #6366f1;
      }
    }
  }
}

/* ==================== 主内容 ==================== */
.layout-main {
  padding: 24px;
  background: #f0f2f5;
  overflow: hidden;
}

.main-content {
  height: calc(100vh - 112px);
  overflow-y: auto;
  overflow-x: hidden;

  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;

    &:hover {
      background: #94a3b8;
    }
  }
}

/* ==================== 页面切换动画 ==================== */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ==================== 文字过渡 ==================== */
.fade-text-enter-active,
.fade-text-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-text-enter-from,
.fade-text-leave-to {
  opacity: 0;
  width: 0;
}
</style>
