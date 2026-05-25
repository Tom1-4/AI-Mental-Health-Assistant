<script setup lang="ts">
import { computed } from "vue";
import { Delete } from "@element-plus/icons-vue";
import { ElMessageBox } from "element-plus";

interface Post {
  id: number;
  user_id: number;
  anonymous_name: string;
  content: string;
  emotion: string;
  likes_count: number;
  comments_count: number;
  is_anonymous: number;
  created_at: string;
  avatar: string | null;
  username: string | null;
}

interface Props {
  post: Post;
  currentUserId: number | null;
  isLiked: (postId: number) => boolean;
  emotionEmoji: Record<string, string>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  like: [postId: number];
  delete: [postId: number];
  viewComments: [postId: number];
}>();

const formatTime = (time: string) => {
  const date = new Date(time);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
};

const handleLike = () => {
  emit("like", props.post.id);
};

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm("确定要删除这条帖子吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    emit("delete", props.post.id);
  } catch (error) {
    // 用户取消
  }
};

const canDelete = computed(() => props.post.user_id === props.currentUserId);
</script>

<template>
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
        <!-- 点赞按钮 -->
        <div
          class="like-btn"
          :class="{ liked: isLiked(post.id) }"
          @click="handleLike"
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
        <div class="comment-count" @click="emit('viewComments', post.id)">
          <svg
            class="comment-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
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

        <!-- 删除按钮 -->
        <div v-if="canDelete" class="delete-btn" @click="handleDelete">
          <el-icon :size="16"><Delete /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.post-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.post-card:hover {
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
</style>
