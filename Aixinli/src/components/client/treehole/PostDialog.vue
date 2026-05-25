<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

interface Props {
  showDialog: boolean
}

interface PostData {
  anonymousName: string
  emotion: string
  content: string
}

const emit = defineEmits<{
  'update:showDialog': [value: boolean]
  submit: [data: PostData]
  cancel: []
}>()

const props = defineProps<Props>()

const localShowDialog = computed({
  get: () => props.showDialog,
  set: (val) => emit('update:showDialog', val)
})

const anonymousName = ref('')
const newEmotion = ref('neutral')
const newContent = ref('')

const emotionOptions = [
  { label: '😊 开心', value: 'happy' },
  { label: '😢 难过', value: 'sad' },
  { label: '😰 焦虑', value: 'anxious' },
  { label: '😠 生气', value: 'angry' },
  { label: '😐 平静', value: 'neutral' }
]

const handleSubmit = () => {
  if (!newContent.value.trim()) {
    ElMessage.warning('请输入内容')
    return
  }

  if (!anonymousName.value.trim()) {
    ElMessage.warning('请填写匿名昵称')
    return
  }

  emit('submit', {
    anonymousName: anonymousName.value,
    emotion: newEmotion.value,
    content: newContent.value
  })
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <el-dialog
    v-model="localShowDialog"
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
        <el-select v-model="newEmotion" class="emotion-select">
          <el-option
            v-for="option in emotionOptions"
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
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit">发送</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
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

.emotion-select {
  width: 100%;
}

:deep(.el-textarea__inner),
:deep(.el-input__inner) {
  border-radius: 10px;
  font-size: 15px;
}

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
