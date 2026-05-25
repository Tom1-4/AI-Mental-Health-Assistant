<template>
  <div class="back-layout">
    <el-container class="layout-container">
      <el-header class="layout-header">
        <div class="header-content">
          <div class="header-title">
            <el-icon :size="24"><ChatDotRound /></el-icon>
            <span>AI心理健康助手</span>
          </div>
          <div class="header-user">
            <el-button type="primary" size="small" @click="handleLogout">退出登录</el-button>
          </div>
        </div>
      </el-header>
      <el-container>
        <el-aside width="220px" class="layout-aside">
          <el-menu
            :default-active="activeMenu"
            router
            class="aside-menu"
            background-color="#1e293b"
            text-color="#94a3b8"
            active-text-color="#3b82f6"
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
              <span>用户对话记录</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
        <el-main class="layout-main">
          <div class="main-content">
            <router-view></router-view>
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChatDotRound, User, DataAnalysis, Odometer, Monitor } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const activeMenu = computed(() => route.path)

const handleLogout = () => {
  sessionStorage.removeItem('adminAuthenticated')
  router.push('/')
}
</script>

<style scoped lang="scss">
.back-layout {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.layout-container {
  height: 100%;
}

.layout-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 24px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #ffffff;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.layout-aside {
  background-color: #1e293b;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  overflow-x: hidden;
}

.aside-menu {
  border: none;
  height: 100%;

  .el-menu-item {
    margin: 8px 12px;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      background-color: #334155 !important;
      transform: translateX(4px);
    }

    &.is-active {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }
  }
}

.layout-main {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 24px;
  overflow: hidden;
}

.main-content {
  background: #ffffff;
  border-radius: 16px;
  padding: 32px;
  height: calc(100vh - 100px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  animation: fadeIn 0.3s ease-in-out;
  overflow-y: auto;
}

/* 内置滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>