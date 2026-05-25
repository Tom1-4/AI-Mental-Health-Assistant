import request from '../utils/request'

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

// 数据统计类型定义
export interface DashboardStats {
  totalUsers: number
  newUsersThisMonth: number
  activeUsersToday: number
  activeUsersThisWeek: number
  activeUsersThisMonth: number
  totalChats: number
  totalPosts: number
  totalDiaries: number
}

export interface DailyStats {
  date: string
  users: number
  chats: number
  posts: number
  diaries: number
}

export interface EmotionDistribution {
  positive: number
  negative: number
  neutral: number
}

export interface DashboardData {
  stats: DashboardStats
  dailyStats: DailyStats[]
  emotionDistribution: EmotionDistribution
  userGrowthData: number[]
  usageData: {
    chat: number[]
    post: number[]
    diary: number[]
  }
}

// 获取仪表盘统计数据
export const getDashboardStats = async () => {
  const response = await request.get<ApiResponse<DashboardData>>('/admin/dashboard')
  return response.data
}

// 获取每日统计数据
export const getDailyStats = async (days: number = 30) => {
  const response = await request.get<ApiResponse<DailyStats[]>>('/admin/dashboard/daily', { params: { days } })
  return response.data
}
