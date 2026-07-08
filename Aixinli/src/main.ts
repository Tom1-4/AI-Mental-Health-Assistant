import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router'
import { useThemeStore } from './stores/theme'
import { useAuthStore } from './stores/auth'
import ThemeDecorations from './components/ThemeDecorations.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(ElementPlus)
app.use(router)

// 全局注册天空装饰组件
app.component('ThemeDecorations', ThemeDecorations)

// 初始化主题
const themeStore = useThemeStore()
themeStore.initTheme()

// 初始化认证状态
const authStore = useAuthStore()
authStore.initAuth()

app.mount('#app')
