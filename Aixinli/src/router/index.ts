import { createRouter, createWebHistory } from 'vue-router'
import Back from '../components/admin/back.vue'
import Dashboard from '../components/admin/dashboard.vue'
import User from '../components/admin/user.vue'
import UserStatus from '../components/admin/userStatus.vue'
import Login from '../components/client/login.vue'
import Register from '../components/client/register.vue'
import Center from '../components/center.vue'
import Home from '../components/client/home.vue'
import Chat from '../components/client/chat.vue'
import Profile from '../components/client/profile.vue'
import Treehole from '../components/client/treehole.vue'
import PostDetail from '../components/client/treehole/PostDetail.vue'
import Diary from '../components/client/diary.vue'
import MoodDiaryDetail from '../components/client/mood/MoodDiaryDetail.vue'
import Mbti from '../components/client/mbti.vue'
import Screening from '../components/client/screening.vue'
import Error from '../components/404.vue'
import { useAuthStore } from '../stores/auth'

// 路由守卫：B端登录验证
const beforeEnter = (to: any, _from: any, next: any) => {
  const authStore = useAuthStore()
  authStore.initAuth()

  // 检查是否已登录且角色是 admin
  const isAuthenticated = authStore.isAuthenticated && authStore.user?.role === 'admin'
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/')
  } else {
    next()
  }
}

// 路由守卫：C端登录验证
const beforeEnterClient = (to: any, _from: any, next: any) => {
  const authStore = useAuthStore()
  authStore.initAuth()

  if (to.meta.clientAuth && !authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
}

// 路由配置
const routes = [
  // C端登录页
  {
    path: '/',
    component: Login,
    meta: {
      title: 'C端登录'
    }
  },
  {
    path: '/register',
    component: Register,
    meta: {
      title: '注册'
    }
  },

  // C端路由
  {
    path: '/home',
    component: Home,
    meta: {
      title: '首页',
      clientAuth: true
    },
    beforeEnter: beforeEnterClient
  },
  {
    path: '/chat',
    component: Chat,
    meta: {
      title: '对话',
      clientAuth: true
    },
    beforeEnter: beforeEnterClient
  },
  {
    path: '/treehole',
    component: Treehole,
    meta: {
      title: '心灵树洞',
      clientAuth: true
    },
    beforeEnter: beforeEnterClient
  },
  {
    path: '/treehole/post/:id',
    component: PostDetail,
    meta: {
      title: '帖子详情',
      clientAuth: true
    },
    beforeEnter: beforeEnterClient
  },
  {
    path: '/diary',
    component: Diary,
    meta: {
      title: '心情日记',
      clientAuth: true
    },
    beforeEnter: beforeEnterClient
  },
  {
    path: '/diary/:id',
    component: MoodDiaryDetail,
    meta: {
      title: '日记详情',
      clientAuth: true
    },
    beforeEnter: beforeEnterClient
  },
  {
    path: '/profile',
    component: Profile,
    meta: {
      title: '个人中心',
      clientAuth: true
    },
    beforeEnter: beforeEnterClient
  },
  {
    path: '/mbti',
    component: Mbti,
    meta: {
      title: 'MBTI人格测试',
      clientAuth: true
    },
    beforeEnter: beforeEnterClient
  },
  {
    path: '/phq9',
    component: Screening,
    meta: {
      title: 'PHQ-9 抑郁筛查',
      clientAuth: true
    },
    beforeEnter: beforeEnterClient
  },
  {
    path: '/gad7',
    component: Screening,
    meta: {
      title: 'GAD-7 焦虑筛查',
      clientAuth: true
    },
    beforeEnter: beforeEnterClient
  },
  {
    path: '/relax',
    component: () => import('../components/client/relax.vue'),
    meta: {
      title: '白噪音放松',
      clientAuth: true
    },
    beforeEnter: beforeEnterClient
  },

  // B端路由
  {
    path: '/back',
    component: Back,
    meta: {
      title: '后台管理',
      requiresAuth: true
    },
    beforeEnter,
    children:[
      {
        path: '',
        redirect: '/back/dashboard'
      },
      {
        path: 'dashboard',
        component: Dashboard,
        meta: {
          title: '数据分析'
        }
      },
      {
        path: 'user',
        component: User,
        meta: {
          title: '用户管理'
        }
      },
      {
        path: 'user-status',
        component: UserStatus,
        meta: {
          title: '用户状态'
        }
      },
      {
        path: 'center',
        component: Center,
        meta: {
          title: '控制中心'
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    component: Error,
    meta: {
      title: '404 - 页面不存在'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router