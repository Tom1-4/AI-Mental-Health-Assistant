<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { Plus, Edit, ArrowLeft, Delete } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../../stores/auth'
import { useThemeStyle } from '../../composables/useThemeStyle'

// 自定义树图标组件
const TreeIcon = () => {
  return h('svg', {
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg'
  }, [
    h('path', {
      d: 'M12 2L4 10H7V18H10V14H14V18H17V10H20L12 2Z',
      fill: 'currentColor',
      fillOpacity: '0.8'
    }),
    h('path', {
      d: 'M8 18V22H16V18',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round'
    })
  ])
}

interface Post {
  id: number
  user_id: number
  anonymous_name: string
  content: string
  emotion: string
  likes_count: number
  comments_count: number
  is_anonymous: number
  created_at: string
  avatar: string | null
  username: string | null
}

const router = useRouter()
const authStore = useAuthStore()
const { isDark, containerStyle, toggleTheme } = useThemeStyle()

const showDialog = ref(false)
const newContent = ref('')
const newEmotion = ref('neutral')
const anonymousName = ref('')
const isAnonymous = ref(true)
const isLoading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const totalPages = ref(1)
const total = ref(0)
const emotionFilter = ref('all')
const sortBy = ref('newest')

const posts = ref<Post[]>([])
const likedPosts = ref<Set<number>>(new Set())

const isLiked = (postId: number) => likedPosts.value.has(postId)

// 跳转到帖子详情
const goToPostDetail = (postId: number) => {
  router.push(`/treehole/post/${postId}`)
}

const emotionOptions = [
  { label: '全部', value: 'all' },
  { label: '😊 开心', value: 'happy' },
  { label: '😢 难过', value: 'sad' },
  { label: '😰 焦虑', value: 'anxious' },
  { label: '😠 生气', value: 'angry' },
  { label: '😐 平静', value: 'neutral' }
]

const emotionEmoji: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  anxious: '😰',
  angry: '😠',
  neutral: '😐',
  all: ''
}

const goBack = () => {
  router.push('/home')
}

const openDialog = () => {
  showDialog.value = true
  anonymousName.value = ''
  newContent.value = ''
  newEmotion.value = 'neutral'
}

const cancelSubmit = () => {
  newContent.value = ''
  anonymousName.value = ''
  showDialog.value = false
}

// 获取帖子列表
const fetchPosts = async () => {
  try {
    isLoading.value = true
    const currentToken = localStorage.getItem('token')

    if (!currentToken) {
      ElMessage.warning('请先登录')
      router.push('/')
      return
    }

    const emotionParam = emotionFilter.value === 'all' ? '' : `&emotion=${emotionFilter.value}`
    const sortParam = sortBy.value === 'newest' ? '' : `&sort=${sortBy.value}`
    
    const response = await fetch(
      `http://localhost:3000/api/soulcave/posts?page=${currentPage.value}&limit=${pageSize.value}${emotionParam}${sortParam}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      }
    )

    if (response.status === 401) {
      ElMessage.warning('登录已过期，请重新登录')
      authStore.logout()
      router.push('/')
      return
    }

    const data = await response.json()

    if (data.success && data.data.posts) {
      posts.value = data.data.posts
      total.value = data.data.pagination.total
      totalPages.value = data.data.pagination.totalPages
      currentPage.value = data.data.pagination.page

      // 初始化点赞状态
      likedPosts.value = new Set(data.data.likedPostIds || [])
    }
  } catch (error) {
    console.error('获取帖子列表失败:', error)
    ElMessage.error('获取帖子列表失败')
  } finally {
    isLoading.value = false
  }
}

// 发布帖子
const submitMessage = async () => {
  if (!newContent.value.trim()) {
    ElMessage.warning('请输入内容')
    return
  }

  if (isAnonymous.value && !anonymousName.value.trim()) {
    ElMessage.warning('匿名发布需要填写昵称')
    return
  }

  try {
    const currentToken = localStorage.getItem('token')

    if (!currentToken) {
      ElMessage.warning('请先登录')
      return
    }

    const response = await fetch('http://localhost:3000/api/soulcave/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify({
        content: newContent.value,
        emotion: newEmotion.value,
        anonymous_name: isAnonymous.value ? anonymousName.value : '',
        is_anonymous: isAnonymous.value
      })
    })

    if (response.status === 401) {
      ElMessage.warning('登录已过期，请重新登录')
      authStore.logout()
      router.push('/')
      return
    }

    const data = await response.json()

    if (data.success) {
      ElMessage.success('发布成功')
      newContent.value = ''
      anonymousName.value = ''
      showDialog.value = false
      // 刷新帖子列表
      currentPage.value = 1
      fetchPosts()
    } else {
      ElMessage.error(data.message || '发布失败')
    }
  } catch (error) {
    console.error('发布失败:', error)
    ElMessage.error('发布失败，请稍后重试')
  }
}

// 删除帖子
const deletePost = async (postId: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这条帖子吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const currentToken = localStorage.getItem('token')

    if (!currentToken) {
      ElMessage.warning('请先登录')
      return
    }

    const response = await fetch(`http://localhost:3000/api/soulcave/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${currentToken}`
      }
    })

    if (response.status === 401) {
      ElMessage.warning('登录已过期，请重新登录')
      authStore.logout()
      router.push('/')
      return
    }

    const data = await response.json()

    if (data.success) {
      ElMessage.success('删除成功')
      fetchPosts()
    } else {
      ElMessage.error(data.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败，请稍后重试')
    }
  }
}

