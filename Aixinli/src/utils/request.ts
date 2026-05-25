import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

type RequestResponse<T> = {
  data: T
}

type RequestConfig = {
  skipAuth?: boolean
  headers?: Record<string, any>
  params?: Record<string, any>
}

type RequestInstance = {
  get<T = any>(url: string, config?: RequestConfig): Promise<RequestResponse<T>>
  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<RequestResponse<T>>
  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<RequestResponse<T>>
  delete<T = any>(url: string, config?: RequestConfig): Promise<RequestResponse<T>>
  interceptors: {
    request: { use(onFulfilled: (config: RequestConfig) => RequestConfig, onRejected: (error: unknown) => unknown): void }
    response: { use(onFulfilled: (response: RequestResponse<any>) => RequestResponse<any>, onRejected: (error: any) => unknown): void }
  }
}

// 创建 axios 实例
const request = (axios as any).create({
  baseURL: 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
}) as RequestInstance

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token')
    // 检查是否跳过认证（用于注册时的头像上传）
    if (token && !config.skipAuth) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    return response
  },
  (error: any) => {
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 401:
          // 未授权，清除 token 并跳转到登录页
          ElMessage.error('登录已过期，请重新登录')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/')
          break
        case 403:
          ElMessage.error('没有权限访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器错误，请稍后重试')
          break
        default:
          ElMessage.error(data.message || '请求失败')
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      ElMessage.error('网络错误，请检查网络连接')
    } else {
      // 请求配置出错
      ElMessage.error('请求配置错误')
    }

    return Promise.reject(error)
  }
)

export default request
