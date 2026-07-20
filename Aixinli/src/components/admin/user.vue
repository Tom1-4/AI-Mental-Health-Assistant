<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import {
  Search,
  Refresh,
  User,
  Clock,
  Calendar,
  Delete,
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getUserList,
  deleteUser,
  updateUserRole,
  type UserData,
} from "../../services/adminUser";
import {
  getAllUserMbtiResults,
  type UserMbtiInfo,
} from "../../services/mbti";

const userList = ref<UserData[]>([]);
const loading = ref(false);
const searchKeyword = ref("");
const useMockData = ref(false);

// 分页配置
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const totalPages = ref(0);

// MBTI数据
const mbtiMap = ref<Record<number, string>>({});

// 当前登录用户信息
const currentUser = ref<{ id: number; role: string } | null>(null);

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// 生成模拟数据
const generateMockData = (): UserData[] => {
  const mockData: UserData[] = [];
  const usernames = [
    "张三", "李四", "王五", "赵六", "孙七", "周八",
    "吴九", "郑十", "陈十一", "林十二", "小明", "小红",
    "小刚", "小丽", "小华", "小美",
  ];

  for (let i = 0; i < 20; i++) {
    const now = new Date();
    const registerDaysAgo = Math.floor(Math.random() * 365) + 1;
    const loginDaysAgo = Math.floor(Math.random() * 30);
    const chatCount = Math.floor(Math.random() * 500) + 1;

    const registerTime = new Date(
      now.getTime() - registerDaysAgo * 24 * 60 * 60 * 1000
    );
    const lastLoginTime = new Date(
      now.getTime() - loginDaysAgo * 24 * 60 * 60 * 1000
    );

    mockData.push({
      id: i + 1,
      username:
        usernames[i % usernames.length] +
        (Math.floor(i / usernames.length) > 0 ? i + 1 : ""),
      email: `user${i + 1}@example.com`,
      chat_count: chatCount,
      role: i < 2 ? "admin" : "user",
      last_login_time: lastLoginTime.toISOString(),
      created_at: registerTime.toISOString(),
    });
  }

  return mockData.sort((a, b) => b.id - a.id);
};

// 获取用户列表
const fetchUserList = async (
  page: number = currentPage.value,
  keyword: string = searchKeyword.value
) => {
  loading.value = true;
  try {
    const params: any = { page, pageSize: pageSize.value };
    if (keyword) {
      params.keyword = keyword;
    }

    const response = await getUserList(params);

    if (response.success && response.data) {
      userList.value = response.data.users;
      total.value = response.data.total;
      currentPage.value = response.data.page;
      pageSize.value = response.data.pageSize;
      totalPages.value = response.data.totalPages;
      useMockData.value = false;
    } else {
      throw new Error(response.message || "获取用户列表失败");
    }
  } catch (error: any) {
    console.error("获取用户列表失败:", error);

    if (error.response?.status === 404 || error.code === "ERR_NETWORK") {
      ElMessage.warning("B端管理接口尚未实现，使用模拟数据展示");
      useMockData.value = true;
      const mockUsers = generateMockData();

      let filteredUsers = mockUsers;
      if (keyword) {
        filteredUsers = mockUsers.filter(
          (user) =>
            user.username.toLowerCase().includes(keyword.toLowerCase()) ||
            user.email.toLowerCase().includes(keyword.toLowerCase())
        );
      }

      const start = (page - 1) * pageSize.value;
      const end = start + pageSize.value;
      userList.value = filteredUsers.slice(start, end);
      total.value = filteredUsers.length;
      totalPages.value = Math.ceil(filteredUsers.length / pageSize.value);
    } else {
      ElMessage.error(error.response?.data?.message || "获取用户列表失败");
    }
  } finally {
    loading.value = false;
  }

  fetchMbtiData();
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  fetchUserList(1, searchKeyword.value);
};

