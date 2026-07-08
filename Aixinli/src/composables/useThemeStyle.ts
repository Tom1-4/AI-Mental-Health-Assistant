import { computed } from 'vue'
import { useThemeStore } from '../stores/theme'
import { storeToRefs } from 'pinia'

/** 预设渐变风格 */
export type GradientPreset = 'sky' | 'soft'

/** 预设渐变定义 */
const GRADIENTS: Record<GradientPreset, { light: string; dark: string }> = {
  sky: {
    light: 'linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 50%, #B0E0E6 100%)',
    dark: 'linear-gradient(to bottom, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  },
  soft: {
    light: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    dark: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  },
}

/**
 * 统一主题样式 composable
 * 替代各页面重复的 containerStyle 和 toggleTheme 逻辑
 *
 * @param preset 渐变预设: 'sky'（天空主题，默认）或 'soft'（柔和主题）
 */
export function useThemeStyle(preset: GradientPreset = 'sky') {
  const themeStore = useThemeStore()
  const { isDark } = storeToRefs(themeStore)

  /** 容器背景渐变样式 */
  const containerStyle = computed(() => ({
    background: isDark.value ? GRADIENTS[preset].dark : GRADIENTS[preset].light,
  }))

  /** 切换主题 */
  const toggleTheme = () => themeStore.toggleTheme()

  return { isDark, containerStyle, toggleTheme }
}