// 点赞/取消点赞
const toggleLike = async (postId: number) => {
  try {
    const currentToken = localStorage.getItem('token')

    if (!currentToken) {
      ElMessage.warning('请先登录')
      return
    }

    const response = await fetch('http://localhost:3000/api/soulcave/like', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify({
        target_id: postId,
        target_type: 'post'
      })
    })

    if (response.status === 401) {
      ElMessage.warning('登录已过期，请重新登录')
      authStore.logout()
      router.push('/')
      return
    }

    const data = await response.json()

    if (data.success) {
      // 更新点赞状态
      if (isLiked(postId)) {
        likedPosts.value.delete(postId)
      } else {
        likedPosts.value.add(postId)
      }
      // 刷新列表
      fetchPosts()
    }
  } catch (error) {
    console.error('点赞失败:', error)
    ElMessage.error('操作失败')
  }
}

// 格式化时间
const formatTime = (time: string) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 筛选变化
const handleFilterChange = () => {
  currentPage.value = 1
  fetchPosts()
}

// 排序变化
const handleSortChange = () => {
  currentPage.value = 1
  fetchPosts()
}

// 翻页
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchPosts()
}

onMounted(() => {
  fetchPosts()
})
</script>

<template>
  <div class="treehole-container" :style="containerStyle">
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
          <div class="tree-icon-wrapper">
            <TreeIcon />
          </div>
          <span>心灵树洞</span>
        </div>
        <div class="placeholder"></div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 筛选和排序栏 -->
      <div class="filter-bar">
        <div class="filter-left">
          <span>情绪筛选：</span>
          <el-select 
            v-model="emotionFilter" 
            @change="handleFilterChange"
            class="emotion-select"
          >
            <el-option
              v-for="option in emotionOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>
        <div class="filter-right">
          <el-select 
            v-model="sortBy" 
            @change="handleSortChange"
            class="sort-select"
          >
            <el-option label="最新" value="newest" />
            <el-option label="最晚" value="latest" />
            <el-option label="最热" value="hottest" />
          </el-select>
        </div>
      </div>

      <!-- 发布按钮 -->
      <div class="publish-btn" @click="openDialog">
        <el-icon :size="28">
          <Plus />
        </el-icon>
        <span>倾诉心声</span>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading && posts.length === 0" class="loading-state">
        <el-icon class="is-loading" :size="32"><Edit /></el-icon>
        <span>加载中...</span>
      </div>

      <!-- 空状态 -->
      <div v-else-if="posts.length === 0" class="empty-state">
        <el-icon :size="64"><Edit /></el-icon>
        <p>还没有帖子，快来倾诉你的心声吧！</p>
      </div>

      <!-- 帖子列表 -->
      <div v-else class="treehole-list">
        <div v-for="post in posts" :key="post.id" class="treehole-card">
          <div class="card-header">
            <div class="author-info">
              <div class="avatar">{{ post.anonymous_name.charAt(0) }}</div>
              <div class="author-details">
                <span class="author-name">{{ post.anonymous_name }}</span>
                <span class="post-time">{{ formatTime(post.created_at) }}</span>
              </div>
            </div>
            <div class="emotion-tag">{{ emotionEmoji[post.emotion] }}</div>
          </div>
          <div class="card-content">
            <p>{{ post.content }}</p>
          </div>
          <div class="card-footer">
            <div class="interaction">
              <!-- 点赞按钮 -->
              <div 
                class="like-btn" 
                :class="{ 'liked': isLiked(post.id) }"
                @click="toggleLike(post.id)"
              >
                <svg 
                  class="heart-icon" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                    :fill="isLiked(post.id) ? '#f56c6c' : 'none'"
                    :stroke="isLiked(post.id) ? '#f56c6c' : '#666666'"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <span>{{ post.likes_count }}</span>
              </div>
              
              <!-- 评论数 -->
              <div class="comment-count" @click="goToPostDetail(post.id)">
                <svg class="comment-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                    stroke="#666"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <span>{{ post.comments_count }}</span>
              </div>
            </div>
            <!-- 删除按钮 -->
            <div 
              v-if="post.user_id === authStore.user?.id" 
              class="delete-btn"
              @click="deletePost(post.id)"
            >
              <el-icon :size="16"><Delete /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 30]"
          layout="prev, pager, next, sizes, total"
          @current-change="handlePageChange"
          @size-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 发布对话框 -->
    <el-dialog
      v-model="showDialog"
      title="倾诉你的心声"
      width="500px"
      :show-close="false"
    >
      <div class="dialog-content">
        <div class="form-item">
          <label>匿名昵称：</label>
          <el-input
            v-model="anonymousName"
            placeholder="给自己起个昵称"
            maxlength="20"
            show-word-limit
          />
        </div>
        <div class="form-item">
          <label>当前情绪：</label>
          <el-select v-model="newEmotion" class="emotion-select-dialog">
            <el-option
              v-for="option in emotionOptions.filter(o => o.value !== 'all')"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>
        <div class="form-item">
          <label>心声内容：</label>
          <el-input
            v-model="newContent"
            type="textarea"
            :rows="6"
            placeholder="在这里写下你的想法，这里是安全的树洞..."
            maxlength="2000"
            show-word-limit
          />
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelSubmit">取消</el-button>
          <el-button type="primary" @click="submitMessage" :loading="isLoading">
            发送
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.treehole-container {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  transition: background 0.5s ease;
  padding-bottom: 40px;
}

