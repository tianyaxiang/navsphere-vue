<template>
  <div v-if="showStatus" :class="statusClasses">
    <div class="flex items-center space-x-2">
      <component :is="statusIcon" :class="iconClasses" />
      <span class="text-sm font-medium">{{ statusText }}</span>
      <Button
        v-if="showRetry && !isOnline"
        variant="ghost"
        size="sm"
        @click="checkConnection"
        :disabled="checking"
      >
        <RefreshCwIcon :class="cn('w-3 h-3', checking && 'animate-spin')" />
      </Button>
    </div>
    
    <!-- 详细信息 -->
    <div v-if="showDetails && networkInfo" class="mt-2 text-xs text-muted-foreground">
      <div>连接类型: {{ networkInfo.effectiveType || '未知' }}</div>
      <div v-if="networkInfo.downlink">下载速度: {{ networkInfo.downlink }} Mbps</div>
      <div v-if="networkInfo.rtt">延迟: {{ networkInfo.rtt }}ms</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  WifiIcon,
  WifiOffIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
} from 'lucide-vue-next'
import { cn } from '@/utils'
import Button from './Button.vue'
import { notification } from '@/composables/useNotification'

interface Props {
  showDetails?: boolean
  showRetry?: boolean
  autoHide?: boolean
  hideDelay?: number
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: false,
  showRetry: true,
  autoHide: true,
  hideDelay: 3000,
})

interface NetworkInformation {
  effectiveType?: string
  downlink?: number
  rtt?: number
  saveData?: boolean
}

const isOnline = ref(navigator.onLine)
const checking = ref(false)
const networkInfo = ref<NetworkInformation | null>(null)
const showStatus = ref(!props.autoHide || !isOnline.value)
let hideTimer: NodeJS.Timeout | null = null

// 计算属性
const statusClasses = computed(() => {
  const baseClasses = 'px-3 py-2 rounded-lg border transition-all duration-300'
  
  if (isOnline.value) {
    return cn(
      baseClasses,
      'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
      props.className
    )
  } else {
    return cn(
      baseClasses,
      'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
      props.className
    )
  }
})

const statusIcon = computed(() => {
  if (checking.value) return RefreshCwIcon
  if (isOnline.value) return WifiIcon
  return WifiOffIcon
})

const iconClasses = computed(() => {
  return cn(
    'w-4 h-4',
    checking.value && 'animate-spin',
    isOnline.value ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
  )
})

const statusText = computed(() => {
  if (checking.value) return '检查连接中...'
  if (isOnline.value) return '网络连接正常'
  return '网络连接断开'
})

// 方法
const updateNetworkInfo = () => {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  
  if (connection) {
    networkInfo.value = {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    }
  }
}

const handleOnline = () => {
  isOnline.value = true
  updateNetworkInfo()
  
  if (props.autoHide) {
    showStatus.value = true
    notification.success('网络连接', '网络连接已恢复')
    
    // 自动隐藏
    if (hideTimer) clearTimeout(hideTimer)
    hideTimer = setTimeout(() => {
      showStatus.value = false
    }, props.hideDelay)
  }
}

const handleOffline = () => {
  isOnline.value = false
  showStatus.value = true
  
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  
  notification.error('网络连接', '网络连接已断开', { duration: 0 })
}

const checkConnection = async () => {
  checking.value = true
  
  try {
    // 尝试发送一个简单的请求来检查连接
    const response = await fetch('/favicon.ico', {
      method: 'HEAD',
      cache: 'no-cache',
    })
    
    if (response.ok) {
      isOnline.value = true
      updateNetworkInfo()
      notification.success('连接检查', '网络连接正常')
    } else {
      throw new Error('连接检查失败')
    }
  } catch (error) {
    isOnline.value = false
    notification.error('连接检查', '网络连接仍然断开')
  } finally {
    checking.value = false
  }
}

// 生命周期
onMounted(() => {
  // 监听网络状态变化
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  // 监听连接信息变化
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  if (connection) {
    connection.addEventListener('change', updateNetworkInfo)
  }
  
  // 初始化网络信息
  updateNetworkInfo()
  
  // 如果在线且设置了自动隐藏，则延迟隐藏
  if (isOnline.value && props.autoHide) {
    hideTimer = setTimeout(() => {
      showStatus.value = false
    }, props.hideDelay)
  }
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
  
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  if (connection) {
    connection.removeEventListener('change', updateNetworkInfo)
  }
  
  if (hideTimer) {
    clearTimeout(hideTimer)
  }
})
</script>