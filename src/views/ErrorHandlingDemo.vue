<template>
  <div class="container mx-auto p-6 space-y-8">
    <div class="text-center">
      <h1 class="text-3xl font-bold text-foreground mb-2">错误处理演示</h1>
      <p class="text-muted-foreground">测试各种错误处理场景和组件</p>
    </div>

    <!-- 错误触发按钮 -->
    <Card class="p-6">
      <h2 class="text-xl font-semibold mb-4">错误触发测试</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button @click="triggerNetworkError" variant="destructive">
          网络错误
        </Button>
        <Button @click="triggerAuthError" variant="destructive">
          认证错误
        </Button>
        <Button @click="triggerValidationError" variant="destructive">
          验证错误
        </Button>
        <Button @click="triggerUnknownError" variant="destructive">
          未知错误
        </Button>
        <Button @click="triggerTimeoutError" variant="destructive">
          超时错误
        </Button>
        <Button @click="triggerPermissionError" variant="destructive">
          权限错误
        </Button>
        <Button @click="triggerComponentError" variant="destructive">
          组件错误
        </Button>
        <Button @click="triggerAsyncError" variant="destructive">
          异步错误
        </Button>
      </div>
    </Card>

    <!-- 重试机制测试 -->
    <Card class="p-6">
      <h2 class="text-xl font-semibold mb-4">重试机制测试</h2>
      <div class="space-y-4">
        <div class="flex items-center space-x-4">
          <Button 
            @click="testRetrySuccess" 
            :disabled="retryState.isRetrying"
          >
            <RefreshCwIcon :class="cn('w-4 h-4 mr-2', retryState.isRetrying && 'animate-spin')" />
            测试重试成功
          </Button>
          <Button 
            @click="testRetryFailure" 
            :disabled="retryState.isRetrying"
          >
            <XCircleIcon class="w-4 h-4 mr-2" />
            测试重试失败
          </Button>
          <Button 
            @click="testNetworkRetry" 
            :disabled="retryState.isRetrying"
          >
            <WifiIcon class="w-4 h-4 mr-2" />
            测试网络重试
          </Button>
        </div>
        
        <div v-if="retryState.isRetrying" class="p-4 bg-muted rounded-lg">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium">重试进度</span>
            <span class="text-sm text-muted-foreground">
              {{ retryInfo.attemptsLeft }} 次剩余
            </span>
          </div>
          <div class="w-full bg-background rounded-full h-2">
            <div 
              class="bg-primary h-2 rounded-full transition-all duration-300"
              :style="{ width: `${retryInfo.progress * 100}%` }"
            />
          </div>
        </div>

        <div v-if="retryStats.totalAttempts > 0" class="text-sm text-muted-foreground">
          统计: {{ retryStats.successCount }}/{{ retryStats.totalAttempts }} 成功 
          ({{ Math.round(retryStats.successRate * 100) }}%)
        </div>
      </div>
    </Card>

    <!-- 错误显示组件测试 -->
    <Card class="p-6">
      <h2 class="text-xl font-semibold mb-4">错误显示组件</h2>
      <div class="space-y-6">
        <div v-if="currentError">
          <ErrorDisplay
            :error="currentError"
            :show-details="true"
            :show-stack="false"
            :show-retry="true"
            :show-home="false"
            :show-refresh="false"
            :show-report="true"
            :show-copy="true"
            @retry="handleErrorRetry"
            @report="handleErrorReport"
          />
        </div>
        <div v-else class="text-center text-muted-foreground py-8">
          触发一个错误来查看错误显示组件
        </div>
      </div>
    </Card>

    <!-- 验证反馈组件测试 -->
    <Card class="p-6">
      <h2 class="text-xl font-semibold mb-4">验证反馈组件</h2>
      <div class="space-y-4">
        <div class="flex space-x-4">
          <Button @click="generateValidationErrors" variant="outline">
            生成验证错误
          </Button>
          <Button @click="generateValidationWarnings" variant="outline">
            生成验证警告
          </Button>
          <Button @click="clearValidationFeedback" variant="outline">
            清除反馈
          </Button>
        </div>
        
        <ValidationFeedback
          :errors="validationErrors"
          :warnings="validationWarnings"
          :field-labels="fieldLabels"
          :show-codes="true"
          :show-actions="true"
          :show-stats="true"
          :last-updated="validationLastUpdated"
          @clear="clearValidationFeedback"
          @export="handleValidationExport"
          @help="handleValidationHelp"
        />
      </div>
    </Card>

    <!-- 网络状态组件测试 -->
    <Card class="p-6">
      <h2 class="text-xl font-semibold mb-4">网络状态组件</h2>
      <div class="space-y-4">
        <div class="flex space-x-4">
          <Button @click="simulateOffline" variant="outline">
            模拟离线
          </Button>
          <Button @click="simulateOnline" variant="outline">
            模拟在线
          </Button>
        </div>
        
        <NetworkStatus
          :show-details="true"
          :show-retry="true"
          :auto-hide="false"
        />
      </div>
    </Card>

    <!-- 错误统计 -->
    <Card class="p-6">
      <h2 class="text-xl font-semibold mb-4">错误统计</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="text-center p-4 bg-muted rounded-lg">
          <div class="text-2xl font-bold text-destructive">{{ errorStats.total }}</div>
          <div class="text-sm text-muted-foreground">总错误数</div>
        </div>
        <div class="text-center p-4 bg-muted rounded-lg">
          <div class="text-2xl font-bold text-orange-500">{{ errorStats.networkErrors }}</div>
          <div class="text-sm text-muted-foreground">网络错误</div>
        </div>
        <div class="text-center p-4 bg-muted rounded-lg">
          <div class="text-2xl font-bold text-blue-500">{{ Object.keys(errorStats.byCode).length }}</div>
          <div class="text-sm text-muted-foreground">错误类型</div>
        </div>
        <div class="text-center p-4 bg-muted rounded-lg">
          <div class="text-2xl font-bold text-green-500">{{ retryStats.successCount }}</div>
          <div class="text-sm text-muted-foreground">重试成功</div>
        </div>
      </div>
      
      <div class="mt-4">
        <h3 class="font-medium mb-2">错误类型分布</h3>
        <div class="space-y-2">
          <div 
            v-for="(count, code) in errorStats.byCode" 
            :key="code"
            class="flex justify-between items-center p-2 bg-muted rounded"
          >
            <span class="font-mono text-sm">{{ code }}</span>
            <span class="text-sm">{{ count }}</span>
          </div>
        </div>
      </div>
    </Card>

    <!-- 操作按钮 -->
    <Card class="p-6">
      <h2 class="text-xl font-semibold mb-4">操作</h2>
      <div class="flex flex-wrap gap-4">
        <Button @click="clearAllErrors" variant="outline">
          <TrashIcon class="w-4 h-4 mr-2" />
          清除所有错误
        </Button>
        <Button @click="exportErrorLog" variant="outline">
          <DownloadIcon class="w-4 h-4 mr-2" />
          导出错误日志
        </Button>
        <Button @click="resetRetryStats" variant="outline">
          <RotateCcwIcon class="w-4 h-4 mr-2" />
          重置重试统计
        </Button>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  RefreshCwIcon,
  XCircleIcon,
  WifiIcon,
  TrashIcon,
  DownloadIcon,
  RotateCcwIcon,
} from 'lucide-vue-next'
import { Card, Button, ErrorDisplay, ValidationFeedback, NetworkStatus } from '@/components/ui'
import { errorHandler } from '@/services/errorHandler'
import { useRetry } from '@/composables/useRetry'
import { notification } from '@/composables/useNotification'
import { cn } from '@/utils'
import type { AppError } from '@/types'

