<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  Lock,
  User as UserIcon,
  Message,
  Picture,
  ArrowLeft,
  Download,
  WarningFilled,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { useAuthStore } from "../../stores/auth";
import { storeToRefs } from "pinia";
import { uploadSingleImage } from "../../services/upload";
import { getMyMbtiResult, type MbtiResult } from "../../services/mbti";
import { useThemeStyle } from "../../composables/useThemeStyle";

const defaultAvatar = "/default.jpeg";

const router = useRouter();
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const { isDark, containerStyle, toggleTheme } = useThemeStyle();

const editForm = reactive({
  username: "",
  email: "",
});

const avatarUrl = ref<string>("");
const uploadingAvatar = ref(false);
const showPasswordDialog = ref(false);
const passwordForm = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});
const loading = ref(false);
const mbtiResult = ref<MbtiResult | null>(null);

// 初始化
onMounted(() => {
  if (user.value) {
    editForm.username = user.value.username;
    editForm.email = user.value.email;
    avatarUrl.value = user.value.avatar || defaultAvatar;
  }
  fetchMbtiData();
});

// 压缩图片
const compressImage = (file: File, quality: number = 0.7): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // 保持宽高比，限制最大尺寸为800px
        const maxWidth = 800;
        const maxHeight = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("图片压缩失败"));
              }
            },
            file.type,
            quality
          );
        } else {
          reject(new Error("无法获取canvas上下文"));
        }
      };
      img.onerror = () => reject(new Error("图片加载失败"));
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
  });
};

// 处理头像上传
const handleAvatarUpload = async (file: File) => {
  const isImage = file.type.startsWith("image/");
  if (!isImage) {
    ElMessage.error("只能上传图片文件");
    return false;
  }

  const fileSizeMB = file.size / 1024 / 1024;

  // 文件大小处理
  if (fileSizeMB > 3) {
    ElMessage.error("图片大小不能超过3MB");
    return false;
  }

  uploadingAvatar.value = true;
  try {
    let uploadFile = file;

    // 1MB到3MB之间的图片需要压缩
    if (fileSizeMB >= 1) {
      ElMessage.info("图片较大，正在压缩中...");
      try {
        const compressedBlob = await compressImage(file, 0.6);
        const compressedSizeMB = compressedBlob.size / 1024 / 1024;
        ElMessage.success(
          `压缩完成：${fileSizeMB.toFixed(2)}MB → ${compressedSizeMB.toFixed(
            2
          )}MB`
        );
        uploadFile = new File([compressedBlob], file.name, {
          type: file.type,
          lastModified: Date.now(),
        });
      } catch (compressError) {
        console.error("压缩失败:", compressError);
        ElMessage.warning("图片压缩失败，尝试上传原图");
        // 压缩失败仍使用原图，但如果原图超过3MB则报错
        if (fileSizeMB > 3) {
          ElMessage.error("图片大小超过3MB，且压缩失败，请选择较小的图片");
          uploadingAvatar.value = false;
          return false;
        }
      }
    }

    const url = await uploadSingleImage(uploadFile);
    avatarUrl.value = url;
    ElMessage.success("头像上传成功");
    await updateAvatar(url);
  } catch (error) {
    ElMessage.error("头像上传失败");
    console.error("上传错误:", error);
  } finally {
    uploadingAvatar.value = false;
  }

  return false;
};

// 更新头像
const updateAvatar = async (avatar: string) => {
  try {
    const response = await fetch("http://localhost:3000/api/users/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authStore.token}`,
      },
      body: JSON.stringify({ avatar }),
    });

    const data = await response.json();

    if (data.success) {
      ElMessage.success("头像更新成功");
      if (user.value) {
        user.value.avatar = avatar;
        localStorage.setItem("user", JSON.stringify(user.value));
      }
    } else {
      ElMessage.error(data.message || "头像更新失败");
    }
  } catch (error) {
    ElMessage.error("头像更新失败");
    console.error("更新错误:", error);
  }
};

