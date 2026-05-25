import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore(
  'theme',
  () => {
    const isDark = ref<boolean>(false)

    // 初始化主题：从 localStorage 读取或使用系统偏好
    const initTheme = () => {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme !== null) {
        isDark.value = savedTheme === 'dark'
      } else {
        // 使用系统偏好
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        isDark.value = prefersDark
      }
      applyTheme()
    }

    // 切换主题
    const toggleTheme = () => {
      isDark.value = !isDark.value
    }

    // 设置主题
    const setTheme = (dark: boolean) => {
      isDark.value = dark
    }

    // 应用主题到 DOM
    const applyTheme = () => {
      const htmlElement = document.documentElement
      if (isDark.value) {
        htmlElement.classList.add('dark')
      } else {
        htmlElement.classList.remove('dark')
      }
      // 保存到 localStorage
      localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    }

    // 监听主题变化，自动应用
    watch(isDark, () => {
      applyTheme()
    })

    return {
      isDark,
      toggleTheme,
      setTheme,
      initTheme
    }
  }
)
