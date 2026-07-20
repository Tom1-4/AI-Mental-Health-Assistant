import request from '../utils/request'

export interface ScreeningQuestion {
  id: number
  text: string
}

export interface ScreeningOption {
  value: number
  label: string
}

export interface ScreeningTestData {
  title: string
  description: string
  questions: ScreeningQuestion[]
  options: ScreeningOption[]
}

export interface ScreeningResult {
  id: number
  testType: string
  totalScore: number
  severity: string
  severityLabel: string
  severityColor: string
  recommendation: string
  answers: Record<string, number>
  createdAt: string
}

export interface ScreeningHistoryItem {
  id: number
  test_type: string
  total_score: number
  severity: string
  created_at: string
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export const getScreeningQuestions = async (): Promise<
  ApiResponse<{ phq9: ScreeningTestData; gad7: ScreeningTestData }>
> => {
  const response = await request.get('/screening/questions')
  return response.data
}

export const submitScreeningTest = async (
  testType: string,
  answers: Record<string, number>
): Promise<ApiResponse<ScreeningResult>> => {
  const response = await request.post('/screening/submit', { testType, answers })
  return response.data
}

export const getScreeningResult = async (
  type: string
): Promise<ApiResponse<ScreeningResult | null>> => {
  const response = await request.get('/screening/result', { params: { type } })
  return response.data
}

export const getScreeningHistory =
  async (): Promise<ApiResponse<ScreeningHistoryItem[]>> => {
    const response = await request.get('/screening/history')
    return response.data
  }