// 更新个人信息
const handleUpdateProfile = async () => {
  if (!editForm.username || !editForm.email) {
    ElMessage.warning("请填写所有字段");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(editForm.email)) {
    ElMessage.error("请输入有效的邮箱地址");
    return;
  }

  loading.value = true;
  try {
    const response = await fetch("http://localhost:3000/api/users/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authStore.token}`,
      },
      body: JSON.stringify({
        username: editForm.username,
        email: editForm.email,
      }),
    });

    const data = await response.json();

    if (data.success) {
      ElMessage.success("个人信息更新成功");
      if (user.value) {
        user.value.username = editForm.username;
        user.value.email = editForm.email;
        localStorage.setItem("user", JSON.stringify(user.value));
      }
    } else {
      ElMessage.error(data.message || "更新失败");
    }
  } catch (error) {
    ElMessage.error("更新失败");
  } finally {
    loading.value = false;
  }
};

// 重置表单
const handleReset = () => {
  if (user.value) {
    editForm.username = user.value.username;
    editForm.email = user.value.email;
    avatarUrl.value = user.value.avatar || defaultAvatar;
  }
  ElMessage.info("已重置为原信息");
};

// 打开修改密码对话框
const openPasswordDialog = () => {
  passwordForm.oldPassword = "";
  passwordForm.newPassword = "";
  passwordForm.confirmPassword = "";
  showPasswordDialog.value = true;
};

// 修改密码
const handleChangePassword = async () => {
  if (
    !passwordForm.oldPassword ||
    !passwordForm.newPassword ||
    !passwordForm.confirmPassword
  ) {
    ElMessage.warning("请填写所有字段");
    return;
  }

  if (passwordForm.newPassword.length < 6) {
    ElMessage.error("新密码长度不能少于6位");
    return;
  }

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error("两次输入的新密码不一致");
    return;
  }

  if (passwordForm.oldPassword === passwordForm.newPassword) {
    ElMessage.error("新密码不能与原密码相同");
    return;
  }

  loading.value = true;
  try {
    // 调用 store 中的修改密码方法
    const result = await authStore.changePassword(
      passwordForm.oldPassword,
      passwordForm.newPassword
    );

    if (result.success) {
      ElMessage.success("密码修改成功，请重新登录");
      showPasswordDialog.value = false;
      // 清空表单
      passwordForm.oldPassword = "";
      passwordForm.newPassword = "";
      passwordForm.confirmPassword = "";
      // 退出登录并跳转到登录页
      await authStore.logout();
      router.push("/");
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    ElMessage.error("密码修改失败");
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push("/home");
};

const goToMbti = () => {
  router.push("/mbti");
};

const goToScreening = (type: string) => {
  router.push(`/${type}`);
};

// 数据导出
const exportingData = ref(false);
const handleExportData = async () => {
  exportingData.value = true;
  try {
    const token = authStore.token;
    const response = await fetch("http://localhost:3000/api/users/export", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("导出失败");
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mental-health-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    ElMessage.success("数据导出成功");
  } catch (error) {
    ElMessage.error("数据导出失败");
  } finally {
    exportingData.value = false;
  }
};

// 账号注销
const showDeactivateDialog = ref(false);
const deactivating = ref(false);
const deactivateForm = reactive({
  password: "",
  reason: "",
});

const handleDeactivate = async () => {
  if (!deactivateForm.password) {
    ElMessage.warning("请输入密码");
    return;
  }
  deactivating.value = true;
  try {
    const token = authStore.token;
    const response = await fetch(
      "http://localhost:3000/api/users/deactivate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: deactivateForm.password,
          reason: deactivateForm.reason || undefined,
        }),
      }
    );
    const data = await response.json();
    if (data.success) {
      ElMessage.success(data.message);
      showDeactivateDialog.value = false;
      await authStore.logout();
      router.push("/");
    } else {
      ElMessage.error(data.message || "注销失败");
    }
  } catch (error) {
    ElMessage.error("注销失败，请稍后重试");
  } finally {
    deactivating.value = false;
  }
};

// 加载MBTI数据
const fetchMbtiData = async () => {
  try {
    const res = await getMyMbtiResult();
    if (res.success && res.data) {
      mbtiResult.value = res.data;
    }
  } catch {
    // 静默处理
  }
};
</script>

