<template>
  <Card class="p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">系统状态</h3>
      <Badge :variant="statusVariant">{{ statusText }}</Badge>
    </div>

    <div class="space-y-3">
      <!-- 应用状态 -->
      <div class="flex items-center justify-between text-sm">
        <span class="text-muted-foreground">应用状态:</span>
        <div class="flex items-center space-x-2">
          <div :class="cn('w-2 h-2 rounded-full', appStore.isReady ? 'bg-green-500' : 'bg-yellow-500')" />
          <span>{{ appStore.isReady ? '就绪' : '初始化中' }}</span>
        </div>
      </div>

      <!-- 认证状态 -->
      <div class="flex items-center justify-between text-sm">
        <span class="text-muted-foreground">认证状态:</span>
        <div class="flex items-center space-x-2">
          <div :class="cn('w-2 h-2 rounded-full', authStore.isAuthenticated ? 'bg-green-500' : 'bg-red-500')" />
          <span>{{ authStore.isAuthenticated ? '已认证' : '未认证' }}</span>
        </div>
      </div>

      <!-- 数据同步状态 -->
      <div class="flex items-center justify-between text-sm">
        <span class="text-muted-foreground">数据同步:</span>
        <div class="flex items-center space-x-2">
          <div :class="cn('w-2 h-2 rounded-full', getSyncStatusColor())" />
          <span>{{ getSyncStatusText() }}</span>
        </div>
      </div>

      <!-- 缓存状态 -->
      <div class="flex items-center justify-between text-sm">
        <span class="text-muted-foreground">缓存:</span>
        <span>{{ cacheStats.totalItems }} 项</span>
      </div>

      <!-- 错误状态 -->
      <div v-if="errorStats.total > 0" class="flex items-center justify-between text-sm">
        <span class="text-muted-foreground">错误:</span>
        <span class="text-destructive">{{ errorStats.total }} 个</span>
      </div>

      <!-- 最后同步时间 -->
      <div v-if="appStore.lastSyncTime" class="flex items-center justify-between text-sm">
        <span class="text-muted-foreground">最后同步:</span>
        <span>{{ formatTime(appStore.lastSyncTime) }}</span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="mt-4 flex space-x-2">
      <Button
        variant="outline"
        size="sm"
        @click="refreshData"
        :disabled="appStore.isLoading"
      >
        <RefreshCwIcon :class="cn('h-4 w-4 mr-1', appStore.isLoading && 'animate-spin')" />
        刷新
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        @click="clearCache"
      >
        <TrashIcon class="h-4 w-4 mr-1" />
        清理缓存
      </Button>

      <Button
        v-if="errorStats.total > 0"
        variant="outline"
        size="sm"
        @click="clearErrors"
      >
        <XIcon class="h-4 w-4 mr-1" />
        清理错误
      </Button>
    </div>

    <!-- 详细信息（可展开） -->
    <details v-if="showDetails" class="mt-4">
      <summary class="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
        详细信息
      </summary>
      <div class="mt-2 p-3 bg-muted rounded-md text-xs">
        <pre>{{ JSON.stringify(appStats, null, 2) }}</pre>
      </div>
    </details>
  </Card>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { RefreshCwIcon, TrashIcon, XIcon } from 'lucide-vue-next'
import { Card, Button, Badge } from '@/components/ui'
import { useAppStore, useAuthStore } from '@/stores'
import { useDataSync, useErrorHandler } from '@/composables'
import { cn } from '@/utils'

interface Props {
  showDetails?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: false,
  autoRefresh: true,
  refreshInterval: 30000, // 30 seconds
})

const appStore = useAppStore()
const authStore = useAuthStore()
const dataSync = useDataSync()
const errorHandler = useErrorHandler()

const refreshTimer = ref<NodeJS.Timeout | null>(null)

// 计算属性
const appStats = computed(() => appStore.getAppStats())
const cacheStats = computed(() => dataSync.getCacheStats())
const errorStats = computed(() => errorHandler.getErrorStats())

const statusVariant = computed(() => {
  if (appStore.error || errorStats.value.total > 0) return 'destructive'
  if (!appStore.isReady) return 'warning'
  if (!authStore.isAuthenticated) return 'secondary'
  return 'success'
})

const statusText = computed(() => {
  if (appStore.error) return '错误'
  if (!appStore.isReady) return '初始化中'
  if (!authStore.isAuthenticated) return '未认证'
  return '正常'
})

// 方法
const getSyncStatusColor = () => {
  const status = dataSync.syncStatus
  switch (status) {
    case 'syncing': return 'bg-blue-500'
    case 'needs-sync': return 'bg-yellow-500'
    case 'synced': return 'bg-green-500'
    default: return 'bg-gray-500'
  }
}

const getSyncStatusText = () => {
  const status = dataSync.syncStatus
  switch (status) {
    case 'syncing': return '同步中'
    case 'needs-sync': return '需要同步'
    case 'synced': return '已同步'
    default: return '未知'
  }
}

const formatTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return date.toLocaleDateString()
}

const refreshData = async () => {
  await appStore.refreshAppData()
}

const clearCache = () => {
  dataSync.clearCache()
}

const clearErrors = () => {
  errorHandler.clearErrors()
  appStore.clearError()
}

// 生命周期
onMounted(() => {
  if (props.autoRefresh) {
    refreshTimer.value = setInterval(() => {
      // 静默刷新状态（不显示通知）
    }, props.refreshInterval)
  }
})

onUnmounted(() => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }
})
</script>