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
const useMockData = ref(false); // 是否使用模拟数据

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
    "张三",
    "李四",
    "王五",
    "赵六",
    "孙七",
    "周八",
    "吴九",
    "郑十",
    "陈十一",
    "林十二",
    "小明",
    "小红",
    "小刚",
    "小丽",
    "小华",
    "小美",
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

    // 如果是404错误，说明后端接口未实现，使用模拟数据
    if (error.response?.status === 404 || error.code === "ERR_NETWORK") {
      ElMessage.warning("B端管理接口尚未实现，使用模拟数据展示");
      useMockData.value = true;
      const mockUsers = generateMockData();

      // 客户端过滤
      let filteredUsers = mockUsers;
      if (keyword) {
        filteredUsers = mockUsers.filter(
          (user) =>
            user.username.toLowerCase().includes(keyword.toLowerCase()) ||
            user.email.toLowerCase().includes(keyword.toLowerCase())
        );
      }

      // 客户端分页
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

  // 同时获取MBTI数据
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
  return "success";
};

// 删除用户
const handleDeleteUser = async (user: UserData) => {
  if (useMockData.value) {
    ElMessage.info("模拟数据模式下不支持删除操作");
    return;
  }

  // 检查是否是当前登录用户
  if (currentUser.value && user.id === currentUser.value.id) {
    ElMessage.warning("不能删除自己的账号");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.username}" 吗？此操作不可恢复！`,
      "删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
        draggable: true,
      }
    );

    const response = await deleteUser(user.id);

    if (response.success) {
      ElMessage.success("用户删除成功");
      // 重新加载用户列表
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

  // 检查是否是当前登录用户
  if (currentUser.value && user.id === currentUser.value.id) {
    ElMessage.warning("不能修改自己的身份");
    return;
  }

  // 检查角色是否改变
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
      // 更新本地数据
      user.role = newRole;
    } else {
      ElMessage.error(response.message || "修改用户身份失败");
    }
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("修改用户身份失败:", error);
      ElMessage.error(error.response?.data?.message || "修改用户身份失败");
      // 恢复原来的角色
      await fetchUserList(currentPage.value, searchKeyword.value);
    } else {
      // 取消后恢复原来的选择
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

// 页面加载时获取数据
onMounted(() => {
  initCurrentUser();
  fetchUserList();
});
</script>

<template>
  <div class="user-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">
        <el-icon :size="24"><User /></el-icon>
        用户管理
        <el-tag
          v-if="useMockData"
          type="warning"
          size="small"
          style="margin-left: 12px"
        >
          模拟数据
        </el-tag>
      </h2>
      <div class="page-stats">
        <div class="stat-item">
          <div class="stat-value">{{ total }}</div>
          <div class="stat-label">总用户数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ totalChatCount }}</div>
          <div class="stat-label">总对话次数</div>
        </div>
      </div>
    </div>

    <!-- 搜索和操作栏 -->
    <div class="toolbar">
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索用户名或邮箱"
          clearable
          size="large"
          style="width: 300px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button
          type="primary"
          size="large"
          :icon="Search"
          @click="handleSearch"
        >
          搜索
        </el-button>
        <el-button size="large" :icon="Refresh" @click="handleRefresh">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 用户表格 -->
    <div class="table-container">
      <el-table
        :data="userList"
        v-loading="loading"
        stripe
        border
        :default-sort="{ prop: 'id', order: 'descending' }"
        :header-cell-style="{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#ffffff',
          fontWeight: 600,
        }"
        style="width: 100%; table-layout: auto"
        height="calc(100vh - 400px)"
      >
        <el-table-column
          type="index"
          label="序号"
          width="80"
          align="center"
          :index="getIndex"
        >
          <template #default="{ $index }">
            <span class="index-cell">{{ getIndex($index) }}</span>
          </template>
        </el-table-column>

        <el-table-column
          prop="username"
          label="用户名"
          min-width="140"
          align="center"
        />

        <el-table-column
          prop="email"
          label="邮箱"
          min-width="200"
          align="center"
          show-overflow-tooltip
        />

        <el-table-column prop="role" label="身份" width="140" align="center">
          <template #default="{ row }">
            <el-select
              v-model="row.role"
              size="small"
              :disabled="
                useMockData || (currentUser && row.id === currentUser.id)
              "
              @change="handleRoleChange(row, $event)"
            >
              <el-option label="普通用户" value="user" />
              <el-option label="管理员" value="admin" />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column prop="mbti" label="MBTI" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="mbtiMap[row.id]"
              type="primary"
              size="large"
              effect="dark"
            >
              {{ mbtiMap[row.id] }}
            </el-tag>
            <span v-else style="color: #c0c4cc; font-size: 13px">未测试</span>
          </template>
        </el-table-column>

        <el-table-column
          prop="chat_count"
          label="对话次数"
          width="120"
          align="center"
          sortable
        >
          <template #default="{ row }">
            <el-tag
              :type="getChatCountType(row.chat_count)"
              size="large"
              effect="plain"
            >
              {{ row.chat_count }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          prop="last_login_time"
          label="最近登录时间"
          min-width="180"
          align="center"
          sortable
        >
          <template #default="{ row }">
            <div class="time-cell">
              <el-icon><Clock /></el-icon>
              <span>{{ formatDate(row.last_login_time) }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="created_at"
          label="注册时间"
          min-width="180"
          align="center"
          sortable
        >
          <template #default="{ row }">
            <div class="time-cell">
              <el-icon><Calendar /></el-icon>
              <span>{{ formatDate(row.created_at) }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              :disabled="
                useMockData || (currentUser && row.id === currentUser.id)
              "
              @click="handleDeleteUser(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.user-management {
  width: 100%;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid #e5e7eb;

  .page-title {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.page-stats {
  display: flex;
  gap: 32px;

  .stat-item {
    text-align: center;

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #667eea;
      line-height: 1;
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 14px;
      color: #64748b;
    }
  }
}

.toolbar {
  margin-bottom: 24px;

  .search-bar {
    display: flex;
    gap: 12px;
    align-items: center;
  }
}

.table-container {
  margin-bottom: 24px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  width: 100%;

  :deep(.el-table) {
    border-radius: 12px;
    width: 100%;

    &.el-table--striped .el-table__body tr.el-table__row--striped td {
      background-color: #f8fafc;
    }

    .el-table__body tr:hover > td {
      background-color: #f1f5f9 !important;
    }

    .el-table__body-wrapper {
      overflow-x: auto;
      overflow-y: auto;
    }
  }

  :deep(.el-table__header-wrapper) {
    overflow-x: auto;
  }

  :deep(.el-table__header) {
    th {
      padding: 16px 0;
      font-size: 15px;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }
  }

  :deep(.el-table__body) {
    td {
      padding: 14px 0;
      font-size: 14px;
    }
  }

  .index-cell {
    font-weight: 600;
    color: #667eea;
    font-size: 16px;
  }

  .username-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    white-space: nowrap;

    .username-text {
      font-weight: 600;
      color: #1e293b;
    }
  }

  .time-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #64748b;
    font-size: 13px;
    white-space: nowrap;
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;

  :deep(.el-pagination) {
    .el-pager li {
      border-radius: 8px;
      margin: 0 4px;
      transition: all 0.3s ease;

      &:hover {
        background-color: #e0e7ff;
      }

      &.is-active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #ffffff;
      }
    }

    .btn-prev,
    .btn-next {
      border-radius: 8px;
      margin: 0 4px;

      &:hover {
        background-color: #e0e7ff;
      }
    }
  }
}
</style>