// 重试机制
const { state: retryState, retryInfo, stats: retryStats, execute, reset } = useRetry({
  maxAttempts: 3,
  delay: 1000,
  backoff: true,
})

// 当前错误
const currentError = ref<AppError | null>(null)

// 验证反馈
const validationErrors = ref<Array<{ field: string; message: string; code?: string }>>([])
const validationWarnings = ref<Array<{ field: string; message: string; code?: string }>>([])
const validationLastUpdated = ref<Date | null>(null)

const fieldLabels = {
  'title': '标题',
  'description': '描述',
  'url': '链接',
  'email': '邮箱',
  'password': '密码',
}

// 错误统计
const errorStats = computed(() => errorHandler.getErrorStats())

// 错误触发方法
const triggerNetworkError = () => {
  const error = new Error('网络连接失败')
  currentError.value = errorHandler.handleNetworkError(error, {
    url: 'https://api.example.com/data',
    method: 'GET',
    status: 0,
    statusText: 'Network Error',
  })
}

const triggerAuthError = () => {
  const error = new Error('认证令牌已过期')
  currentError.value = errorHandler.handleAuthError(error)
}

const triggerValidationError = () => {
  const errors = [
    { field: 'title', message: '标题不能为空', code: 'REQUIRED' },
    { field: 'url', message: 'URL 格式不正确', code: 'INVALID_FORMAT' },
  ]
  currentError.value = errorHandler.handleValidationError(errors)
}

