<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft, Edit, Delete, Calendar } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getDiaryById,
  deleteDiary,
  type MoodDiary,
  getMoodInfo,
} from "../../../services/moodDiary";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const diary = ref<MoodDiary | null>(null);

const goBack = () => {
  router.push("/diary");
};

const handleEdit = () => {
  if (diary.value) {
    router.push({
      path: "/diary",
      query: {
        action: "edit",
        id: diary.value.id,
      },
    });
  }
};

const handleDelete = async () => {
  if (!diary.value) return;

  try {
    await ElMessageBox.confirm("确定要删除这篇日记吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    loading.value = true;
    await deleteDiary(diary.value.id);
    ElMessage.success("日记删除成功");
    router.push("/diary");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败，请稍后重试");
    }
  } finally {
    loading.value = false;
  }
};

const loadDiary = async () => {
  const id = Number(route.params.id);
  if (!id) {
    ElMessage.error("无效的日记ID");
    router.push("/diary");
    return;
  }

  loading.value = true;
  try {
    const response = await getDiaryById(id);
    if (response.success) {
      diary.value = response.data.diary;
      console.log("日记详情数据:", diary.value);
      console.log("图片字段:", diary.value?.images);
    }
  } catch (error) {
    ElMessage.error("加载日记失败");
    router.push("/diary");
  } finally {
    loading.value = false;
  }
};

// 获取完整的图片URL
const getImageUrl = (url: string): string => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `http://localhost:3000${url}`;
};

const openImage = (url: string) => {
  window.open(url, "_blank");
};

onMounted(() => {
  loadDiary();
});
</script>

<template>
  <div class="diary-detail-container">
    <div class="header">
      <div class="header-content">
        <div class="back-btn" @click="goBack">
          <el-icon :size="24">
            <ArrowLeft />
          </el-icon>
          <span>返回</span>
        </div>
        <div class="actions" v-if="diary">
          <el-button class="action-btn edit-btn" @click="handleEdit">
            <el-icon><Edit /></el-icon>
            <span>编辑</span>
          </el-button>
          <el-button class="action-btn delete-btn" @click="handleDelete">
            <el-icon><Delete /></el-icon>
            <span>删除</span>
          </el-button>
        </div>
      </div>
    </div>

    <div class="main-content" v-loading="loading">
      <div v-if="diary" class="diary-detail">
        <div class="diary-header">
          <h1 v-if="diary.title" class="diary-title">{{ diary.title }}</h1>
          <div class="diary-meta">
            <div class="meta-item">
              <el-icon><Calendar /></el-icon>
              <span>{{ diary.diary_date }}</span>
            </div>
            <div class="meta-item">
              <span class="mood-icon">{{ getMoodInfo(diary.mood).emoji }}</span>
              <span
                class="mood-label"
                :style="{ color: getMoodInfo(diary.mood).color }"
              >
                {{ getMoodInfo(diary.mood).label }}
              </span>
            </div>
          </div>
        </div>

        <div class="diary-content">
          <p>{{ diary.content }}</p>
        </div>

        <div v-if="diary.images && diary.images.trim()" class="diary-images">
          <h3>图片</h3>
          <div class="image-grid">
            <div
              v-for="(img, index) in diary.images.split(',')"
              :key="index"
              class="image-item"
              @click="openImage(getImageUrl(img.trim()))"
            >
              <img :src="getImageUrl(img.trim())" alt="日记图片" />
            </div>
          </div>
        </div>

        <div class="diary-footer">
          <div class="time-info">
            <span
              >创建日期:
              {{ new Date(diary.created_at).toLocaleDateString("zh-CN") }}</span
            >
            <span v-if="diary.updated_at !== diary.created_at">
              | 更新日期:
              {{ new Date(diary.updated_at).toLocaleDateString("zh-CN") }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.diary-detail-container {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f5f7fa 0%, #e8eef5 100%);
}

/* 头部样式 */
.header {
  padding: 20px 30px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 900px;
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
  color: #333;
  font-weight: 600;
  transition: all 0.3s;
}

.back-btn:hover {
  color: #409eff;
  transform: translateX(-3px);
}

.actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
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

/* 主内容区 */
.main-content {
  max-width: 900px;
  margin: 30px auto;
  padding: 0 20px;
}

.diary-detail {
  background: white;
  border-radius: 15px;
  padding: 40px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.diary-header {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.diary-title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 0 0 20px 0;
  line-height: 1.4;
}

.diary-meta {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
}

.mood-icon {
  font-size: 20px;
}

.mood-label {
  font-weight: 600;
  font-size: 15px;
}

.diary-content {
  margin-bottom: 30px;
  font-size: 16px;
  line-height: 1.8;
  color: #333;
}

.diary-content p {
  margin: 0;
  white-space: pre-wrap;
}

.diary-images {
  margin-bottom: 30px;
}

.diary-images h3 {
  font-size: 18px;
  color: #333;
  margin: 0 0 20px 0;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.image-item {
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s;
  border: 2px solid #eee;
}

.image-item:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.diary-footer {
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.time-info {
  color: #999;
  font-size: 13px;
}
</style>
