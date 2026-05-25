import request from '../utils/request'

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

// 用户数据类型定义
export interface UserData {
  id: number
  username: string
  email: string
  chat_count: number
  role: string
  last_login_time: string
  created_at: string
}

// 分页数据类型
export interface PaginationData {
  users: UserData[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 用户列表查询参数
export interface UserListParams {
  page?: number
  pageSize?: number
  keyword?: string
}

// 心理评估数据类型
export interface PsychologicalAssessment {
  report: string
  score: number
  emotionStatus: string
  suggestion: string
  details: {
    chatCount: number
    postCount: number
    diaryCount: number
    emotionCount: {
      positive: number
      negative: number
      neutral: number
    }
  }
}

interface UserRoleData {
  user: {
    id: number
    username: string
    email: string
    role: string
  }
}

// 获取用户列表
export const getUserList = async (params?: UserListParams) => {
  const response = await request.get<ApiResponse<PaginationData>>('/admin/users', { params })
  return response.data
}

// 删除用户
export const deleteUser = async (userId: number) => {
  const response = await request.delete<ApiResponse<null>>(`/admin/users/${userId}`)
  return response.data
}

// 修改用户身份
export const updateUserRole = async (userId: number, role: string) => {
  const response = await request.put<ApiResponse<UserRoleData>>(`/admin/users/${userId}/role`, { role })
  return response.data
}

// 获取用户心理评估
export const getPsychologicalAssessment = async (userId: number) => {
  const response = await request.get<ApiResponse<PsychologicalAssessment>>(`/admin/users/${userId}/assessment`)
  return response.data
}
