import request from '../utils/request'

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

// 题目
export interface MbtiQuestion {
  id: number
  text: string
  dimension: 'EI' | 'SN' | 'TF' | 'JP'
}

export interface MbtiOption {
  value: number
  label: string
}

// 维度信息
export interface DimensionInfo {
  score: number
  percent: number
  result: string
  description: string
}

// 人格类型信息
export interface TypeInfo {
  name: string
  traits: string[]
  description: string
}

// 测试结果
export interface MbtiResult {
  id: number
  type: string
  typeName: string
  typeTraits: string[]
  typeDescription: string
  dimensions: {
    EI: DimensionInfo
    SN: DimensionInfo
    TF: DimensionInfo
    JP: DimensionInfo
  }
  createdAt: string
}

// 类型分布
export interface TypeDistributionItem {
  type: string
  count: number
  typeInfo: TypeInfo
}

export interface DimensionStats {
  EI: { E: number; I: number }
  SN: { S: number; N: number }
  TF: { T: number; F: number }
  JP: { J: number; P: number }
}

export interface MbtiDistribution {
  typeDistribution: TypeDistributionItem[]
  dimensionStats: DimensionStats
  totalTestedUsers: number
}

// 用户MBTI简要信息（管理员视角）
export interface UserMbtiInfo {
  id: number
  userId: number
  username: string
  email: string
  mbtiType: string
  typeName: string
  dimensions: {
    EI: number
    SN: number
    TF: number
    JP: number
  }
  createdAt: string
}

// 获取测试题目
export const getMbtiQuestions = async () => {
  const response = await request.get<ApiResponse<{ questions: MbtiQuestion[]; options: MbtiOption[] }>>('/mbti/questions')
  return response.data
}

// 提交测试
export const submitMbtiTest = async (answers: Record<string, number>) => {
  const response = await request.post<ApiResponse<MbtiResult>>('/mbti/submit', { answers })
  return response.data
}

// 获取我的测试结果
export const getMyMbtiResult = async () => {
  const response = await request.get<ApiResponse<MbtiResult | null>>('/mbti/result')
  return response.data
}

// 获取我的测试历史
export const getMyMbtiHistory = async () => {
  const response = await request.get<ApiResponse<Array<{ id: number; mbti_type: string; type_name: string; created_at: string }>>>('/mbti/history')
  return response.data
}

// 管理员 - 获取所有用户MBTI结果
export const getAllUserMbtiResults = async (page = 1, limit = 20) => {
  const response = await request.get<ApiResponse<{ users: UserMbtiInfo[]; pagination: any }>>('/admin/mbti/users', { params: { page, limit } })
  return response.data
}

// 管理员 - 获取MBTI类型分布
export const getMbtiDistribution = async () => {
  const response = await request.get<ApiResponse<MbtiDistribution>>('/admin/mbti/distribution')
  return response.data
}

// 管理员 - 获取单个用户MBTI详情
export const getUserMbtiDetail = async (userId: number) => {
  const response = await request.get<ApiResponse<MbtiResult | null>>(`/admin/mbti/users/${userId}`)
  return response.data
}
