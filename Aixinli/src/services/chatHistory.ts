import request from '../utils/request'

// 对话记录数据接口
export interface ChatRecord {
  id: number
  user_id: number
  user_message: string
  ai_response: string
  created_at: string
  username?: string
  email?: string
}

// 查询参数
export interface ChatHistoryParams {
  userId?: number
  limit?: number
  offset?: number
}

// 获取所有对话记录
export const getAllChatHistory = async (params?: ChatHistoryParams) => {
  const response = await request.get('/ai/admin/all-history', { params })
  return response.data
}
