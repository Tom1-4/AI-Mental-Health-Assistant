import { createRouter, createWebHistory } from 'vue-router'
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
    component: () => import('../components/client/login.vue'),
    meta: {
      title: 'C端登录'
    }
  },
  {
    path: '/register',
    component: () => import('../components/client/register.vue'),
    meta: {
      title: '注册'
    }
  },

  // C端路由
  {
    path: '/home',
    component: () => import('../components/client/home.vue'),
    meta: {
      title: '首页',
      clientAuth: true
    },
    beforeEnter: beforeEnterClient
  },
  {
    path: '/chat',
    component: () => import('../components/client/chat.vue'),
    meta: {
      title: '对话',
      clientAuth: true
    },
    beforeEnter: beforeEnterClient
  },
  {
    path: '/treehole',
    component: () => import('../components/client/treehole.vue'),
    meta: {
      title: '心灵树洞',
      clientAuth: true
    },
    beforeEnter: beforeEnterClient
  },
  {
    path: '/treehole/post/:id',
    component: () => import('../components/client/treehole/PostDetail.vue'),
    meta: {
      title: '帖子详情',
      clientAuth: true
    },
    beforeEnter: beforeEnterClient
  },
  {
    path: '/diary',
    component: () => import('../components/client/diary.vue'),
    meta: {
      title: '心情日记',
      clientAuth: true
    },
    beforeEnter: beforeEnterClient
  },
  {
    path: '/diary/:id',
    component: () => import('../components/client/mood/MoodDiaryDetail.vue'),
    meta: {
      title: '日记详情',
      clientAuth: true
    },
    beforeEnter: beforeEnterClient
  },
  {
    path: '/profile',
    component: () => import('../components/client/profile.vue'),
    meta: {
      title: '个人中心',
      clientAuth: true
    },
    beforeEnter: beforeEnterClient
  },
  {
    path: '/mbti',
    component: () => import('../components/client/mbti.vue'),
    meta: {
      title: 'MBTI人格测试',
      clientAuth: true
    },
    beforeEnter: beforeEnterClient
  },
  {
    path: '/phq9',
    component: () => import('../components/client/screening.vue'),
    meta: {
      title: 'PHQ-9 抑郁筛查',
      clientAuth: true
    },
    beforeEnter: beforeEnterClient
  },
  {
    path: '/gad7',
    component: () => import('../components/client/screening.vue'),
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
    component: () => import('../components/admin/back.vue'),
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
        component: () => import('../components/admin/dashboard.vue'),
        meta: {
          title: '数据分析'
        }
      },
      {
        path: 'user',
        component: () => import('../components/admin/user.vue'),
        meta: {
          title: '用户管理'
        }
      },
      {
        path: 'user-status',
        component: () => import('../components/admin/userStatus.vue'),
        meta: {
          title: '用户状态'
        }
      },
      {
        path: 'center',
        component: () => import('../components/center.vue'),
        meta: {
          title: '控制中心'
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('../components/404.vue'),
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