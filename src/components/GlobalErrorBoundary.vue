<template>
  <div v-if="hasError" class="min-h-screen bg-background flex items-center justify-center p-4">
    <div class="max-w-2xl w-full">
      <ErrorDisplay
        :error="currentError"
        :show-details="true"
        :show-stack="isDevelopment"
        :show-retry="true"
        :show-home="true"
        :show-refresh="true"
        :show-report="true"
        size="lg"
        @retry="handleRetry"
        @report="handleReport"
      />
      
      <!-- 开发环境额外信息 -->
      <div v-if="isDevelopment && errorHistory.length > 1" class="mt-6">
        <details class="bg-muted rounded-lg p-4">
          <summary class="cursor-pointer font-medium text-sm">
            错误历史 ({{ errorHistory.length }} 个)
          </summary>
          <div class="mt-3 space-y-2 max-h-64 overflow-auto">
            <div
              v-for="(error, index) in errorHistory"
              :key="index"
              class="p-2 bg-background rounded text-xs"
            >
              <div class="font-mono text-destructive">{{ error.code }}</div>
              <div class="text-muted-foreground">{{ error.message }}</div>
              <div class="text-xs text-muted-foreground">
                {{ formatTimestamp(error.timestamp) }}
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  </div>
  
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, computed } from 'vue'
import type { AppError } from '@/types'
import { errorHandler } from '@/services/errorHandler'
import ErrorDisplay from './ui/ErrorDisplay.vue'
import { notification } from '@/composables/useNotification'

const hasError = ref(false)
const currentError = ref<AppError | null>(null)
const errorHistory = ref<AppError[]>([])

const isDevelopment = computed(() => import.meta.env.DEV)

// 捕获组件错误
onErrorCaptured((error: Error, instance, info) => {
  console.error('GlobalErrorBoundary caught error:', error, info)
  
  const appError = errorHandler.handleError(error, {
    context: `Component Error: ${info}`,
    showNotification: false, // 由边界组件处理显示
    logToConsole: true,
  })
  
  handleError(appError)
  
  // 阻止错误继续传播
  return false
})

// 监听全局错误
window.addEventListener('error', (event) => {
  const appError = errorHandler.handleError(event.error, {
    context: 'Global Error',
    showNotification: false,
  })
  
  handleError(appError)
})

// 监听未处理的 Promise 拒绝
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
  
  const appError = errorHandler.handleError(error, {
    context: 'Unhandled Promise Rejection',
    showNotification: false,
  })
  
  handleError(appError)
  
  // 阻止默认的控制台错误输出
  event.preventDefault()
})

const handleError = (error: AppError) => {
  currentError.value = error
  errorHistory.value.push(error)
  hasError.value = true
  
  // 限制错误历史长度
  if (errorHistory.value.length > 10) {
    errorHistory.value = errorHistory.value.slice(-10)
  }
  
  // 在开发环境显示详细错误信息
  if (isDevelopment.value) {
    console.group('🚨 Global Error Boundary')
    console.error('Error:', error)
    console.error('Stack:', error.details?.stack)
    console.groupEnd()
  }
}

const handleRetry = () => {
  hasError.value = false
  currentError.value = null
  
  // 尝试重新渲染应用
  setTimeout(() => {
    if (hasError.value) {
      notification.error('重试失败', '应用仍然存在错误')
    } else {
      notification.success('重试成功', '应用已恢复正常')
    }
  }, 100)
}

const handleReport = (error: AppError) => {
  // 收集错误报告信息
  const report = {
    error,
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    errorHistory: errorHistory.value,
    appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  }
  
  // 这里可以发送到错误报告服务
  console.log('Error Report:', report)
  
  // 复制到剪贴板
  navigator.clipboard.writeText(JSON.stringify(report, null, 2)).then(() => {
    notification.success('错误报告', '错误信息已复制到剪贴板，请发送给技术支持')
  }).catch(() => {
    notification.info('错误报告', '请手动复制控制台中的错误信息')
  })
}

const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 导出错误处理方法供外部使用
defineExpose({
  handleError,
  clearErrors: () => {
    hasError.value = false
    currentError.value = null
    errorHistory.value = []
  },
  getErrorHistory: () => errorHistory.value,
})
</script>