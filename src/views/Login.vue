<template>
  <div class="min-h-screen flex items-center justify-center bg-background">
    <div class="max-w-md w-full space-y-8 p-8">
      <!-- 头部信息 -->
      <div class="text-center">
        <div class="mb-6">
          <img 
            src="/favicon.ico" 
            alt="NavSphere Logo" 
            class="h-12 w-12 mx-auto mb-4"
            @error="handleLogoError"
          />
        </div>
        <h2 class="text-3xl font-bold text-foreground">
          登录到 NavSphere
        </h2>
        <p class="mt-2 text-muted-foreground">
          使用 GitHub 账户登录管理后台
        </p>
      </div>

      <!-- 错误提示 -->
      <div v-if="error || authStore.error" class="mb-4">
        <Alert 
          variant="destructive" 
          :title="error || authStore.error" 
          closable 
          @close="clearError" 
        />
      </div>

      <!-- 重定向提示 -->
      <div v-if="redirectPath" class="mb-4">
        <Alert 
          variant="info" 
          title="登录后将跳转到您之前访问的页面" 
        />
      </div>

      <!-- 登录按钮 -->
      <div class="space-y-4">
        <Button
          @click="handleLogin"
          :disabled="isLoading"
          class="w-full flex items-center justify-center py-3 px-4"
          size="lg"
        >
          <LoadingSpinner v-if="isLoading" size="sm" class="mr-2" />
          <GithubIcon v-else class="mr-2 h-5 w-5" />
          {{ isLoading ? '正在跳转...' : '使用 GitHub 登录' }}
        </Button>

        <div class="text-center">
          <Button variant="link" @click="goHome">
            返回首页
          </Button>
        </div>
      </div>

      <!-- 登录说明 -->
      <div class="mt-8 pt-6 border-t border-border">
        <div class="text-sm text-muted-foreground space-y-2">
          <p class="font-medium">登录说明：</p>
          <ul class="text-left space-y-1 list-disc list-inside">
            <li>需要 GitHub 账户进行身份验证</li>
            <li>仅授权访问指定的数据仓库</li>
            <li>登录后可管理导航数据和站点配置</li>
            <li>您的个人信息将被安全保护</li>
          </ul>
        </div>
      </div>

      <!-- 环境信息（开发模式下显示） -->
      <div v-if="isDev" class="mt-4 pt-4 border-t border-border">
        <div class="text-xs text-muted-foreground">
          <p class="font-medium mb-2">开发信息：</p>
          <div class="space-y-1">
            <p>Client ID: {{ clientId }}</p>
            <p>Redirect URI: {{ redirectUri }}</p>
            <p>Environment: {{ mode }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { GithubIcon } from 'lucide-vue-next'
import { Button, LoadingSpinner, Alert } from '@/components/ui'
import { useAuthStore } from '@/stores/auth'
import { GITHUB_OAUTH_CONFIG } from '@/types/constants'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const error = ref<string | null>(null)
const isLoading = ref(false)

// 计算属性
const redirectPath = computed(() => route.query.redirect as string)
const isDev = computed(() => import.meta.env.DEV)
const mode = computed(() => import.meta.env.MODE)
const clientId = computed(() => GITHUB_OAUTH_CONFIG.CLIENT_ID)
const redirectUri = computed(() => GITHUB_OAUTH_CONFIG.REDIRECT_URI)

onMounted(async () => {
  try {
    isLoading.value = true
    
    // 如果已经登录，直接跳转
    if (authStore.isAuthenticated) {
      handleSuccessfulAuth()
      return
    }

    // 初始化认证状态
    const isAuthenticated = await authStore.initializeAuth()
    if (isAuthenticated) {
      handleSuccessfulAuth()
    }
  } catch (err: any) {
    console.error('Login page initialization failed:', err)
    error.value = err.message || '初始化失败'
  } finally {
    isLoading.value = false
  }
})

const handleLogin = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    await authStore.login()
  } catch (err: any) {
    console.error('Login failed:', err)
    error.value = err.message || '登录失败'
  } finally {
    isLoading.value = false
  }
}

const handleSuccessfulAuth = () => {
  const targetPath = redirectPath.value || '/admin'
  router.replace(targetPath)
}

const clearError = () => {
  error.value = null
  authStore.clearError()
}

const goHome = () => {
  router.push('/')
}

const handleLogoError = (event: Event) => {
  // 如果 logo 加载失败，隐藏图片
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}
</script>