// 获取MBTI数据
const fetchMbtiData = async () => {
  try {
    const response = await getAllUserMbtiResults(1, 999);
    if (response.success && response.data) {
      const map: Record<number, string> = {};
      response.data.users.forEach((u: UserMbtiInfo) => {
        map[u.userId] = u.mbtiType;
      });
      mbtiMap.value = map;
    }
  } catch {
    // 静默处理
  }
};

// 刷新
const handleRefresh = () => {
  searchKeyword.value = "";
  currentPage.value = 1;
  fetchUserList();
};

// 分页变化
const handlePageChange = (page: number) => {
  fetchUserList(page, searchKeyword.value);
};

// 页码大小变化
const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  fetchUserList(1, searchKeyword.value);
};

// 表格序号
const getIndex = (index: number) => {
  return (currentPage.value - 1) * pageSize.value + index + 1;
};

const totalChatCount = computed(() =>
  userList.value.reduce((sum, user) => sum + user.chat_count, 0)
);

// 根据对话次数获取标签类型
const getChatCountType = (count: number) => {
  if (count >= 300) return "danger";
  if (count >= 200) return "warning";
  if (count >= 100) return "primary";
  if (count >= 50) return "info";
  return "";
};

// 用户头像颜色
const avatarColors = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];
const getAvatarColor = (username: string) => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

// 获取用户名的首字符
const getInitial = (username: string) => {
  return username?.charAt(0)?.toUpperCase() || 'U';
};

// 删除用户
const handleDeleteUser = async (user: UserData) => {
  if (useMockData.value) {
    ElMessage.info("模拟数据模式下不支持删除操作");
    return;
  }

  if (currentUser.value && user.id === currentUser.value.id) {
    ElMessage.warning("不能删除自己的账号");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.username}" 吗？此操作不可恢复！`,
      "删除确认",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning",
        draggable: true,
      }
    );

    const response = await deleteUser(user.id);

    if (response.success) {
      ElMessage.success("用户删除成功");
      await fetchUserList(currentPage.value, searchKeyword.value);
    } else {
      ElMessage.error(response.message || "删除用户失败");
    }
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("删除用户失败:", error);
      ElMessage.error(error.response?.data?.message || "删除用户失败");
    }
  }
};

// 修改用户身份
const handleUpdateRole = async (user: UserData, newRole: string) => {
  if (useMockData.value) {
    ElMessage.info("模拟数据模式下不支持修改操作");
    return;
  }

  if (currentUser.value && user.id === currentUser.value.id) {
    ElMessage.warning("不能修改自己的身份");
    return;
  }

  if (user.role === newRole) {
    return;
  }

  const roleName = newRole === "admin" ? "管理员" : "普通用户";

  try {
    await ElMessageBox.confirm(
      `确定要将用户 "${user.username}" 的身份修改为 "${roleName}" 吗？`,
      "修改确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "info",
        draggable: true,
      }
    );

    const response = await updateUserRole(user.id, newRole);

    if (response.success) {
      ElMessage.success("用户身份修改成功");
      user.role = newRole;
    } else {
      ElMessage.error(response.message || "修改用户身份失败");
    }
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("修改用户身份失败:", error);
      ElMessage.error(error.response?.data?.message || "修改用户身份失败");
      await fetchUserList(currentPage.value, searchKeyword.value);
    } else {
      await fetchUserList(currentPage.value, searchKeyword.value);
    }
  }
};

const handleRoleChange = (
  user: UserData,
  newRole: string | number | boolean
) => {
  handleUpdateRole(user, String(newRole));
};

// 获取当前用户信息
const initCurrentUser = () => {
  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    try {
      currentUser.value = JSON.parse(savedUser);
    } catch (e) {
      console.error("解析用户信息失败:", e);
    }
  }
};

onMounted(() => {
  initCurrentUser();
  fetchUserList();
});
</script>

