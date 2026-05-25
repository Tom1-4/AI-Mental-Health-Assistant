import request from '../utils/request'

// 服务器基础URL
const BASE_URL = 'http://localhost:3000'

export interface UploadResponse {
  url: string
  filename: string
  originalname: string
  size: number
  mimetype: string
}

export interface MultipleUploadResponse {
  images: UploadResponse[]
  count: number
}

/**
 * 获取完整的图片URL
 * @param url 相对路径或完整URL
 * @returns 完整的图片URL
 */
const getFullImageUrl = (url: string): string => {
  if (!url) return ''
  // 如果已经是完整URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  // 拼接完整的URL
  return BASE_URL + url
}

/**
 * 上传单张图片
 * @param file 图片文件
 * @param skipAuth 是否跳过认证（默认false）
 * @returns 图片URL
 */
export const uploadSingleImage = async (file: File, skipAuth: boolean = false): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await request.post('/upload/single', formData, {
    skipAuth,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

  console.log('单张图片上传响应:', response.data)
  const url = response.data.data?.url
  console.log('解析的URL:', url)
  console.log('完整URL:', getFullImageUrl(url))
  return getFullImageUrl(url)
}

/**
 * 上传多张图片
 * @param files 图片文件数组
 * @returns 图片URL数组
 */
export const uploadMultipleImages = async (files: File[]): Promise<string[]> => {
  const formData = new FormData()
  files.forEach(file => {
    formData.append('files', file)
  })

  const response = await request.post('/upload/multiple', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

  console.log('上传响应:', response.data)

  // 检查响应数据结构
  const urls = response.data.data.images?.map((img: UploadResponse) => getFullImageUrl(img.url)) || []
  console.log('解析的URL数组:', urls)
  console.log('URL数组长度:', urls.length)
  console.log('第一个URL:', urls[0])
  return urls
}

/**
 * 删除图片
 * @param filename 文件名
 */
export const deleteImage = async (filename: string): Promise<void> => {
  await request.delete(`/upload/images/${filename}`)
}
