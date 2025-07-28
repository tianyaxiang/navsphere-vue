<template>
  <div class="min-h-screen flex items-center justify-center bg-background">
    <div class="max-w-md w-full space-y-8 p-8">
      <div class="text-center">
        <!-- 处理中状态 -->
        <div v-if="isLoading" class="space-y-4">
          <LoadingSpinner size="lg" />
          <h2 class="text-2xl font-bold text-foreground">
            正在处理登录...
          </h2>
          <p class="text-muted-foreground">
            请稍候，我们正在验证您的 GitHub 账户
          </p>
          <div class="mt-4">
            <div class="text-xs text-muted-foreground">
              <p>步骤 {{ currentStep }}/3</p>
              <p class="mt-1">{{ stepMessage }}</p>
            </div>
          </div>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="space-y-4">
          <div class="text-destructive">
            <XCircleIcon class="h-12 w-12 mx-auto mb-4" />
          </div>
          <h2 class="text-2xl font-bold text-foreground">
            登录失败
          </h2>
          <p class="text-muted-foreground">
            {{ error }}
          </p>
          
          <!-- 错误详情（开发模式下显示） -->
          <div v-if="isDev && errorDetails" class="mt-4 p-3 bg-destructive/10 rounded-md">
            <details class="text-left">
              <summary class="text-sm font-medium cursor-pointer">错误详情</summary>
              <pre class="mt-2 text-xs text-muted-foreground whitespace-pre-wrap">{{ errorDetails }}</pre>
            </details>
          </div>

          <div class="space-y-2">
            <Button @click="retry" :disabled="retryCount >= maxRetries" class="w-full">
              {{ retryCount >= maxRetries ? '重试次数已用完' : `重试 (${retryCount}/${maxRetries})` }}
            </Button>
            <Button variant="outline" @click="goToLogin" class="w-full">
              重新登录
            </Button>
            <Button variant="ghost" @click="goHome" class="w-full">
              返回首页
            </Button>
          </div>
        </div>

        <!-- 成功状态 -->
        <div v-else class="space-y-4">
          <div class="text-green-500">
            <CheckCircleIcon class="h-12 w-12 mx-auto mb-4" />
          </div>
          <h2 class="text-2xl font-bold text-foreground">
            登录成功
          </h2>
          <p class="text-muted-foreground">
            欢迎回来，{{ userInfo?.name || userInfo?.login }}！
          </p>
          <p class="text-sm text-muted-foreground">
            正在跳转到{{ redirectPath ? '之前访问的页面' : '管理后台' }}...
          </p>
          
          <!-- 用户信息预览 -->
          <div v-if="userInfo" class="mt-4 p-3 bg-accent/50 rounded-md">
            <div class="flex items-center space-x-3">
              <img 
                :src="userInfo.avatar_url" 
                :alt="userInfo.name || userInfo.login"
                class="h-10 w-10 rounded-full"
              />
              <div class="text-left">
                <p class="text-sm font-medium">{{ userInfo.name || userInfo.login }}</p>
                <p class="text-xs text-muted-foreground">@{{ userInfo.login }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { CheckCircleIcon, XCircleIcon } from 'lucide-vue-next'
import { Button, LoadingSpinner } from '@/components/ui'
import { useAuthStore } from '@/stores/auth'
import type { GitHubUser } from '@/types'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isLoading = ref(true)
const error = ref<string | null>(null)
const errorDetails = ref<string | null>(null)
const userInfo = ref<GitHubUser | null>(null)
const currentStep = ref(1)
const stepMessage = ref('验证授权参数...')
const retryCount = ref(0)
const maxRetries = 3

// 计算属性
const isDev = computed(() => import.meta.env.DEV)
const redirectPath = computed(() => {
  const redirect = route.query.redirect as string
  return redirect && redirect !== '/login' ? redirect : null
})

onMounted(async () => {
  await handleCallback()
})

const handleCallback = async () => {
  try {
    isLoading.value = true
    error.value = null
    errorDetails.value = null
    currentStep.value = 1
    stepMessage.value = '验证授权参数...'

    const code = route.query.code as string
    const state = route.query.state as string
    const errorParam = route.query.error as string

    // 步骤 1: 检查错误参数
    if (errorParam) {
      const errorDescription = route.query.error_description as string
      throw new Error(errorDescription || `GitHub OAuth 错误: ${errorParam}`)
    }

    // 检查必需的参数
    if (!code || !state) {
      throw new Error('缺少必需的认证参数 (code 或 state)')
    }

    // 步骤 2: 处理 OAuth 回调
    currentStep.value = 2
    stepMessage.value = '交换访问令牌...'
    
    const success = await authStore.handleCallback(code, state)
    
    if (!success) {
      throw new Error('OAuth 回调处理失败')
    }

    // 步骤 3: 获取用户信息
    currentStep.value = 3
    stepMessage.value = '获取用户信息...'
    
    userInfo.value = authStore.user
    
    if (!userInfo.value) {
      throw new Error('无法获取用户信息')
    }

    // 登录成功，延迟跳转
    setTimeout(() => {
      const targetPath = redirectPath.value || '/admin'
      router.replace(targetPath)
    }, 2000)
    
  } catch (err: any) {
    console.error('OAuth callback error:', err)
    error.value = err.message || '登录处理失败'
    errorDetails.value = isDev.value ? JSON.stringify({
      error: err,
      route: route.query,
      timestamp: new Date().toISOString(),
    }, null, 2) : null
  } finally {
    isLoading.value = false
  }
}

const retry = async () => {
  if (retryCount.value >= maxRetries) return
  
  retryCount.value++
  await handleCallback()
}

const goToLogin = () => {
  router.push('/login')
}

const goHome = () => {
  router.push('/')
}
</script>