/* 天体样式 */
.celestial-body {
  position: absolute;
  border-radius: 50%;
}

.sun {
  top: 60px;
  right: 100px;
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, #FFD700 0%, #FFA500 100%);
  box-shadow: 0 0 60px #FFD700;
  animation: pulse 3s ease-in-out infinite;
}

.moon {
  top: 80px;
  right: 120px;
  width: 60px;
  height: 60px;
  background: radial-gradient(circle, #f5f5dc 0%, #e0e0d0 100%);
  box-shadow: 0 0 30px rgba(245, 245, 220, 0.5);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
}

/* 云朵样式 */
.clouds {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;
  overflow: hidden;
}

.cloud {
  position: absolute;
  background: white;
  border-radius: 50%;
  opacity: 0.8;
  animation: float 20s linear infinite;
}

.cloud::before,
.cloud::after {
  content: '';
  position: absolute;
  background: white;
  border-radius: 50%;
}

.cloud-1 {
  width: 100px;
  height: 40px;
  top: 60px;
  left: -100px;
  animation-duration: 25s;
}

.cloud-1::before {
  width: 50px;
  height: 50px;
  top: -25px;
  left: 15px;
}

.cloud-1::after {
  width: 60px;
  height: 60px;
  top: -30px;
  left: 40px;
}

.cloud-2 {
  width: 120px;
  height: 50px;
  top: 100px;
  left: -150px;
  animation-duration: 30s;
  animation-delay: 5s;
}

.cloud-2::before {
  width: 60px;
  height: 60px;
  top: -30px;
  left: 20px;
}

.cloud-2::after {
  width: 70px;
  height: 70px;
  top: -35px;
  left: 50px;
}

.cloud-3 {
  width: 80px;
  height: 30px;
  top: 50px;
  left: -80px;
  animation-duration: 20s;
  animation-delay: 10s;
}

.cloud-3::before {
  width: 40px;
  height: 40px;
  top: -20px;
  left: 10px;
}

.cloud-3::after {
  width: 50px;
  height: 50px;
  top: -25px;
  left: 30px;
}

@keyframes float {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(calc(100vw + 200px));
  }
}

