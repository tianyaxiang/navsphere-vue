<template>
  <div>
    <!-- 认证中状态 -->
    <div v-if="isLoading" class="min-h-screen flex items-center justify-center bg-background">
      <div class="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <h2 class="text-xl font-semibold text-foreground">
          正在验证身份...
        </h2>
        <p class="text-muted-foreground">
          请稍候，我们正在检查您的登录状态
        </p>
      </div>
    </div>

    <!-- 未认证状态 -->
    <div v-else-if="!isAuthenticated" class="min-h-screen flex items-center justify-center bg-background">
      <div class="max-w-md w-full space-y-8 p-8">
        <div class="text-center">
          <div class="text-destructive mb-4">
            <ShieldXIcon class="h-12 w-12 mx-auto" />
          </div>
          <h2 class="text-2xl font-bold text-foreground">
            需要登录
          </h2>
          <p class="mt-2 text-muted-foreground">
            {{ message || '您需要登录才能访问此页面' }}
          </p>
        </div>

        <div v-if="error" class="mb-4">
          <Alert variant="destructive" :title="error" closable @close="clearError" />
        </div>

        <div class="space-y-4">
          <Button @click="handleLogin" :disabled="authStore.isLoading" class="w-full" size="lg">
            <LoadingSpinner v-if="authStore.isLoading" size="sm" class="mr-2" />
            <GithubIcon v-else class="mr-2 h-5 w-5" />
            {{ authStore.isLoading ? '正在跳转...' : '使用 GitHub 登录' }}
          </Button>

          <Button variant="outline" @click="goBack" class="w-full">
            返回上一页
          </Button>
        </div>

        <div class="mt-8 pt-6 border-t border-border">
          <div class="text-sm text-muted-foreground space-y-2">
            <p class="font-medium">登录说明：</p>
            <ul class="text-left space-y-1 list-disc list-inside">
              <li>需要 GitHub 账户进行身份验证</li>
              <li>仅授权访问指定的数据仓库</li>
              <li>登录后可管理导航数据和站点配置</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 权限不足状态 -->
    <div v-else-if="requirePermission && !hasRequiredPermission" class="min-h-screen flex items-center justify-center bg-background">
      <div class="max-w-md w-full space-y-8 p-8">
        <div class="text-center">
          <div class="text-warning mb-4">
            <ShieldAlertIcon class="h-12 w-12 mx-auto" />
          </div>
          <h2 class="text-2xl font-bold text-foreground">
            权限不足
          </h2>
          <p class="mt-2 text-muted-foreground">
            您没有访问此页面的权限
          </p>
        </div>

        <div class="space-y-4">
          <Button @click="goBack" class="w-full">
            返回上一页
          </Button>
          
          <Button variant="outline" @click="goHome" class="w-full">
            返回首页
          </Button>
        </div>

        <div class="mt-8 pt-6 border-t border-border">
          <div class="text-sm text-muted-foreground">
            <p class="font-medium">权限说明：</p>
            <p class="mt-1">
              此页面需要特定权限才能访问。如果您认为这是错误，请联系管理员。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 已认证且有权限，显示内容 -->
    <slot v-else />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ShieldXIcon, ShieldAlertIcon, GithubIcon } from 'lucide-vue-next'
import { Button, LoadingSpinner, Alert } from '@/components/ui'
import { useAuthStore } from '@/stores/auth'

interface Props {
  /**
   * 是否需要认证（默认为 true）
   */
  requireAuth?: boolean
  /**
   * 需要的权限
   */
  requirePermission?: string
  /**
   * 自定义未认证时的提示消息
   */
  message?: string
  /**
   * 认证失败时是否自动重定向到登录页
   */
  autoRedirect?: boolean
  /**
   * 重定向延迟时间（毫秒）
   */
  redirectDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  requireAuth: true,
  autoRedirect: false,
  redirectDelay: 3000,
})

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isLoading = ref(true)
const error = ref<string | null>(null)

// 计算属性
const isAuthenticated = computed(() => authStore.isAuthenticated)
const hasRequiredPermission = computed(() => {
  if (!props.requirePermission) return true
  return authStore.hasPermission(props.requirePermission)
})

// 初始化认证状态
const initializeAuth = async () => {
  try {
    isLoading.value = true
    error.value = null

    if (!props.requireAuth) {
      isLoading.value = false
      return
    }

    // 如果已经认证，直接返回
    if (authStore.isAuthenticated) {
      isLoading.value = false
      return
    }

    // 尝试初始化认证状态
    const success = await authStore.initializeAuth()
    
    if (!success && props.autoRedirect) {
      // 自动重定向到登录页
      setTimeout(() => {
        router.push({
          path: '/login',
          query: { redirect: route.fullPath }
        })
      }, props.redirectDelay)
    }
  } catch (err: any) {
    console.error('Auth guard initialization failed:', err)
    error.value = err.message || '认证初始化失败'
  } finally {
    isLoading.value = false
  }
}

// 处理登录
const handleLogin = async () => {
  try {
    await authStore.login()
  } catch (err: any) {
    error.value = err.message || '登录失败'
  }
}

// 清除错误
const clearError = () => {
  error.value = null
}

// 返回上一页
const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

// 返回首页
const goHome = () => {
  router.push('/')
}

// 监听认证状态变化
watch(
  () => authStore.isAuthenticated,
  (newValue) => {
    if (newValue && isLoading.value) {
      isLoading.value = false
    }
  }
)

// 监听错误状态变化
watch(
  () => authStore.error,
  (newError) => {
    if (newError) {
      error.value = newError
    }
  }
)

onMounted(() => {
  initializeAuth()
})

// 暴露方法给父组件
defineExpose({
  initializeAuth,
  clearError,
})
</script>