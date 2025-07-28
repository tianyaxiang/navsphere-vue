import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
  },
  {
    path: '/navigation',
    name: 'Navigation',
    component: () => import('@/views/Navigation.vue'),
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { 
      requiresAuth: true,
      title: '管理后台'
    },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/AdminDashboard.vue'),
        meta: {
          title: '控制台',
          description: '管理后台控制台，查看系统状态和统计信息'
        }
      },
      {
        path: 'navigation',
        name: 'NavigationManager',
        component: () => import('@/views/admin/NavigationManager.vue'),
        meta: {
          title: '导航管理',
          description: '管理导航分类和网站项目'
        }
      },
      {
        path: 'site',
        name: 'SiteSettings',
        component: () => import('@/views/admin/SiteSettings.vue'),
        meta: {
          title: '站点设置',
          description: '配置站点基本信息和外观设置'
        }
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: () => import('@/views/AuthCallback.vue'),
  },
  {
    path: '/auth/demo',
    name: 'AuthDemo',
    component: () => import('@/views/AuthDemo.vue'),
  },
  {
    path: '/data-test',
    name: 'DataTest',
    component: () => import('@/views/DataTest.vue'),
    meta: {
      title: '数据测试',
      description: '测试数据文件的格式和完整性'
    }
  },
  {
    path: '/error-demo',
    name: 'ErrorHandlingDemo',
    component: () => import('@/views/ErrorHandlingDemo.vue'),
    meta: {
      title: '错误处理演示',
      description: '测试错误处理机制和组件'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 需要认证的路由
  if (to.meta.requiresAuth) {
    // 如果没有认证，跳转到登录页
    if (!authStore.isAuthenticated) {
      // 尝试初始化认证状态
      const isAuthenticated = await authStore.initializeAuth()
      
      if (!isAuthenticated) {
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        })
        return
      }
    }
    
    // 检查管理员权限（如果需要）
    if (to.meta.requiresAdmin && !authStore.isRepositoryOwner()) {
      next({
        path: '/admin',
        query: { error: 'insufficient_permissions' }
      })
      return
    }
  }

  // 如果已经认证且访问登录页，跳转到管理后台
  if (to.path === '/login' && authStore.isAuthenticated) {
    const redirect = to.query.redirect as string
    next(redirect || '/admin')
    return
  }

  // 管理后台根路径重定向到控制台
  if (to.path === '/admin' && to.name === 'Admin') {
    next('/admin')
    return
  }

  next()
})

// 全局后置守卫
router.afterEach((to, from) => {
  // 更新页面标题
  const baseTitle = 'NavSphere'
  if (to.meta.title) {
    document.title = `${to.meta.title} - ${baseTitle}`
  } else if (to.path.startsWith('/admin')) {
    document.title = `管理后台 - ${baseTitle}`
  } else {
    document.title = baseTitle
  }
})

export default router