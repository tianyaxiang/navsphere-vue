<template>
  <div :class="containerClasses">
    <!-- 错误图标和标题 -->
    <div class="text-center mb-6">
      <div class="mx-auto mb-4 w-16 h-16 flex items-center justify-center rounded-full bg-destructive/10">
        <component :is="errorIcon" class="w-8 h-8 text-destructive" />
      </div>
      
      <h3 class="text-lg font-semibold text-foreground mb-2">
        {{ errorTitle }}
      </h3>
      
      <p class="text-muted-foreground">
        {{ errorMessage }}
      </p>
    </div>

    <!-- 错误详情 -->
    <div v-if="showDetails && error.details" class="mb-6">
      <details class="group">
        <summary class="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center">
          <ChevronRightIcon class="w-4 h-4 mr-1 transition-transform group-open:rotate-90" />
          查看详细信息
        </summary>
        <div class="mt-3 p-4 bg-muted rounded-lg">
          <div class="space-y-2 text-sm">
            <div v-if="error.code">
              <span class="font-medium">错误代码:</span>
              <span class="ml-2 font-mono text-destructive">{{ error.code }}</span>
            </div>
            <div v-if="error.timestamp">
              <span class="font-medium">发生时间:</span>
              <span class="ml-2">{{ formatTimestamp(error.timestamp) }}</span>
            </div>
            <div v-if="error.details?.context">
              <span class="font-medium">上下文:</span>
              <span class="ml-2">{{ error.details.context }}</span>
            </div>
            <div v-if="error.details?.stack && showStack">
              <span class="font-medium">堆栈信息:</span>
              <pre class="mt-1 p-2 bg-background rounded text-xs overflow-auto max-h-32">{{ error.details.stack }}</pre>
            </div>
          </div>
        </div>
      </details>
    </div>

    <!-- 验证错误详情 -->
    <div v-if="error.code === 'VALIDATION_ERROR' && error.details?.validationErrors" class="mb-6">
      <div class="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
        <h4 class="font-medium text-destructive mb-3">验证错误详情:</h4>
        <ul class="space-y-2">
          <li
            v-for="(validationError, index) in error.details.validationErrors"
            :key="index"
            class="flex items-start text-sm"
          >
            <XCircleIcon class="w-4 h-4 text-destructive mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <span class="font-medium">{{ validationError.field }}:</span>
              <span class="ml-1">{{ validationError.message }}</span>
              <span v-if="validationError.code" class="ml-2 text-xs text-muted-foreground">
                ({{ validationError.code }})
              </span>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- 网络错误详情 -->
    <div v-if="error.code === 'NETWORK_ERROR' && error.details?.networkInfo" class="mb-6">
      <div class="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
        <h4 class="font-medium text-orange-800 dark:text-orange-200 mb-3">网络请求信息:</h4>
        <div class="space-y-1 text-sm text-orange-700 dark:text-orange-300">
          <div v-if="error.details.networkInfo.url">
            <span class="font-medium">URL:</span>
            <span class="ml-2 font-mono">{{ error.details.networkInfo.url }}</span>
          </div>
          <div v-if="error.details.networkInfo.method">
            <span class="font-medium">方法:</span>
            <span class="ml-2">{{ error.details.networkInfo.method }}</span>
          </div>
          <div v-if="error.details.networkInfo.status">
            <span class="font-medium">状态码:</span>
            <span class="ml-2">{{ error.details.networkInfo.status }}</span>
          </div>
          <div v-if="error.details.networkInfo.statusText">
            <span class="font-medium">状态文本:</span>
            <span class="ml-2">{{ error.details.networkInfo.statusText }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex flex-wrap gap-3 justify-center">
      <Button
        v-if="showRetry"
        variant="default"
        @click="handleRetry"
        :disabled="retrying"
      >
        <RefreshCwIcon :class="cn('w-4 h-4 mr-2', retrying && 'animate-spin')" />
        {{ retrying ? '重试中...' : '重试' }}
      </Button>

      <Button
        v-if="showHome"
        variant="outline"
        @click="goHome"
      >
        <HomeIcon class="w-4 h-4 mr-2" />
        返回首页
      </Button>

      <Button
        v-if="showRefresh"
        variant="outline"
        @click="refreshPage"
      >
        <RotateCcwIcon class="w-4 h-4 mr-2" />
        刷新页面
      </Button>

      <Button
        v-if="showReport"
        variant="outline"
        @click="reportError"
      >
        <BugIcon class="w-4 h-4 mr-2" />
        报告问题
      </Button>

      <Button
        v-if="showCopy"
        variant="outline"
        @click="copyError"
      >
        <CopyIcon class="w-4 h-4 mr-2" />
        复制错误信息
      </Button>
    </div>

    <!-- 建议操作 -->
    <div v-if="suggestions.length > 0" class="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <h4 class="font-medium text-blue-800 dark:text-blue-200 mb-2">建议操作:</h4>
      <ul class="space-y-1 text-sm text-blue-700 dark:text-blue-300">
        <li v-for="(suggestion, index) in suggestions" :key="index" class="flex items-start">
          <LightbulbIcon class="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
          {{ suggestion }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  AlertTriangleIcon,
  XCircleIcon,
  WifiOffIcon,
  ShieldXIcon,
  FileXIcon,
  ClockIcon,
  RefreshCwIcon,
  HomeIcon,
  RotateCcwIcon,
  BugIcon,
  CopyIcon,
  ChevronRightIcon,
  LightbulbIcon,
} from 'lucide-vue-next'
import type { AppError } from '@/types'
import { cn } from '@/utils'
import Button from './Button.vue'
import { notification } from '@/composables/useNotification'

interface Props {
  error: AppError
  showDetails?: boolean
  showStack?: boolean
  showRetry?: boolean
  showHome?: boolean
  showRefresh?: boolean
  showReport?: boolean
  showCopy?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: true,
  showStack: false,
  showRetry: true,
  showHome: true,
  showRefresh: false,
  showReport: false,
  showCopy: true,
  size: 'md',
})