<template>
  <div class="profile-container" :style="containerStyle">
    <!-- 天空装饰 + 主题切换 -->
    <ThemeDecorations :isDark="isDark" @toggle="toggleTheme" />

    <div class="profile-box">
      <!-- 返回按钮 -->
      <div class="back-button" @click="goBack">
        <el-icon :size="20"><ArrowLeft /></el-icon>
        <span>返回</span>
      </div>

      <div class="profile-header">
        <h1 class="profile-title">个人中心</h1>
        <p class="profile-subtitle">管理您的个人信息和账号设置</p>
      </div>

      <!-- 头像上传区域 -->
      <div class="avatar-section">
        <el-upload
          class="avatar-uploader"
          :show-file-list="false"
          :before-upload="handleAvatarUpload"
          accept="image/*"
        >
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            class="avatar-image"
            alt="头像"
          />
          <div v-else class="avatar-placeholder">
            <el-icon :size="32"><Picture /></el-icon>
            <span>上传头像</span>
          </div>
        </el-upload>
        <el-button
          v-if="avatarUrl !== defaultAvatar"
          type="info"
          size="small"
          @click="
            avatarUrl = defaultAvatar;
            updateAvatar(defaultAvatar);
          "
          class="reset-avatar-btn"
        >
          恢复默认
        </el-button>
      </div>

      <!-- 个人信息表单 -->
      <div class="info-section">
        <h2 class="section-title">基本信息</h2>
        <el-form class="profile-form" label-position="top">
          <el-form-item label="用户名">
            <el-input
              v-model="editForm.username"
              placeholder="请输入用户名"
              size="large"
              clearable
            >
              <template #prefix>
                <el-icon><UserIcon /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="邮箱">
            <el-input
              v-model="editForm.email"
              placeholder="请输入邮箱"
              size="large"
              clearable
            >
              <template #prefix>
                <el-icon><Message /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              @click="handleUpdateProfile"
              class="save-button"
            >
              保存修改
            </el-button>
            <el-button size="large" @click="handleReset" class="reset-button">
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 账号安全 -->
      <div class="security-section">
        <h2 class="section-title">账号安全</h2>
        <el-button
          type="warning"
          size="large"
          @click="openPasswordDialog"
          class="password-button"
        >
          <el-icon class="mr-2"><Lock /></el-icon>
          修改密码
        </el-button>
      </div>

      <!-- 心理测评入口 -->
      <div class="screening-section">
        <h2 class="section-title">心理测评</h2>
        <div class="screening-cards">
          <div class="screening-card" @click="goToScreening('phq9')">
            <div class="screening-card-header">
              <span class="screening-icon">📋</span>
              <h3>PHQ-9 抑郁筛查</h3>
            </div>
            <p>9道题 · 约2分钟</p>
            <el-button size="small" type="primary" round>开始测评</el-button>
          </div>
          <div class="screening-card" @click="goToScreening('gad7')">
            <div class="screening-card-header">
              <span class="screening-icon">🧠</span>
              <h3>GAD-7 焦虑筛查</h3>
            </div>
            <p>7道题 · 约2分钟</p>
            <el-button size="small" type="primary" round>开始测评</el-button>
          </div>
        </div>
      </div>

      <!-- 数据管理 -->
      <div class="data-section">
        <h2 class="section-title">数据管理</h2>
        <el-button
          type="primary"
          size="large"
          @click="handleExportData"
          :loading="exportingData"
          class="export-button"
        >
          <el-icon><Download /></el-icon>
          导出我的数据
        </el-button>
        <p class="export-hint">导出个人资料、对话记录、心情日记、MBTI结果和测评结果</p>
      </div>

      <!-- 危险操作 -->
      <div class="danger-section">
        <h2 class="section-title danger-title">危险操作</h2>
        <div class="danger-card">
          <p class="danger-desc">
            注销账号后，您的数据将保留7天。在此期间重新登录可自动恢复账号。7天后账号将被永久删除，所有数据将无法恢复。
          </p>
          <el-button
            type="danger"
            size="large"
            @click="showDeactivateDialog = true"
            class="deactivate-btn"
          >
            <el-icon><WarningFilled /></el-icon>
            注销账号
          </el-button>
        </div>
      </div>

      <!-- MBTI人格测试结果 -->
      <div class="mbti-section">
        <h2 class="section-title">MBTI 人格测试</h2>
        <div v-if="mbtiResult" class="mbti-result-card">
          <div class="mbti-type-display">
            <span class="mbti-type-code">{{ mbtiResult.type }}</span>
            <span class="mbti-type-name">{{ mbtiResult.typeName }}</span>
          </div>
          <p class="mbti-type-desc">{{ mbtiResult.typeDescription }}</p>
          <div class="mbti-traits">
            <el-tag
              v-for="trait in mbtiResult.typeTraits"
              :key="trait"
              size="small"
              effect="plain"
              class="mbti-trait-tag"
            >
              {{ trait }}
            </el-tag>
          </div>
          <div class="mbti-dimensions-mini">
            <div v-for="(dim, key) in mbtiResult.dimensions" :key="key" class="mbti-dim-mini">
              <span class="dim-mini-label">{{ key }}</span>
              <div class="dim-mini-bar">
                <div
                  class="dim-mini-fill"
                  :style="{ width: dim.percent + '%' }"
                ></div>
              </div>
              <span class="dim-mini-letter">{{ dim.result }}</span>
            </div>
          </div>
          <el-button size="small" type="primary" @click="goToMbti" class="retake-mbti-btn">
            重新测试
          </el-button>
        </div>
        <div v-else class="mbti-empty">
          <p>您还没有完成MBTI人格测试</p>
          <el-button size="small" type="primary" @click="goToMbti">
            去测试
          </el-button>
        </div>
      </div>
    </div>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="showPasswordDialog"
      title="修改密码"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form label-position="top">
        <el-form-item label="当前密码">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            placeholder="请输入当前密码"
            size="large"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="新密码">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码（至少6位）"
            size="large"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="确认新密码">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            size="large"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button
          type="primary"
          :loading="loading"
          @click="handleChangePassword"
          >确定</el-button
        >
      </template>
    </el-dialog>

    <!-- 注销账号对话框 -->
    <el-dialog
      v-model="showDeactivateDialog"
      title="注销账号"
      width="450px"
      :close-on-click-modal="false"
    >
      <div class="deactivate-warning">
        <el-alert type="error" :closable="false" show-icon>
          <template #title>
            此操作不可逆。注销后7天内可重新登录恢复账号，7天后所有数据将被永久删除。
          </template>
        </el-alert>
      </div>
      <el-form label-position="top" class="deactivate-form">
        <el-form-item label="请输入密码确认">
          <el-input
            v-model="deactivateForm.password"
            type="password"
            placeholder="请输入当前密码"
            size="large"
            show-password
          />
        </el-form-item>
        <el-form-item label="注销原因（选填）">
          <el-input
            v-model="deactivateForm.reason"
            type="textarea"
            :rows="2"
            placeholder="帮助我们改进，请告诉我们注销原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDeactivateDialog = false">取消</el-button>
        <el-button
          type="danger"
          :loading="deactivating"
          @click="handleDeactivate"
          :disabled="!deactivateForm.password"
        >
          确认注销
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.profile-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(to bottom, #0f0c29 0%, #302b63 50%, #24243e 100%);
  position: relative;
  overflow: hidden;
  transition: background 1.5s ease-in-out;
  padding: 20px;
}

