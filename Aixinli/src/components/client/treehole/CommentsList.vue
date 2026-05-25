<script setup lang="ts">
import { Delete } from "@element-plus/icons-vue";

interface Comment {
  id: number;
  user_id: number;
  anonymous_name: string;
  content: string;
  likes_count: number;
  created_at: string;
  avatar: string | null;
  username: string | null;
}

interface Props {
  comments: Comment[];
  currentUserId: number | null;
  isLiked: (commentId: number) => boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  like: [commentId: number];
  delete: [commentId: number];
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

const handleLike = (commentId: number) => {
  emit("like", commentId);
};

const handleDelete = async (commentId: number) => {
  emit("delete", commentId);
};
</script>

<template>
  <div class="comments-list">
    <div v-if="comments.length === 0" class="empty-comments">
      暂无评论，快来发表第一条评论吧！
    </div>

    <div v-else class="comments">
      <div v-for="comment in comments" :key="comment.id" class="comment-item">
        <div class="comment-avatar">
          {{ comment.anonymous_name.charAt(0) }}
        </div>

        <div class="comment-content-wrapper">
          <div class="comment-header">
            <span class="comment-author">{{ comment.anonymous_name }}</span>
            <span class="comment-time">{{
              formatTime(comment.created_at)
            }}</span>
          </div>

          <div class="comment-text">
            {{ comment.content }}
          </div>

          <div class="comment-footer">
            <div
              class="comment-like-btn"
              :class="{ liked: isLiked(comment.id) }"
              @click="handleLike(comment.id)"
            >
              <svg
                class="heart-icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  :fill="isLiked(comment.id) ? '#f56c6c' : 'none'"
                  :stroke="isLiked(comment.id) ? '#f56c6c' : '#666666'"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span>{{ comment.likes_count }}</span>
            </div>

            <div
              v-if="comment.user_id === currentUserId"
              class="comment-delete-btn"
              @click="handleDelete(comment.id)"
            >
              <el-icon :size="14"><Delete /></el-icon>
              <span>删除</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.comments-list {
  margin-top: 20px;
}

.empty-comments {
  text-align: center;
  padding: 30px;
  color: #999;
  font-size: 14px;
}

.comments {
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
  gap: 20px;
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
  display: flex;
  align-items: center;
  gap: 4px;
  color: #999;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    color: #f56c6c;
  }
}
</style>
