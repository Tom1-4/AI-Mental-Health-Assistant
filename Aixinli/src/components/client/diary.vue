<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ArrowLeft, Plus, Calendar, Edit, Close } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadProps, UploadUserFile } from 'element-plus'
import { getDiaries, createDiary, deleteDiary, updateDiary, getMoodStats, type MoodDiary, type MoodDiaryFormData, getMoodInfo, getAllMoods } from '../../services/moodDiary'
import { uploadMultipleImages } from '../../services/upload'
import { compressImage, formatFileSize } from '../../utils/imageCompress'
import { useThemeStyle } from '../../composables/useThemeStyle'

const router = useRouter()
const { isDark, containerStyle, toggleTheme } = useThemeStyle()

// 对话框状态
const showDialog = ref(false)
const isEditMode = ref(false)
const editingDiaryId = ref<number | null>(null)

// 表单数据
const formTitle = ref('')
const formContent = ref('')
const selectedDate = ref(new Date())
const selectedMood = ref('happy')
const imageList = ref<UploadUserFile[]>([])

// 列表数据
const loading = ref(false)
const diaryEntries = ref<MoodDiary[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const filterMood = ref('')
const startDate = ref('')
const endDate = ref('')

// 统计数据
const moodStats = ref<any>(null)

// 获取完整的图片URL
const getImageUrl = (url: string): string => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return `http://localhost:3000${url}`
}

const goBack = () => {
  router.push('/home')
}

const formatDate = (date: Date | string) => {
  if (typeof date === 'string') return date
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 格式化日期只显示年月日
const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return ''
  // 如果已经是 YYYY-MM-DD 格式，直接返回
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr
  // 如果包含时间部分，只取日期部分
  return dateStr.split('T')[0].split(' ')[0]
}

const openCreateDialog = () => {
  isEditMode.value = false
  editingDiaryId.value = null
  resetForm()
  showDialog.value = true
}

const openEditDialog = (diary: MoodDiary) => {
  isEditMode.value = true
  editingDiaryId.value = diary.id
  formTitle.value = diary.title
  formContent.value = diary.content
  selectedDate.value = new Date(diary.diary_date)
  selectedMood.value = diary.mood
  if (diary.images && diary.images.trim()) {
    imageList.value = diary.images.split(',').map((url, index) => ({
      uid: Date.now() + index,
      name: `image${index}`,
      url: url.trim(),
      status: 'success'
    }))
  } else {
    imageList.value = []
  }
  showDialog.value = true
}

const resetForm = () => {
  formTitle.value = ''
  formContent.value = ''
  selectedDate.value = new Date()
  selectedMood.value = 'happy'
  imageList.value = []
}

const cancelSubmit = () => {
  showDialog.value = false
  resetForm()
}

const submitDiary = async () => {
  if (!formContent.value.trim()) {
    ElMessage.warning('请填写日记内容')
    return
  }

  // 上传图片到服务器
  let imageUrls: string[] = []
  
  if (imageList.value.length > 0) {
    try {
      ElMessage.info('正在上传图片...')
      
      // 获取所有需要上传的文件
      const filesToUpload = imageList.value
        .filter(file => file.raw)
        .map(file => file.raw!)
      
      // 获取已有的图片URL（编辑模式）
      const existingUrls = imageList.value
        .filter(file => file.url && !file.raw)
        .map(file => file.url || '')
        .filter(url => url)
      
      if (filesToUpload.length > 0) {
        // 上传新图片
        const uploadedUrls = await uploadMultipleImages(filesToUpload)
        ElMessage.success(`成功上传 ${uploadedUrls.length} 张图片`)
        imageUrls = [...existingUrls, ...uploadedUrls]
      } else {
        // 编辑模式下，只保留原有的URL
        imageUrls = existingUrls
      }
    } catch (error) {
      ElMessage.error('图片上传失败')
      return
    }
  }

  const data: MoodDiaryFormData = {
    title: formTitle.value || formatDate(selectedDate.value) + '的日记',
    content: formContent.value,
    mood: selectedMood.value as any,
    images: imageUrls.join(',') || undefined,
    diary_date: formatDate(selectedDate.value)
  }

  console.log('提交的日记数据:', data)
  console.log('图片URL数组:', imageUrls)
  console.log('图片URL数组长度:', imageUrls.length)
  console.log('images字段值:', data.images)

  loading.value = true
  try {
    if (isEditMode.value && editingDiaryId.value) {
      await updateDiary(editingDiaryId.value, data)
      ElMessage.success('日记更新成功')
    } else {
      await createDiary(data)
      ElMessage.success('日记创建成功')
    }
    showDialog.value = false
    resetForm()
    loadDiaries()
  } catch (error) {
    ElMessage.error('操作失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这篇日记吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    loading.value = true
    await deleteDiary(id)
    ElMessage.success('日记删除成功')
    loadDiaries()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败，请稍后重试')
    }
  } finally {
    loading.value = false
  }
}

