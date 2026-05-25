import request from '../utils/request'

export interface UserData {
  id: number
  username: string
  email: string
  chat_count: number
  role: string
  last_login_time: string
  created_at: string
}

export interface UserListParams {
  page?: number
  pageSize?: number
  keyword?: string
}

export interface UserListResponse {
  users: UserData[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 获取用户列表
export const getUserList = async (params?: UserListParams) => {
  const response = await request.get('/admin/users', { params })
  return response.data
}

// 删除用户
export const deleteUser = async (userId: number) => {
  const response = await request.delete(`/admin/users/${userId}`)
  return response.data
}

// 修改用户身份
export const updateUserRole = async (userId: number, role: string) => {
  const response = await request.put(`/admin/users/${userId}/role`, { role })
  return response.data
}