const emit = defineEmits<{
  retry: []
  report: [error: AppError]
}>()

const router = useRouter()
const retrying = ref(false)

// 错误图标映射
const errorIcons = {
  NETWORK_ERROR: WifiOffIcon,
  AUTH_ERROR: ShieldXIcon,
  VALIDATION_ERROR: AlertTriangleIcon,
  NOT_FOUND: FileXIcon,
  TIMEOUT_ERROR: ClockIcon,
  PERMISSION_DENIED: ShieldXIcon,
  UNKNOWN_ERROR: XCircleIcon,
}

// 计算属性
const containerClasses = computed(() => {
  const sizeClasses = {
    sm: 'p-4 max-w-md',
    md: 'p-6 max-w-lg',
    lg: 'p-8 max-w-xl',
  }

  return cn(
    'bg-card border border-border rounded-lg shadow-sm',
    sizeClasses[props.size],
    props.className
  )
})

const errorIcon = computed(() => {
  return errorIcons[props.error.code as keyof typeof errorIcons] || AlertTriangleIcon
})

const errorTitle = computed(() => {
  const titles: Record<string, string> = {
    NETWORK_ERROR: '网络连接失败',
    AUTH_ERROR: '认证失败',
    VALIDATION_ERROR: '数据验证失败',
    NOT_FOUND: '资源不存在',
    TIMEOUT_ERROR: '请求超时',
    PERMISSION_DENIED: '权限不足',
    UNKNOWN_ERROR: '出现了一些问题',
  }

  return titles[props.error.code] || '出现了一些问题'
})

const errorMessage = computed(() => {
  return props.error.message || '请稍后重试或联系管理员'
})

const suggestions = computed(() => {
  const suggestionMap: Record<string, string[]> = {
    NETWORK_ERROR: [
      '检查网络连接是否正常',
      '尝试刷新页面',
      '检查防火墙或代理设置',
    ],
    AUTH_ERROR: [
      '请重新登录',
      '检查登录凭据是否有效',
      '清除浏览器缓存后重试',
    ],
    VALIDATION_ERROR: [
      '检查输入的数据格式是否正确',
      '确保所有必填字段都已填写',
      '参考帮助文档了解正确格式',
    ],
    NOT_FOUND: [
      '检查 URL 是否正确',
      '确认资源是否存在',
      '联系管理员确认权限',
    ],
    TIMEOUT_ERROR: [
      '检查网络连接速度',
      '稍后重试',
      '联系管理员检查服务器状态',
    ],
    PERMISSION_DENIED: [
      '联系管理员申请相应权限',
      '确认当前账户权限',
      '尝试重新登录',
    ],
  }

  return suggestionMap[props.error.code] || [
    '尝试刷新页面',
    '检查网络连接',
    '联系技术支持',
  ]
})

// 方法
const formatTimestamp = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const handleRetry = async () => {
  retrying.value = true
  try {
    emit('retry')
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟重试延迟
  } finally {
    retrying.value = false
  }
}

const goHome = () => {
  router.push('/')
}

const refreshPage = () => {
  window.location.reload()
}

const reportError = () => {
  emit('report', props.error)
  notification.info('错误报告', '错误信息已记录，我们会尽快处理')
}

const copyError = async () => {
  try {
    const errorInfo = {
      code: props.error.code,
      message: props.error.message,
      timestamp: props.error.timestamp,
      details: props.error.details,
    }

    await navigator.clipboard.writeText(JSON.stringify(errorInfo, null, 2))
    notification.success('复制成功', '错误信息已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    notification.error('复制失败', '无法复制到剪贴板')
  }
}
</script>