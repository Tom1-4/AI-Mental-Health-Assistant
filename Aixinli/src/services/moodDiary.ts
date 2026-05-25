import request from '../utils/request'

export interface MoodDiary {
  id: number
  user_id: number
  title: string
  content: string
  mood: 'happy' | 'sad' | 'anxious' | 'angry' | 'neutral' | 'excited' | 'tired' | 'calm'
  images: string
  diary_date: string
  created_at: string
  updated_at: string
}

export interface MoodDiaryFormData {
  title?: string
  content: string
  mood: 'happy' | 'sad' | 'anxious' | 'angry' | 'neutral' | 'excited' | 'tired' | 'calm'
  images?: string
  diary_date: string
}

export interface MoodStats {
  dailyStats: Array<{
    mood: string
    count: number
    date: string
  }>
  totalStats: Array<{
    mood: string
    count: number
  }>
}

export interface DiaryListParams {
  page?: number
  limit?: number
  mood?: string
  start_date?: string
  end_date?: string
  sort?: 'newest' | 'oldest' | 'date_asc' | 'date_desc'
}

export interface DiaryListResponse {
  diaries: MoodDiary[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const MOOD_CONFIG = {
  happy: { label: '开心', emoji: '😄', color: '#67c23a' },
  sad: { label: '悲伤', emoji: '😢', color: '#909399' },
  anxious: { label: '焦虑', emoji: '😰', color: '#e6a23c' },
  angry: { label: '愤怒', emoji: '😠', color: '#f56c6c' },
  neutral: { label: '平静', emoji: '😐', color: '#409eff' },
  excited: { label: '兴奋', emoji: '🤩', color: '#67c23a' },
  tired: { label: '疲惫', emoji: '😴', color: '#909399' },
  calm: { label: '安静', emoji: '🙂', color: '#409eff' }
}

export const getMoodInfo = (mood: string) => {
  return MOOD_CONFIG[mood as keyof typeof MOOD_CONFIG] || {
    label: '未知',
    emoji: '😐',
    color: '#909399'
  }
}

export const getAllMoods = () => {
  return Object.entries(MOOD_CONFIG).map(([key, value]) => ({
    key,
    ...value
  }))
}

// 创建日记
export const createDiary = async (data: MoodDiaryFormData) => {
  const response = await request.post('/mood/diaries', data)
  return response.data
}

// 获取日记列表
export const getDiaries = async (params?: DiaryListParams) => {
  const response = await request.get('/mood/diaries', { params })
  return response.data
}

// 获取单个日记详情
export const getDiaryById = async (id: number) => {
  const response = await request.get(`/mood/diaries/${id}`)
  return response.data
}

// 更新日记
export const updateDiary = async (id: number, data: Partial<MoodDiaryFormData>) => {
  const response = await request.put(`/mood/diaries/${id}`, data)
  return response.data
}

// 删除日记
export const deleteDiary = async (id: number) => {
  const response = await request.delete(`/mood/diaries/${id}`)
  return response.data
}

// 获取心情统计
export const getMoodStats = async (days: number = 30) => {
  const response = await request.get('/mood/diaries/stats/mood', {
    params: { days }
  })
  return response.data
}
