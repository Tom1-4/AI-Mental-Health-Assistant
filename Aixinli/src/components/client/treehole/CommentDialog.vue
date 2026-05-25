<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

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

interface Props {
  post: Comment
  visible: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  submit: [content: string]
  'update:visible': [value: boolean]
}>()

const commentContent = ref('')
const isLoading = ref(false)

const handleSubmit = async () => {
  if (!commentContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }

  if (commentContent.value.length > 500) {
    ElMessage.warning('评论内容不能超过500字')
    return
  }

  isLoading.value = true
  
  try {
    emit('submit', commentContent.value.trim())
    commentContent.value = ''
  } catch (error) {
    console.error('提交评论失败:', error)
  } finally {
    isLoading.value = false
  }
}

const handleClose = () => {
  commentContent.value = ''
  emit('update:visible', false)
  emit('close')
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="添加评论"
    width="500px"
    :show-close="false"
    @close="handleClose"
  >
    <div class="post-preview">
      <span class="label">回复帖子：</span>
      <span class="content">{{ post.content }}</span>
    </div>

    <el-input
      v-model="commentContent"
      type="textarea"
      :rows="6"
      placeholder="写下你的评论..."
      maxlength="500"
      show-word-limit
    />

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="isLoading">
          发表评论
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.post-preview {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  
  .label {
    color: #999;
    font-size: 12px;
    margin-right: 8px;
  }
  
  .content {
    color: #333;
    font-size: 14px;
    line-height: 1.6;
  }
}

.dialog-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

:deep(.el-dialog__body) {
  padding: 20px;
}
</style>