/* 星星样式 */
.star {
  position: absolute;
  width: 3px;
  height: 3px;
  background: white;
  border-radius: 50%;
  animation: twinkle 2s ease-in-out infinite;
}

.star:nth-child(odd) {
  animation-delay: 1s;
}

.star-1 { top: 10%; left: 10%; animation-delay: 0.1s; }
.star-2 { top: 15%; left: 30%; animation-delay: 0.3s; }
.star-3 { top: 8%; left: 50%; animation-delay: 0.5s; }
.star-4 { top: 20%; left: 70%; animation-delay: 0.7s; }
.star-5 { top: 12%; left: 90%; animation-delay: 0.9s; }
.star-6 { top: 25%; left: 20%; animation-delay: 0.2s; }
.star-7 { top: 18%; left: 40%; animation-delay: 0.4s; }
.star-8 { top: 22%; left: 60%; animation-delay: 0.6s; }
.star-9 { top: 14%; left: 80%; animation-delay: 0.8s; }
.star-10 { top: 28%; left: 5%; animation-delay: 1s; }
.star-11 { top: 30%; left: 25%; animation-delay: 0.1s; }
.star-12 { top: 26%; left: 45%; animation-delay: 0.3s; }
.star-13 { top: 32%; left: 65%; animation-delay: 0.5s; }
.star-14 { top: 29%; left: 85%; animation-delay: 0.7s; }
.star-15 { top: 35%; left: 15%; animation-delay: 0.9s; }

@keyframes twinkle {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

/* 流星样式 */
.meteor {
  position: absolute;
  width: 120px;
  height: 2px;
  background: linear-gradient(to right, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0));
  border-radius: 50%;
  animation: meteorShower linear infinite;
  opacity: 0;
}

.meteor::before {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 10px 3px rgba(255, 255, 255, 0.9);
}

.meteor-1 {
  top: 5%;
  left: 10%;
  animation-duration: 3s;
  animation-delay: 0s;
}

.meteor-2 {
  top: 10%;
  left: 30%;
  width: 150px;
  animation-duration: 4s;
  animation-delay: 1.5s;
}

.meteor-3 {
  top: 8%;
  left: 50%;
  width: 100px;
  animation-duration: 3.5s;
  animation-delay: 2.5s;
}

@keyframes meteorShower {
  0% {
    transform: translateX(0) translateY(0) rotate(45deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 0.8;
  }
  100% {
    transform: translateX(calc(100vw * 1.5)) translateY(calc(100vw * 1.5)) rotate(45deg);
    opacity: 0;
  }
}

/* 主题切换按钮 */
.theme-toggle {
  position: fixed;
  top: 80px;
  right: 30px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 1000;
}

.theme-toggle:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: scale(1.1);
}

.toggle-icon {
  color: #333;
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

.tree-icon-wrapper {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.tree-icon-wrapper svg {
  width: 100%;
  height: 100%;
}

.placeholder {
  width: 80px;
}

/* 主内容区 */
.main-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  position: relative;
  z-index: 10;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 15px 20px;
  margin-bottom: 20px;
}

.filter-left,
.filter-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-left span {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.emotion-select,
.sort-select,
.emotion-select-dialog {
  width: 120px;
}

/* 发布按钮 */
.publish-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 15px;
  cursor: pointer;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 30px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: all 0.3s;
}

.publish-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

/* 加载和空状态 */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
  gap: 15px;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
  color: #999;
}

/* 帖子列表 */
.treehole-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.treehole-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.treehole-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.author-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.author-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.post-time {
  font-size: 12px;
  color: #999;
}

.emotion-tag {
  font-size: 24px;
}

.card-content {
  margin-bottom: 15px;
}

.card-content p {
  color: #333;
  font-size: 16px;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.interaction {
  display: flex;
  align-items: center;
  gap: 20px;
}

.like-btn,
.comment-count {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.heart-icon {
  transition: all 0.3s;
}

.like-btn:hover {
  color: #f56c6c;
}

.like-btn.liked {
  color: #f56c6c;
}

.like-btn.liked .heart-icon {
  transform: scale(1.1);
}

.comment-count:hover {
  color: #667eea;
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: #999;
  cursor: pointer;
  transition: all 0.3s;
}

.delete-btn:hover {
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.1);
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 15px;
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

.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

:deep(.el-textarea__inner),
:deep(.el-input__inner) {
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
