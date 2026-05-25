<script setup lang="ts">
const emotionOptions = [
  { label: '全部', value: 'all' },
  { label: '😊 开心', value: 'happy' },
  { label: '😢 难过', value: 'sad' },
  { label: '😰 焦虑', value: 'anxious' },
  { label: '😠 生气', value: 'angry' },
  { label: '😐 平静', value: 'neutral' }
]

defineProps<{
  emotionFilter: string
  sortBy: string
}>()

defineEmits<{
  'update:emotionFilter': [value: string]
  'update:sortBy': [value: string]
}>()
</script>

<template>
  <div class="filter-bar">
    <div class="filter-left">
      <span>情绪筛选：</span>
      <el-select 
        :model-value="emotionFilter" 
        @update:model-value="$emit('update:emotionFilter', $event)"
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
        :model-value="sortBy" 
        @update:model-value="$emit('update:sortBy', $event)"
        class="sort-select"
      >
        <el-option label="最新" value="newest" />
        <el-option label="最晚" value="latest" />
        <el-option label="最热" value="hottest" />
      </el-select>
    </div>
  </div>
</template>

<style scoped lang="scss">
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
.sort-select {
  width: 120px;
}
</style>
