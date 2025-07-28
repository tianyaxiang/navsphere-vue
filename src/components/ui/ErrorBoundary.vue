<template>
  <div v-if="hasError" :class="containerClasses">
    <div class="text-center space-y-4">
      <div class="text-destructive">
        <AlertTriangleIcon class="h-12 w-12 mx-auto mb-4" />
      </div>
      
      <div class="space-y-2">
        <h3 class="text-lg font-semibold text-foreground">
          {{ title }}
        </h3>
        <p class="text-muted-foreground">
          {{ message }}
        </p>
      </div>
      
      <div v-if="showDetails && errorDetails" class="text-left">
        <details class="mt-4">
          <summary class="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            查看详细信息
          </summary>
          <pre class="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto">{{ errorDetails }}</pre>
        </details>
      </div>
      
      <div class="flex justify-center space-x-3">
        <Button variant="outline" @click="retry" v-if="showRetry">
          <RefreshCwIcon class="h-4 w-4 mr-2" />
          重试
        </Button>
        <Button variant="outline" @click="goHome" v-if="showHome">
          <HomeIcon class="h-4 w-4 mr-2" />
          返回首页
        </Button>
        <Button variant="outline" @click="reportError" v-if="showReport">
          <BugIcon class="h-4 w-4 mr-2" />
          报告问题
        </Button>
      </div>
    </div>
  </div>
  
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, computed, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'
import { AlertTriangleIcon, RefreshCwIcon, HomeIcon, BugIcon } from 'lucide-vue-next'
import Button from './Button.vue'
import { cn } from '@/utils'

interface Props {
  title?: string
  message?: string
  showDetails?: boolean
  showRetry?: boolean
  showHome?: boolean
  showReport?: boolean
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '出现了一些问题',
  message: '页面加载时发生错误，请稍后重试。',
  showDetails: true,
  showRetry: true,
  showHome: true,
  showReport: false,
})

const emit = defineEmits<{
  error: [error: Error]
  retry: []
}>()

const router = useRouter()

const hasError = ref(false)
const errorDetails = ref<string>('')

const containerClasses = computed(() => {
  return cn(
    'flex items-center justify-center min-h-[400px] p-8',
    props.className
  )
})

onErrorCaptured((error: Error) => {
  hasError.value = true
  errorDetails.value = error.stack || error.message
  emit('error', error)
  
  // 在开发环境下打印错误
  if (import.meta.env.DEV) {
    console.error('ErrorBoundary caught an error:', error)
  }
  
  return false
})

const retry = () => {
  hasError.value = false
  errorDetails.value = ''
  emit('retry')
}

const goHome = () => {
  router.push('/')
}

const reportError = () => {
  // 这里可以实现错误报告功能
  console.log('Report error:', errorDetails.value)
}
</script>