const triggerUnknownError = () => {
  const error = new Error('发生了未知错误')
  currentError.value = errorHandler.handleError(error, {
    context: 'Demo',
    showNotification: true,
  })
}

const triggerTimeoutError = () => {
  const error = new Error('请求超时')
  error.name = 'TimeoutError'
  currentError.value = errorHandler.handleError(error, {
    context: 'Timeout Demo',
  })
}

const triggerPermissionError = () => {
  const error = new Error('权限不足，无法执行此操作')
  error.name = 'PermissionError'
  currentError.value = errorHandler.handleError(error, {
    context: 'Permission Demo',
  })
}

const triggerComponentError = () => {
  throw new Error('组件内部错误')
}

const triggerAsyncError = async () => {
  await new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('异步操作失败'))
    }, 1000)
  })
}

// 重试测试方法
const testRetrySuccess = async () => {
  let attempts = 0
  try {
    await execute(async () => {
      attempts++
      if (attempts < 2) {
        throw new Error('模拟失败')
      }
      return '成功'
    })
    notification.success('重试成功', '操作在第2次尝试时成功')
  } catch (error) {
    console.error('重试失败:', error)
  }
}

const testRetryFailure = async () => {
  try {
    await execute(async () => {
      throw new Error('始终失败的操作')
    })
  } catch (error) {
    console.error('重试最终失败:', error)
  }
}

const testNetworkRetry = async () => {
  try {
    const response = await errorHandler.fetchWithRetry('/api/nonexistent', {
      method: 'GET',
    })
    console.log('网络重试成功:', response)
  } catch (error) {
    console.error('网络重试失败:', error)
  }
}

// 验证反馈方法
const generateValidationErrors = () => {
  validationErrors.value = [
    { field: 'title', message: '标题不能为空', code: 'REQUIRED' },
    { field: 'description', message: '描述长度不能超过500个字符', code: 'MAX_LENGTH' },
    { field: 'url', message: 'URL格式不正确', code: 'INVALID_FORMAT' },
    { field: 'email', message: '邮箱格式不正确', code: 'INVALID_EMAIL' },
  ]
  validationLastUpdated.value = new Date()
}

const generateValidationWarnings = () => {
  validationWarnings.value = [
    { field: 'password', message: '密码强度较弱，建议使用更复杂的密码' },
    { field: 'title', message: '标题可能过于简短' },
  ]
  validationLastUpdated.value = new Date()
}

const clearValidationFeedback = () => {
  validationErrors.value = []
  validationWarnings.value = []
  validationLastUpdated.value = null
}

const handleValidationExport = (data: any) => {
  console.log('导出验证数据:', data)
  notification.success('导出成功', '验证数据已导出')
}

const handleValidationHelp = () => {
  notification.info('帮助', '这里是验证规则的帮助信息')
}

// 网络状态模拟
const simulateOffline = () => {
  // 触发离线事件
  window.dispatchEvent(new Event('offline'))
  notification.warning('网络状态', '已模拟离线状态')
}

const simulateOnline = () => {
  // 触发在线事件
  window.dispatchEvent(new Event('online'))
  notification.success('网络状态', '已模拟在线状态')
}

// 错误处理方法
const handleErrorRetry = () => {
  currentError.value = null
  notification.info('重试', '已清除当前错误')
}

const handleErrorReport = (error: AppError) => {
  console.log('报告错误:', error)
  notification.success('错误报告', '错误已报告给技术支持')
}

// 操作方法
const clearAllErrors = () => {
  errorHandler.clearErrors()
  errorHandler.clearNetworkErrors()
  currentError.value = null
  notification.success('清除成功', '所有错误已清除')
}

const exportErrorLog = () => {
  const log = errorHandler.exportErrorLog()
  const blob = new Blob([JSON.stringify(log, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `error-log-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  notification.success('导出成功', '错误日志已下载')
}

const resetRetryStats = () => {
  reset()
  notification.success('重置成功', '重试统计已重置')
}

onMounted(() => {
  notification.info('演示页面', '欢迎使用错误处理演示页面')
})
</script>