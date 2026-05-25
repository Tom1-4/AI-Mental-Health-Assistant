<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  Lock,
  User as UserIcon,
  Message,
  Sunny,
  Moon,
  Picture,
  ArrowLeft,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { useThemeStore } from "../../stores/theme";
import { useAuthStore } from "../../stores/auth";
import { storeToRefs } from "pinia";
import { uploadSingleImage } from "../../services/upload";

const defaultAvatar = "/default.jpeg";

const router = useRouter();
const themeStore = useThemeStore();
const authStore = useAuthStore();
const { isDark } = storeToRefs(themeStore);
const { user } = storeToRefs(authStore);

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

// 初始化
onMounted(() => {
  if (user.value) {
    editForm.username = user.value.username;
    editForm.email = user.value.email;
    avatarUrl.value = user.value.avatar || defaultAvatar;
  }
});

const containerStyle = computed(() => ({
  background: !isDark.value
    ? "linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 50%, #B0E0E6 100%)"
    : "linear-gradient(to bottom, #0f0c29 0%, #302b63 50%, #24243e 100%)",
}));

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

const toggleTheme = () => {
  themeStore.toggleTheme();
};

const goBack = () => {
  router.push("/home");
};
</script>

<template>
  <div class="profile-container" :style="containerStyle">
    <!-- 太阳 -->
    <div v-if="!isDark" class="celestial-body sun"></div>

    <!-- 月亮 -->
    <div v-if="isDark" class="celestial-body moon"></div>

    <!-- 云朵 (白天显示) -->
    <div v-if="!isDark" class="clouds">
      <div class="cloud cloud-1"></div>
      <div class="cloud cloud-2"></div>
      <div class="cloud cloud-3"></div>
    </div>

    <!-- 星星 (夜间显示) -->
    <div v-if="isDark" class="stars">
      <div class="star star-1"></div>
      <div class="star star-2"></div>
      <div class="star star-3"></div>
      <div class="star star-4"></div>
      <div class="star star-5"></div>
      <div class="star star-6"></div>
      <div class="star star-7"></div>
      <div class="star star-8"></div>
      <div class="star star-9"></div>
      <div class="star star-10"></div>
      <div class="star star-11"></div>
      <div class="star star-12"></div>
      <div class="star star-13"></div>
      <div class="star star-14"></div>
      <div class="star star-15"></div>
      <div class="star star-16"></div>
      <div class="star star-17"></div>
      <div class="star star-18"></div>
      <div class="star star-19"></div>
      <div class="star star-20"></div>
      <div class="star star-21"></div>
      <div class="star star-22"></div>
      <div class="star star-23"></div>
      <div class="star star-24"></div>
      <div class="star star-25"></div>
      <div class="meteor meteor-1"></div>
      <div class="meteor meteor-2"></div>
      <div class="meteor meteor-3"></div>
      <div class="meteor meteor-4"></div>
      <div class="meteor meteor-5"></div>
      <div class="meteor meteor-6"></div>
      <div class="meteor meteor-7"></div>
      <div class="meteor meteor-8"></div>
      <div class="meteor meteor-9"></div>
      <div class="meteor meteor-10"></div>
    </div>

    <!-- 主题切换按钮 -->
    <div class="theme-toggle" @click="toggleTheme">
      <el-icon :size="24" class="toggle-icon">
        <Sunny v-if="isDark" />
        <Moon v-else />
      </el-icon>
    </div>

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
  </div>
</template>

<style scoped lang="scss">
@use "sass:math";

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

/* 太阳/月亮 */
.celestial-body {
  position: absolute;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  top: 15%;
  right: 10%;
  transition: all 1.5s ease;
}

.sun {
  background: linear-gradient(135deg, #ffd93d 0%, #ff8c00 100%);
  box-shadow: 0 0 60px rgba(255, 217, 61, 0.6), 0 0 100px rgba(255, 140, 0, 0.4);
  animation: sunPulse 4s ease-in-out infinite;
}

.moon {
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
  box-shadow: 0 0 40px rgba(255, 255, 255, 0.3),
    0 0 80px rgba(200, 200, 200, 0.2);
  animation: moonFloat 6s ease-in-out infinite;
}

@keyframes sunPulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 60px rgba(255, 217, 61, 0.6),
      0 0 100px rgba(255, 140, 0, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 80px rgba(255, 217, 61, 0.8),
      0 0 120px rgba(255, 140, 0, 0.5);
  }
}

@keyframes moonFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* 云朵 */
.clouds {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  overflow: hidden;
}

.cloud {
  position: absolute;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: floatCloud 20s ease-in-out infinite;
}

.cloud::before,
.cloud::after {
  content: "";
  position: absolute;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
}

.cloud-1 {
  width: 100px;
  height: 40px;
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.cloud-1::before {
  width: 50px;
  height: 50px;
  top: -25px;
  left: 15px;
}

.cloud-1::after {
  width: 40px;
  height: 40px;
  top: -20px;
  left: 45px;
}

.cloud-2 {
  width: 120px;
  height: 45px;
  top: 35%;
  right: 15%;
  animation-delay: 5s;
}

.cloud-2::before {
  width: 60px;
  height: 60px;
  top: -30px;
  left: 20px;
}

.cloud-2::after {
  width: 45px;
  height: 45px;
  top: -25px;
  left: 55px;
}

.cloud-3 {
  width: 80px;
  height: 35px;
  top: 50%;
  left: 30%;
  animation-delay: 10s;
}

.cloud-3::before {
  width: 40px;
  height: 40px;
  top: -20px;
  left: 10px;
}

.cloud-3::after {
  width: 35px;
  height: 35px;
  top: -18px;
  left: 35px;
}

@keyframes floatCloud {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(20px);
  }
}

/* 星星 */
.stars {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  overflow: hidden;
}

.star {
  position: absolute;
  background: white;
  border-radius: 50%;
  animation: twinkle 3s ease-in-out infinite;
}

.star:nth-child(odd) {
  animation-duration: 2s;
}

.star:nth-child(even) {
  animation-duration: 4s;
}

@for $i from 1 through 25 {
  .star-#{$i} {
    width: math.random(3) + 1px;
    height: math.random(3) + 1px;
    top: math.random(80) + 10%;
    left: math.random(90) + 5%;
    animation-delay: math.random(5) s;
  }
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

/* 流星 */
.meteor {
  position: absolute;
  width: 100px;
  height: 2px;
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 0),
    rgba(255, 255, 255, 0.8)
  );
  animation: meteorFall linear infinite;
  opacity: 0;
}

@for $i from 1 through 10 {
  .meteor-#{$i} {
    top: math.random(40) + 10%;
    left: math.random(100) * 1%;
    animation-delay: math.random(20) * 1s;
    animation-duration: math.random(10) * 1s + 5s;
  }
}

@keyframes meteorFall {
  0% {
    transform: translateX(0) translateY(0) rotate(-45deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  100% {
    transform: translateX(-500px) translateY(500px) rotate(-45deg);
    opacity: 0;
  }
}

/* 主题切换按钮 */
.theme-toggle {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 100;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }

  .toggle-icon {
    color: white;
  }
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
</style>
