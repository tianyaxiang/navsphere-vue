<template>
  <div v-if="hasErrors || hasWarnings" :class="containerClasses">
    <!-- 错误列表 -->
    <div v-if="errors.length > 0" class="space-y-2">
      <div class="flex items-center text-destructive mb-2">
        <XCircleIcon class="w-4 h-4 mr-2" />
        <span class="font-medium text-sm">
          {{ errors.length }} 个错误需要修复
        </span>
      </div>
      
      <ul class="space-y-1">
        <li
          v-for="(error, index) in errors"
          :key="`error-${index}`"
          class="flex items-start text-sm"
        >
          <div class="w-1 h-1 rounded-full bg-destructive mt-2 mr-2 flex-shrink-0" />
          <div class="flex-1">
            <span v-if="error.field" class="font-medium">{{ getFieldLabel(error.field) }}: </span>
            <span>{{ error.message }}</span>
            <span v-if="showCodes && error.code" class="ml-2 text-xs text-muted-foreground">
              ({{ error.code }})
            </span>
          </div>
        </li>
      </ul>
    </div>

    <!-- 警告列表 -->
    <div v-if="warnings.length > 0" :class="cn(errors.length > 0 && 'mt-4')">
      <div class="flex items-center text-orange-600 dark:text-orange-400 mb-2">
        <AlertTriangleIcon class="w-4 h-4 mr-2" />
        <span class="font-medium text-sm">
          {{ warnings.length }} 个警告
        </span>
      </div>
      
      <ul class="space-y-1">
        <li
          v-for="(warning, index) in warnings"
          :key="`warning-${index}`"
          class="flex items-start text-sm text-orange-700 dark:text-orange-300"
        >
          <div class="w-1 h-1 rounded-full bg-orange-500 mt-2 mr-2 flex-shrink-0" />
          <div class="flex-1">
            <span v-if="warning.field" class="font-medium">{{ getFieldLabel(warning.field) }}: </span>
            <span>{{ warning.message }}</span>
          </div>
        </li>
      </ul>
    </div>

    <!-- 操作按钮 -->
    <div v-if="showActions" class="mt-4 flex flex-wrap gap-2">
      <Button
        v-if="showClear"
        variant="outline"
        size="sm"
        @click="clearAll"
      >
        <XIcon class="w-3 h-3 mr-1" />
        清除
      </Button>
      
      <Button
        v-if="showExport"
        variant="outline"
        size="sm"
        @click="exportErrors"
      >
        <DownloadIcon class="w-3 h-3 mr-1" />
        导出
      </Button>
      
      <Button
        v-if="showHelp"
        variant="outline"
        size="sm"
        @click="showHelp"
      >
        <HelpCircleIcon class="w-3 h-3 mr-1" />
        帮助
      </Button>
    </div>

    <!-- 统计信息 -->
    <div v-if="showStats" class="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
      <div class="flex justify-between">
        <span>总计: {{ totalIssues }} 个问题</span>
        <span v-if="lastUpdated">更新: {{ formatTime(lastUpdated) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  XCircleIcon,
  AlertTriangleIcon,
  XIcon,
  DownloadIcon,
  HelpCircleIcon,
} from 'lucide-vue-next'
import { cn } from '@/utils'
import Button from './Button.vue'
import { notification } from '@/composables/useNotification'

interface ValidationError {
  field: string
  message: string
  code?: string
  severity?: 'error' | 'warning'
}

interface Props {
  errors?: ValidationError[]
  warnings?: ValidationError[]
  fieldLabels?: Record<string, string>
  showCodes?: boolean
  showActions?: boolean
  showClear?: boolean
  showExport?: boolean
  showHelp?: boolean
  showStats?: boolean
  lastUpdated?: Date
  variant?: 'default' | 'compact'
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  errors: () => [],
  warnings: () => [],
  fieldLabels: () => ({}),
  showCodes: false,
  showActions: true,
  showClear: true,
  showExport: false,
  showHelp: false,
  showStats: false,
  variant: 'default',
})

const emit = defineEmits<{
  clear: []
  export: [data: { errors: ValidationError[]; warnings: ValidationError[] }]
  help: []
}>()

// 计算属性
const hasErrors = computed(() => props.errors.length > 0)
const hasWarnings = computed(() => props.warnings.length > 0)
const totalIssues = computed(() => props.errors.length + props.warnings.length)

const containerClasses = computed(() => {
  const baseClasses = 'rounded-lg border p-4'
  
  if (props.variant === 'compact') {
    return cn(baseClasses, 'p-3', props.className)
  }
  
  if (hasErrors.value) {
    return cn(
      baseClasses,
      'bg-destructive/5 border-destructive/20',
      props.className
    )
  } else if (hasWarnings.value) {
    return cn(
      baseClasses,
      'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800',
      props.className
    )
  }
  
  return cn(baseClasses, props.className)
})

// 方法
const getFieldLabel = (field: string): string => {
  return props.fieldLabels[field] || field
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const clearAll = () => {
  emit('clear')
}

const exportErrors = () => {
  const data = {
    errors: props.errors,
    warnings: props.warnings,
  }
  
  emit('export', data)
  
  // 也可以直接导出为文件
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `validation-errors-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    notification.success('导出成功', '验证错误已导出到文件')
  } catch (error) {
    console.error('导出失败:', error)
    notification.error('导出失败', '无法导出验证错误')
  }
}

const showHelpDialog = () => {
  emit('help')
}
</script>