.profile-box {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 40px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.6s ease-out;
  position: relative;
  z-index: 10;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 返回按钮 */
.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: rgba(102, 126, 234, 1);
  font-size: 14px;
  margin-bottom: 20px;
  transition: all 0.3s ease;

  &:hover {
    color: rgba(102, 126, 234, 0.8);
    transform: translateX(-5px);
  }
}

.profile-header {
  text-align: center;
  margin-bottom: 30px;
}

.profile-title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.profile-subtitle {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.5);
  margin: 0;
}

/* 头像上传区域 */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
}

.avatar-uploader {
  :deep(.el-upload) {
    cursor: pointer;
    position: relative;
    overflow: hidden;
    border-radius: 50%;
    transition: all 0.3s ease;
  }

  :deep(.el-upload:hover) {
    box-shadow: 0 0 20px rgba(102, 126, 234, 0.5);
  }
}

.avatar-image {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(102, 126, 234, 0.3);
  display: block;
}

.avatar-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 2px dashed rgba(102, 126, 234, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(102, 126, 234, 0.6);
  font-size: 12px;
  transition: all 0.3s ease;

  .el-icon {
    margin-bottom: 4px;
  }

  &:hover {
    border-color: rgba(102, 126, 234, 0.8);
    color: rgba(102, 126, 234, 0.8);
  }
}

.reset-avatar-btn {
  margin-top: 12px;
  font-size: 12px;
}

/* 信息区域 */
.info-section,
.security-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(102, 126, 234, 0.2);
}

