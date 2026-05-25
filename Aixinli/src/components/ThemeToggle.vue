<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '../stores/theme'

const themeStore = useThemeStore()

const isDark = computed(() => themeStore.isDark)

const handleToggle = () => {
  themeStore.toggleTheme()
}
</script>

<template>
  <div class="theme-toggle" @click="handleToggle" :title="isDark ? '切换到亮色模式' : '切换到暗色模式'">
    <el-icon v-if="isDark" class="theme-icon">
      <Sunny />
    </el-icon>
    <el-icon v-else class="theme-icon">
      <Moon />
    </el-icon>
  </div>
</template>

<script lang="ts">
import { Sunny, Moon } from '@element-plus/icons-vue'
export default {
  components: { Sunny, Moon }
}
</script>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
}

.theme-toggle:hover {
  transform: scale(1.1);
  background-color: var(--el-fill-color-light);
}

.theme-icon {
  font-size: 20px;
  color: var(--el-text-color-primary);
}

/* 暗色模式样式 */
:global(.dark) .theme-toggle {
  background-color: #2d2d2d;
  border-color: #404040;
}

:global(.dark) .theme-toggle:hover {
  background-color: #404040;
}
</style>
