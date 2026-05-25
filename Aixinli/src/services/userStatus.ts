import request from '../utils/request'

export interface UserStatus {
  id: number
  username: string
  avatar: string
  chatCount: number
  lastLoginTime: string
  createdAt: string
  latestMood: string
  moodLabel: string
  moodColor: string
  latestDiaryDate: string
  postCount: number
  diaryCount: number
}

export interface MoodStats {
  happy: number
  sad: number
  anxious: number
  neutral: number
  other: number
}

export interface UserStatusResponse {
  success: boolean
  data: {
    users: UserStatus[]
    stats: {
      totalUsers: number
      activeUsers: number
      moodStats: MoodStats
    }
  }
}

export const getUserStatus = async () => {
  const response = await request.get<UserStatusResponse>('/admin/user-status')
  return response.data
}
