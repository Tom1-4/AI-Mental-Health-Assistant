/**
 * 图片压缩工具
 */

export interface CompressOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  type?: string
}

const DEFAULT_OPTIONS: CompressOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  type: 'image/jpeg'
}

/**
 * 压缩图片
 * @param file 原始文件
 * @param options 压缩选项
 * @returns 压缩后的 Blob
 */
export const compressImage = (
  file: File,
  options: CompressOptions = {}
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const opts = { ...DEFAULT_OPTIONS, ...options }

    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target?.result as string

      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('无法获取 Canvas 上下文'))
          return
        }

        // 计算压缩后的尺寸
        let { width, height } = calculateDimensions(
          img.width,
          img.height,
          opts.maxWidth!,
          opts.maxHeight!
        )

        canvas.width = width
        canvas.height = height

        // 绘制压缩后的图片
        ctx.drawImage(img, 0, 0, width, height)

        // 导出压缩后的图片
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('图片压缩失败'))
            }
          },
          opts.type,
          opts.quality
        )
      }

      img.onerror = () => {
        reject(new Error('图片加载失败'))
      }
    }

    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
  })
}

/**
 * 计算压缩后的尺寸,保持宽高比
 */
const calculateDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  let width = originalWidth
  let height = originalHeight

  // 如果宽度超出限制
  if (width > maxWidth) {
    height = (maxWidth / width) * height
    width = maxWidth
  }

  // 如果高度超出限制
  if (height > maxHeight) {
    width = (maxHeight / height) * width
    height = maxHeight
  }

  return { width, height }
}

/**
 * 压缩图片并转换为 Base64
 * @param file 原始文件
 * @param options 压缩选项
 * @returns 压缩后的 Base64 字符串
 */
export const compressImageToBase64 = (
  file: File,
  options: CompressOptions = {}
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const blob = await compressImage(file, options)
      const reader = new FileReader()
      reader.readAsDataURL(blob)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Base64 转换失败'))
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 批量压缩图片
 * @param files 文件数组
 * @param options 压缩选项
 * @returns 压缩后的 Blob 数组
 */
export const compressImages = (
  files: File[],
  options: CompressOptions = {}
): Promise<Blob[]> => {
  return Promise.all(files.map((file) => compressImage(file, options)))
}

/**
 * 获取图片信息
 * @param file 图片文件
 * @returns 图片信息
 */
export const getImageInfo = (file: File): Promise<{ width: number; height: number; size: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target?.result as string

      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          size: file.size
        })
      }

      img.onerror = () => {
        reject(new Error('图片加载失败'))
      }
    }

    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
  })
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的字符串
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
}
