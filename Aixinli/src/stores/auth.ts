import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface User {
  id: number
  username: string
  email: string
  role: string
  avatar?: string
  chatCount?: number
}

export const useAuthStore = defineStore(
  'auth',
  () => {
    const user = ref<User | null>(null)
    const token = ref<string | null>(null)

    // 初始化：从 localStorage 读取数据
    const initAuth = () => {
      const savedToken = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')

      if (savedToken) {
        token.value = savedToken
      }
      if (savedUser) {
        try {
          user.value = JSON.parse(savedUser)
        } catch (e) {
          user.value = null
        }
      }
    }

    // 是否已登录
    const isAuthenticated = computed(() => !!token.value)

    // 登录
    const login = async (username: string, password: string) => {
      try {
        console.log('开始登录，用户名:', username)
        const response = await fetch('http://localhost:3000/api/users/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        })

        console.log('登录响应状态:', response.status)
        const data = await response.json()
        console.log('登录响应数据:', data)

        if (data.success) {
          token.value = data.data.token
          user.value = {
            id: data.data.user.id,
            username: data.data.user.username,
            email: data.data.user.email,
            role: data.data.user.role,
            avatar: data.data.user.avatar,
            chatCount: data.data.user.chatCount || data.data.user.chat_count || 0
          }

          // 保存到 localStorage
          localStorage.setItem('token', data.data.token)
          localStorage.setItem('user', JSON.stringify(user.value))

          console.log('登录成功，用户角色:', data.data.user.role)
          return { success: true, message: data.message, role: data.data.user.role }
        } else {
          console.log('登录失败:', data.message)
          return { success: false, message: data.message }
        }
      } catch (error) {
        console.error('登录错误:', error)
        return { success: false, message: '网络错误，请稍后重试' }
      }
    }

    // 注册
    const register = async (username: string, email: string, password: string, avatar?: string) => {
      try {
        const response = await fetch('http://localhost:3000/api/users/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, email, password, avatar })
        })

        const data = await response.json()

        if (data.success) {
          return { success: true, message: data.message }
        } else {
          return { success: false, message: data.message }
        }
      } catch (error) {
        console.error('注册错误:', error)
        return { success: false, message: '网络错误，请稍后重试' }
      }
    }

    // 登出
    const logout = async () => {
      try {
        if (token.value) {
          await fetch('http://localhost:3000/api/users/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token.value}`
            }
          })
        }
      } catch (error) {
        console.error('登出错误:', error)
      } finally {
        token.value = null
        user.value = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }

    // 获取用户信息
    const fetchUserProfile = async () => {
      if (!token.value) return

      try {
        const response = await fetch('http://localhost:3000/api/users/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        })

        const data = await response.json()

        if (data.success) {
          user.value = {
            ...data.data.user,
            chatCount: data.data.user.chatCount || data.data.user.chat_count || 0
          }
          localStorage.setItem('user', JSON.stringify(user.value))
        }
      } catch (error) {
        console.error('获取用户信息错误:', error)
      }
    }

    // 修改密码
    const changePassword = async (oldPassword: string, newPassword: string) => {
      try {
        const response = await fetch('http://localhost:3000/api/users/password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.value}`
          },
          body: JSON.stringify({ oldPassword, newPassword })
        })

        const data = await response.json()

        if (data.success) {
          return { success: true, message: data.message }
        } else {
          return { success: false, message: data.message }
        }
      } catch (error) {
        console.error('修改密码错误:', error)
        return { success: false, message: '网络错误，请稍后重试' }
      }
    }

    return {
      user,
      token,
      isAuthenticated,
      initAuth,
      login,
      register,
      logout,
      fetchUserProfile,
      changePassword
    }
  }
)
