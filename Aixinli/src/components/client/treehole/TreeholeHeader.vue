<script setup lang="ts">
import { computed } from "vue";
import { ArrowLeft } from "@element-plus/icons-vue";

const props = defineProps<{
  isDark: boolean;
}>();

const emit = defineEmits<{
  goBack: [];
  toggleTheme: [];
}>();

const headerStyle = computed(() => ({
  background: "rgba(255, 255, 255, 0.25)",
  backdropFilter: "blur(10px)",
  borderRadius: "50px",
  padding: "15px 30px",
}));
</script>

<template>
  <div class="treehole-header">
    <div class="header-content" :style="headerStyle">
      <div class="back-btn" @click="emit('goBack')">
        <el-icon :size="24">
          <ArrowLeft />
        </el-icon>
        <span>返回</span>
      </div>
      <div class="logo">
        <span>🌳 心灵树洞</span>
      </div>
      <div class="placeholder"></div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.treehole-header {
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

.placeholder {
  width: 80px;
}
</style>