<template>
  <div class="user-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <el-icon :size="26"><User /></el-icon>
          用户管理
          <el-tag
            v-if="useMockData"
            type="warning"
            size="small"
            effect="plain"
            class="mock-tag"
          >
            模拟数据
          </el-tag>
        </h2>
        <p class="page-subtitle">管理系统注册用户，查看用户活动与数据</p>
      </div>
      <div class="header-stats">
        <div class="header-stat-item">
          <div class="header-stat-value">{{ total }}</div>
          <div class="header-stat-label">总用户</div>
        </div>
        <div class="header-stat-divider"></div>
        <div class="header-stat-item">
          <div class="header-stat-value">{{ totalChatCount.toLocaleString() }}</div>
          <div class="header-stat-label">总对话</div>
        </div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索用户名或邮箱..."
          clearable
          size="default"
          class="search-input"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
      <div class="toolbar-right">
        <span class="total-hint">共 <strong>{{ total }}</strong> 条记录</span>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-wrapper">
      <el-table
        :data="userList"
        v-loading="loading"
        element-loading-text="加载用户数据..."
        stripe
        :default-sort="{ prop: 'id', order: 'descending' }"
        :header-cell-style="{
          background: '#f8fafc',
          color: '#475569',
          fontWeight: 600,
          fontSize: '13px',
          borderBottom: '2px solid #e2e8f0',
        }"
        :cell-style="{
          paddingTop: '12px',
          paddingBottom: '12px',
        }"
        style="width: 100%"
        height="calc(100vh - 400px)"
      >
        <!-- 序号 -->
        <el-table-column
          type="index"
          label="#"
          width="60"
          align="center"
          :index="getIndex"
        >
          <template #default="{ $index }">
            <span class="index-cell">{{ getIndex($index) }}</span>
          </template>
        </el-table-column>

        <!-- 用户名 -->
        <el-table-column
          prop="username"
          label="用户"
          min-width="180"
        >
          <template #default="{ row }">
            <div class="user-cell">
              <div
                class="user-avatar-sm"
                :style="{ background: getAvatarColor(row.username) }"
              >
                {{ getInitial(row.username) }}
              </div>
              <div class="user-meta">
                <span class="user-name">{{ row.username }}</span>
                <span class="user-email">{{ row.email }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 身份 -->
        <el-table-column prop="role" label="身份" width="110" align="center">
          <template #default="{ row }">
            <el-select
              v-model="row.role"
              size="small"
              :disabled="useMockData || (currentUser && row.id === currentUser.id)"
              @change="handleRoleChange(row, $event)"
              class="role-select"
            >
              <el-option label="普通用户" value="user" />
              <el-option label="管理员" value="admin" />
            </el-select>
          </template>
        </el-table-column>

        <!-- MBTI -->
        <el-table-column prop="mbti" label="MBTI" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="mbtiMap[row.id]"
              type="primary"
              size="small"
              effect="light"
              class="mbti-tag"
            >
              {{ mbtiMap[row.id] }}
            </el-tag>
            <span v-else class="no-mbti">—</span>
          </template>
        </el-table-column>

        <!-- 对话次数 -->
        <el-table-column
          prop="chat_count"
          label="对话次数"
          width="110"
          align="center"
          sortable
        >
          <template #default="{ row }">
            <el-tag
              :type="getChatCountType(row.chat_count)"
              size="small"
              effect="light"
              round
            >
              {{ row.chat_count }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 最近登录 -->
        <el-table-column
          prop="last_login_time"
          label="最近登录"
          min-width="170"
          align="center"
          sortable
        >
          <template #default="{ row }">
            <div class="time-cell">
              <el-icon class="time-icon"><Clock /></el-icon>
              <span>{{ formatDate(row.last_login_time) }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- 注册时间 -->
        <el-table-column
          prop="created_at"
          label="注册时间"
          min-width="170"
          align="center"
          sortable
        >
          <template #default="{ row }">
            <div class="time-cell">
              <el-icon class="time-icon"><Calendar /></el-icon>
              <span>{{ formatDate(row.created_at) }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              text
              :disabled="useMockData || (currentUser && row.id === currentUser.id)"
              @click="handleDeleteUser(row)"
              class="delete-btn"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.user-management {
  width: 100%;
}

/* ==================== 页面头部 ==================== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;

  .header-left {
    .page-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 6px 0;
      font-size: 26px;
      font-weight: 700;
      color: #1e293b;

      .mock-tag {
        font-weight: 500;
        border-radius: 6px;
      }
    }

    .page-subtitle {
      margin: 0 0 0 38px;
      font-size: 14px;
      color: #94a3b8;
    }
  }
}

/* 头部统计 */
.header-stats {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 14px 24px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

  .header-stat-item {
    text-align: center;

    .header-stat-value {
      font-size: 24px;
      font-weight: 800;
      color: #6366f1;
      line-height: 1.2;
      font-variant-numeric: tabular-nums;
    }

    .header-stat-label {
      font-size: 12px;
      color: #94a3b8;
      font-weight: 500;
    }
  }

  .header-stat-divider {
    width: 1px;
    height: 36px;
    background: #e2e8f0;
  }
}

/* ==================== 工具栏 ==================== */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;

  .search-input {
    width: 280px;
  }
}

.toolbar-right {
  .total-hint {
    font-size: 13px;
    color: #94a3b8;

    strong {
      color: #6366f1;
      font-weight: 700;
    }
  }
}

/* ==================== 表格 ==================== */
.table-wrapper {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;

  :deep(.el-table) {
    --el-table-border-color: #f1f5f9;
    border: none;

    // 表头
    .el-table__header {
      th {
        padding: 14px 0;
        font-size: 13px;
        letter-spacing: 0.3px;
        text-transform: uppercase;
        font-size: 12px;
      }
    }

    // 条纹行
    &.el-table--striped .el-table__body tr.el-table__row--striped td {
      background-color: #fafbfc;
    }

    // 行悬浮
    .el-table__body tr:hover > td {
      background-color: #f5f3ff !important;
      transition: background-color 0.15s ease;
    }

    // 单元格
    .el-table__body td {
      font-size: 14px;
      color: #334155;
    }

    // 排序图标
    .caret-wrapper {
      height: 20px;
    }
  }
}

// 序号
.index-cell {
  font-weight: 700;
  color: #6366f1;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

// 用户信息
.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;

  .user-avatar-sm {
    width: 36px;
    height: 36px;
    min-width: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 14px;
    font-weight: 700;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  }

  .user-meta {
    display: flex;
    flex-direction: column;
    min-width: 0;

    .user-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 14px;
      line-height: 1.4;
    }

    .user-email {
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.4;
    }
  }
}

// 身份选择
.role-select {
  :deep(.el-input__wrapper) {
    border-radius: 8px;
    box-shadow: none;
    border: 1px solid #e2e8f0;

    &:hover {
      border-color: #6366f1;
    }
  }
}

// MBTI标签
.mbti-tag {
  font-weight: 700;
  letter-spacing: 0.5px;
  border-radius: 6px;
}

.no-mbti {
  color: #cbd5e1;
  font-size: 14px;
}

// 时间
.time-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 13px;
  white-space: nowrap;

  .time-icon {
    color: #94a3b8;
    font-size: 14px;
  }
}

// 删除按钮
.delete-btn {
  &:hover {
    background: #fef2f2;
  }
}

/* ==================== 分页 ==================== */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px 0;

  :deep(.el-pagination) {
    --el-pagination-bg-color: #f8fafc;
    --el-pagination-button-bg-color: #ffffff;

    .el-pager li {
      border-radius: 8px;
      margin: 0 3px;
      font-weight: 600;
      border: 1px solid #e2e8f0;
      transition: all 0.2s ease;

      &:hover {
        border-color: #6366f1;
        color: #6366f1;
      }

      &.is-active {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        border-color: transparent;
        color: #ffffff;
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
      }
    }

    .btn-prev,
    .btn-next {
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      background: #ffffff;

      &:hover {
        border-color: #6366f1;
        color: #6366f1;
      }
    }
  }
}
</style>