const loadDiaries = async () => {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value
    }
    
    if (filterMood.value) params.mood = filterMood.value
    if (startDate.value) params.start_date = startDate.value
    if (endDate.value) params.end_date = endDate.value
    
    const response = await getDiaries(params)
    if (response.success) {
      diaryEntries.value = response.data.diaries
      total.value = response.data.pagination.total
    }
  } catch (error) {
    ElMessage.error('加载日记失败')
  } finally {
    loading.value = false
  }
}

const loadMoodStats = async () => {
  try {
    const response = await getMoodStats(30)
    if (response.success) {
      moodStats.value = response.data
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  loadDiaries()
}

const handleFilter = () => {
  currentPage.value = 1
  loadDiaries()
}

const resetFilter = () => {
  filterMood.value = ''
  startDate.value = ''
  endDate.value = ''
  currentPage.value = 1
  loadDiaries()
}

// 图片上传处理
const handleRemove: UploadProps['onRemove'] = (_uploadFile, uploadFiles) => {
  imageList.value = uploadFiles
}

const handlePictureCardPreview: UploadProps['onPreview'] = () => {
  // 点击预览功能暂时禁用,因为图片已处理为 blob URL
  // 如需实现,可以使用 el-image-viewer 组件
}

const openImage = (url: string) => {
  // 如果是相对路径，拼接完整URL
  const fullUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`
  window.open(fullUrl, '_blank')
}

// 图片上传前压缩
const handleBeforeUpload: UploadProps['beforeUpload'] = async (uploadFile) => {
  const isImage = uploadFile.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }

  // 限制文件大小 (10MB)
  const isLt10M = uploadFile.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB!')
    return false
  }

  try {
    ElMessage.info('正在压缩图片...')
    const originalSize = uploadFile.size

    // 压缩图片
    const compressedBlob = await compressImage(uploadFile, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.8,
      type: 'image/jpeg'
    })

    const compressedSize = compressedBlob.size
    const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(1)

    ElMessage.success(`图片压缩完成! 原始大小: ${formatFileSize(originalSize)} -> 压缩后: ${formatFileSize(compressedSize)} (节省 ${reduction}%)`)

    // 将压缩后的 Blob 转换为 File,并添加 uid 属性
    const compressedFile = new File([compressedBlob], uploadFile.name, {
      type: 'image/jpeg',
      lastModified: Date.now()
    }) as any
    compressedFile.uid = Date.now()

    // 返回 false 阻止默认上传,手动处理
    // 注意:由于 Element Plus 的限制,这里只能通过 beforeUpload 阻止,实际文件需要通过其他方式处理
    // 这里我们创建一个临时 URL 用于预览
    const fileItem: UploadUserFile = {
      name: compressedFile.name,
      url: URL.createObjectURL(compressedFile),
      raw: compressedFile,
      size: compressedFile.size,
      status: 'ready',
      uid: compressedFile.uid
    }

    imageList.value.push(fileItem)

    return false
  } catch (error) {
    ElMessage.error('图片压缩失败,请重试')
    console.error('压缩错误:', error)
    return false
  }
}

onMounted(() => {
  loadDiaries()
  loadMoodStats()
})
</script>

<template>
  <div class="diary-container" :style="containerStyle">
    <!-- 天空装饰 + 主题切换 -->
    <ThemeDecorations :isDark="isDark" @toggle="toggleTheme" />

    <!-- 头部导航 -->
    <div class="header">
      <div class="header-content">
        <div class="back-btn" @click="goBack">
          <el-icon :size="24">
            <ArrowLeft />
          </el-icon>
          <span>返回</span>
        </div>
        <div class="logo">
          <el-icon :size="32">
            <Calendar />
          </el-icon>
          <span>心情日记</span>
        </div>
        <div class="add-btn" @click="openCreateDialog">
          <el-icon :size="24">
            <Plus />
          </el-icon>
          <span>记日记</span>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 筛选栏 -->
      <div class="filter-bar">
        <el-select
          v-model="filterMood"
          placeholder="筛选心情"
          clearable
          style="width: 150px"
          @change="handleFilter"
        >
          <el-option
            v-for="mood in getAllMoods()"
            :key="mood.key"
            :label="`${mood.emoji} ${mood.label}`"
            :value="mood.key"
          />
        </el-select>
        
        <el-date-picker
          v-model="startDate"
          type="date"
          placeholder="开始日期"
          value-format="YYYY-MM-DD"
          style="width: 150px"
          @change="handleFilter"
        />
        
        <span class="date-separator">至</span>
        
        <el-date-picker
          v-model="endDate"
          type="date"
          placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 150px"
          @change="handleFilter"
        />
        
        <el-button @click="resetFilter">重置</el-button>
      </div>

      <!-- 日记列表 -->
      <div class="diary-list" v-loading="loading">
        <div v-if="diaryEntries.length === 0" class="empty-state">
          <el-icon :size="60" class="empty-icon">
            <Calendar />
          </el-icon>
          <p>还没有日记，点击"记日记"开始记录吧</p>
        </div>
        
        <div v-for="entry in diaryEntries" :key="entry.id" class="diary-card" @click="router.push(`/diary/${entry.id}`)">
          <div class="diary-header">
            <div class="diary-date">
              <el-icon :size="20">
                <Calendar />
              </el-icon>
              <span>{{ formatDateDisplay(entry.diary_date) }}</span>
            </div>
            <div class="diary-header-right">
              <div class="diary-mood" :style="{ color: getMoodInfo(entry.mood).color }">
                <span class="mood-emoji">{{ getMoodInfo(entry.mood).emoji }}</span>
                <span class="mood-label">{{ getMoodInfo(entry.mood).label }}</span>
              </div>
              <button class="action-btn edit-btn" @click.stop="openEditDialog(entry)">
                <el-icon><Edit /></el-icon>
                <span>编辑</span>
              </button>
              <button class="action-btn delete-btn" @click.stop="handleDelete(entry.id)">
                <el-icon><Close /></el-icon>
                <span>删除</span>
              </button>
            </div>
          </div>
          <div v-if="entry.title" class="diary-title">
            <h3>{{ entry.title }}</h3>
          </div>
          <div class="diary-content">
            <p>{{ entry.content }}</p>
          </div>
          <div v-if="entry.images && entry.images.trim()" class="diary-images">
            <div v-for="(img, index) in entry.images.split(',')" :key="index" class="diary-image">
              <img :src="getImageUrl(img.trim())" alt="日记图片" @click="openImage(img.trim())" />
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <el-pagination
          v-if="total > pageSize"
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="loadDiaries"
          class="pagination"
        />
      </div>
    </div>

    <!-- 写日记对话框 -->
    <el-dialog
      v-model="showDialog"
      :title="isEditMode ? '编辑日记' : '写日记'"
      width="600px"
      :show-close="false"
    >
      <el-form label-position="top">
        <el-form-item label="日期">
          <el-date-picker
            v-model="selectedDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="心情">
          <el-select v-model="selectedMood" placeholder="选择心情" style="width: 100%">
            <el-option
              v-for="mood in getAllMoods()"
              :key="mood.key"
              :label="`${mood.emoji} ${mood.label}`"
              :value="mood.key"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="标题（可选）">
          <el-input
            v-model="formTitle"
            placeholder="给日记起个标题..."
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="内容">
          <el-input
            v-model="formContent"
            type="textarea"
            :rows="8"
            placeholder="记录今天发生的事件、想法、感受..."
            maxlength="5000"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="上传图片（可选）">
          <el-upload
            v-model:file-list="imageList"
            action="#"
            list-type="picture-card"
            :auto-upload="false"
            :before-upload="handleBeforeUpload"
            :on-remove="handleRemove"
            :on-preview="handlePictureCardPreview"
          >
            <el-icon :size="30">
              <Plus />
            </el-icon>
          </el-upload>
          <div class="upload-tip">支持上传图片，记录生活中的美好瞬间 (自动压缩优化性能)</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelSubmit" :disabled="loading">取消</el-button>
          <el-button type="primary" @click="submitDiary" :loading="loading">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.diary-container {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  transition: background 0.5s ease;
  padding-bottom: 20px;
}


/* 头部样式 */
.header {
  padding: 20px 30px;
  position: relative;
  z-index: 10;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  border-radius: 50px;
  padding: 15px 30px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #ffffff;
  font-weight: 600;
  transition: all 0.3s;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.back-btn:hover {
  color: #f0f0f0;
  transform: translateX(-3px);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #ffffff;
  font-size: 22px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #ffffff;
  font-weight: 600;
  transition: all 0.3s;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.add-btn:hover {
  color: #f0f0f0;
  transform: translateX(3px);
}

/* 主内容区 */
.main-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  position: relative;
  z-index: 10;
}

/* 筛选栏 */
.filter-bar {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.date-separator {
  color: #666;
  font-size: 14px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #999;
}

.empty-state .empty-icon {
  color: #ddd;
  margin-bottom: 20px;
}

.empty-state p {
  font-size: 16px;
  margin: 0;
}

/* 日记列表 */
.diary-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.diary-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  cursor: pointer;
}

.diary-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.diary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.diary-date {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 15px;
}

.diary-mood {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.diary-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.edit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.edit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.delete-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.delete-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);
}

.mood-emoji {
  font-size: 24px;
}

.mood-label {
  font-size: 14px;
  font-weight: 500;
}

.diary-title {
  margin-bottom: 12px;
}

.diary-title h3 {
  color: #333;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.diary-content {
  margin-bottom: 15px;
}

.diary-content p {
  color: #333;
  font-size: 15px;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
}

.diary-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.diary-image {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid rgba(0, 0, 0, 0.1);
}

.diary-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s;
}

.diary-image img:hover {
  transform: scale(1.05);
}

/* 心情选择器 */
.mood-selector {
  width: 100%;
}

.mood-label {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #333;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

/* 上传提示 */
.upload-tip {
  color: #999;
  font-size: 13px;
  margin-top: 5px;
}

/* 对话框样式 */
:deep(.el-dialog) {
  border-radius: 20px;
}

:deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px 20px 0 0;
  padding: 20px 30px;
}

:deep(.el-dialog__title) {
  color: white;
  font-size: 18px;
  font-weight: 600;
}

:deep(.el-textarea__inner) {
  border-radius: 10px;
  font-size: 15px;
}

.dialog-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

:deep(.el-button) {
  padding: 10px 25px;
  border-radius: 8px;
}
</style>
