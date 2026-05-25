<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../../../stores/auth'
import request from '../../../utils/request'

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

interface Comment {
  id: number
  user_id: number
  anonymous_name: string
  content: string
  likes_count: number
  is_anonymous: number
  created_at: string
  avatar: string | null
  username: string | null
}

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const post = ref<Post | null>(null)
const comments = ref<Comment[]>([])
const likedComments = ref<Set<number>>(new Set())
const newComment = ref('')
const isLoading = ref(false)
const isSubmitting = ref(false)

const emotionEmoji: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  anxious: '😰',
  angry: '😠',
  neutral: '😐'
}

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

const isCommentLiked = (commentId: number) => likedComments.value.has(commentId)

// 获取帖子详情
const fetchPostDetail = async () => {
  try {
    isLoading.value = true
    const postId = route.params.id as string

    const response = await request.get(`/soulcave/posts/${postId}`)

    if (response.data.success && response.data.data.post) {
      post.value = response.data.data.post
    } else {
      ElMessage.error('帖子不存在')
      router.push('/home')
    }
  } catch (error) {
    console.error('获取帖子详情失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 获取评论列表
const fetchComments = async () => {
  if (!post.value) return

  try {
    const response = await request.get(`/soulcave/comments/${post.value.id}`)

    if (response.data.success && response.data.data.comments) {
      comments.value = response.data.data.comments
      // 初始化评论点赞状态
      if (response.data.data.likedCommentIds) {
        likedComments.value = new Set(response.data.data.likedCommentIds)
      }
    }
  } catch (error) {
    console.error('获取评论失败:', error)
  }
}

// 点赞评论
const toggleCommentLike = async (commentId: number) => {
  try {
    const response = await request.post('/soulcave/like', {
      target_id: commentId,
      target_type: 'comment'
    })

    if (response.data.success) {
      const comment = comments.value.find(c => c.id === commentId)
      if (comment) {
        if (isCommentLiked(commentId)) {
          likedComments.value.delete(commentId)
          comment.likes_count--
        } else {
          likedComments.value.add(commentId)
          comment.likes_count++
        }
      }
    }
  } catch (error) {
    console.error('点赞失败:', error)
  }
}

// 删除评论
const deleteComment = async (commentId: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const response = await request.delete(`/soulcave/comments/${commentId}`)

    if (response.data.success) {
      ElMessage.success('删除成功')
      comments.value = comments.value.filter(c => c.id !== commentId)
      if (post.value) {
        post.value.comments_count--
      }
    } else {
      ElMessage.error(response.data.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除评论失败:', error)
    }
  }
}

// 提交评论
const submitComment = async () => {
  if (!newComment.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }

  if (!post.value) return

  try {
    isSubmitting.value = true

    const response = await request.post('/soulcave/comments', {
      post_id: post.value.id,
      content: newComment.value.trim(),
      anonymous_name: authStore.user?.username || '匿名用户',
      is_anonymous: 1
    })

    if (response.data.success) {
      ElMessage.success('评论成功')
      newComment.value = ''
      // 刷新评论列表
      await fetchComments()
      if (post.value) {
        post.value.comments_count++
      }
    } else {
      ElMessage.error(response.data.message || '评论失败')
    }
  } catch (error) {
    console.error('评论失败:', error)
  } finally {
    isSubmitting.value = false
  }
}

const goBack = () => {
  router.push('/treehole')
}

onMounted(() => {
  fetchPostDetail().then(() => {
    fetchComments()
  })
})
</script>

<template>
  <div class="post-detail-container">
    <!-- 头部 -->
    <div class="header">
      <div class="header-content">
        <div class="back-btn" @click="goBack">
          <el-icon :size="24">
            <ArrowLeft />
          </el-icon>
          <span>返回</span>
        </div>
        <div class="title">帖子详情</div>
        <div class="placeholder"></div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <el-icon class="is-loading" :size="32"><ArrowLeft /></el-icon>
        <span>加载中...</span>
      </div>

      <!-- 帖子不存在 -->
      <div v-else-if="!post" class="empty-state">
        <p>帖子不存在</p>
      </div>

      <div v-else class="content-wrapper">
        <!-- 帖子详情卡片 -->
        <div class="post-card">
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
              <!-- 点赞数显示 -->
              <div class="like-count">
                <svg class="heart-icon" width="16" height="16" viewBox="0 0 24 24" fill="#f56c6c" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                    stroke="#f56c6c"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <span>{{ post.likes_count }}</span>
              </div>

              <!-- 评论数 -->
              <div class="comment-count">
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
          </div>
        </div>

        <!-- 添加评论区域 -->
        <div class="add-comment-section">
          <h3 class="section-title">发表评论</h3>
          <div class="comment-input-wrapper">
            <el-input
              v-model="newComment"
              type="textarea"
              :rows="4"
              placeholder="写下你的评论..."
              maxlength="500"
              show-word-limit
              class="comment-input"
            />
            <div class="submit-btn-wrapper">
              <el-button
                type="primary"
                @click="submitComment"
                :loading="isSubmitting"
                :disabled="!newComment.trim()"
              >
                发表评论
              </el-button>
            </div>
          </div>
        </div>

        <!-- 评论列表 -->
        <div class="comments-section">
          <h3 class="section-title">全部评论 ({{ comments.length }})</h3>

          <!-- 空状态 -->
          <div v-if="comments.length === 0" class="empty-comments">
            暂无评论，快来发表第一条评论吧！
          </div>

          <!-- 评论列表 -->
          <div v-else class="comments-list">
            <div v-for="comment in comments" :key="comment.id" class="comment-item">
              <div class="comment-avatar">
                {{ comment.anonymous_name.charAt(0) }}
              </div>

              <div class="comment-content-wrapper">
                <div class="comment-header">
                  <span class="comment-author">{{ comment.anonymous_name }}</span>
                  <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
                </div>

                <div class="comment-text">
                  {{ comment.content }}
                </div>

                <div class="comment-footer">
                  <div
                    class="comment-like-btn"
                    :class="{ 'liked': isCommentLiked(comment.id) }"
                    @click="toggleCommentLike(comment.id)"
                  >
                    <svg class="heart-icon" width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                        :fill="isCommentLiked(comment.id) ? '#f56c6c' : 'none'"
                        :stroke="isCommentLiked(comment.id) ? '#f56c6c' : '#666666'"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    <span>{{ comment.likes_count }}</span>
                  </div>

                  <div
                    v-if="comment.user_id === authStore.user?.id"
                    class="comment-delete-btn"
                    @click="deleteComment(comment.id)"
                  >
                    删除
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.post-detail-container {
  min-height: 100vh;
  background: linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 50%, #B0E0E6 100%);
  padding-bottom: 40px;
}

.header {
  padding: 20px 30px;
  position: relative;
  z-index: 10;
}

.header-content {
  max-width: 800px;
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

.title {
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.placeholder {
  width: 80px;
}

.main-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  position: relative;
  z-index: 10;
}

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

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.post-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
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

.like-count,
.comment-count {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #666;
  font-size: 14px;
}

.add-comment-section {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.section-title {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.comment-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.comment-input {
  width: 100%;
}

.submit-btn-wrapper {
  display: flex;
  justify-content: flex-end;
}

.comments-section {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.empty-comments {
  text-align: center;
  padding: 30px;
  color: #999;
  font-size: 14px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s;

  &:hover {
    background: #f0f1f3;
  }
}

.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.comment-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.comment-author {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.comment-text {
  font-size: 14px;
  line-height: 1.6;
  color: #555;
  white-space: pre-wrap;
  word-break: break-word;
}

.comment-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.comment-like-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #666;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    color: #f56c6c;
  }

  &.liked {
    color: #f56c6c;
  }

  .heart-icon {
    transition: all 0.3s;
  }

  &.liked .heart-icon {
    transform: scale(1.1);
  }
}

.comment-delete-btn {
  padding: 4px 12px;
  background: #ffebee;
  color: #f56c6c;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #ffcdd2;

  &:hover {
    background: #ffcdd2;
  }
}
</style>