.profile-form {
  .el-form-item {
    margin-bottom: 20px;
  }

  :deep(.el-input__wrapper) {
    border-radius: 12px;
    padding: 8px 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
    }

    &.is-focus {
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
    }
  }

  :deep(.el-input__inner) {
    color: #333;
  }

  .save-button,
  .reset-button {
    flex: 1;
    border-radius: 12px;
    font-weight: 500;
  }

  .save-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    margin-right: 12px;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }
  }

  .reset-button {
    border: 1px solid rgba(102, 126, 234, 0.3);
    color: rgba(102, 126, 234, 1);

    &:hover {
      background: rgba(102, 126, 234, 0.1);
    }
  }
}

.password-button {
  width: 100%;
  border-radius: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    transform: translateY(-2px);
  }
}

.mr-2 {
  margin-right: 8px;
}

/* 暗色模式 */
:deep(.el-dialog) {
  border-radius: 16px;
}

:deep(.el-dialog__header) {
  padding: 20px 20px 10px;
}

:deep(.el-dialog__body) {
  padding: 20px;
}

:deep(.el-dialog__footer) {
  padding: 10px 20px 20px;
}

/* MBTI结果卡片 */
.mbti-section {
  margin-bottom: 30px;
}

.mbti-result-card {
  background: linear-gradient(135deg, #f0f4ff 0%, #e8ebff 100%);
  border-radius: 16px;
  padding: 24px;
  text-align: center;

  .mbti-type-display {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 12px;

    .mbti-type-code {
      font-size: 32px;
      font-weight: 800;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: 3px;
    }

    .mbti-type-name {
      font-size: 18px;
      font-weight: 600;
      color: #475569;
    }
  }

  .mbti-type-desc {
    font-size: 13px;
    color: #64748b;
    line-height: 1.6;
    margin: 0 0 16px;
  }

  .mbti-traits {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 20px;
    flex-wrap: wrap;

    .mbti-trait-tag {
      border-radius: 12px;
    }
  }

  .mbti-dimensions-mini {
    display: grid;
    gap: 8px;
    margin-bottom: 16px;

    .mbti-dim-mini {
      display: flex;
      align-items: center;
      gap: 8px;

      .dim-mini-label {
        font-size: 12px;
        font-weight: 600;
        color: #94a3b8;
        min-width: 24px;
      }

      .dim-mini-bar {
        flex: 1;
        height: 6px;
        background: #e2e8f0;
        border-radius: 3px;
        overflow: hidden;

        .dim-mini-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          border-radius: 3px;
        }
      }

      .dim-mini-letter {
        font-size: 12px;
        font-weight: 700;
        color: #667eea;
        min-width: 14px;
      }
    }
  }

  .retake-mbti-btn {
    border-radius: 20px;
  }
}

.mbti-empty {
  text-align: center;
  padding: 24px;
  background: #f8fafc;
  border-radius: 16px;
  border: 2px dashed #e2e8f0;

  p {
    color: #94a3b8;
    font-size: 14px;
    margin: 0 0 12px;
  }
}

/* 心理测评入口 */
.screening-section {
  margin-bottom: 30px;

  .screening-cards {
    display: flex;
    gap: 12px;

    .screening-card {
      flex: 1;
      background: #f8fafc;
      border-radius: 16px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid transparent;
      text-align: center;

      &:hover {
        border-color: #6366f1;
        box-shadow: 0 4px 16px rgba(99, 102, 241, 0.1);
        transform: translateY(-2px);
      }

      .screening-card-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-bottom: 4px;

        .screening-icon {
          font-size: 20px;
        }

        h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
        }
      }

      p {
        color: #94a3b8;
        font-size: 12px;
        margin: 4px 0 12px;
      }
    }
  }
}

/* 数据管理 */
.data-section {
  margin-bottom: 30px;

  .export-button {
    width: 100%;
    border-radius: 12px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 8px;

    &:hover {
      transform: translateY(-2px);
    }
  }

  .export-hint {
    font-size: 12px;
    color: #94a3b8;
    text-align: center;
    margin: 0;
  }
}

/* 危险操作 */
.danger-section {
  margin-bottom: 30px;

  .danger-title {
    color: #f56c6c;
    border-bottom-color: rgba(245, 108, 108, 0.2);
  }

  .danger-card {
    background: #fef0f0;
    border: 1px solid #fde2e2;
    border-radius: 12px;
    padding: 20px;

    .danger-desc {
      color: #dc2626;
      font-size: 13px;
      line-height: 1.6;
      margin: 0 0 16px;
    }

    .deactivate-btn {
      width: 100%;
      border-radius: 12px;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
  }
}

.deactivate-warning {
  margin-bottom: 20px;
}
</style>
