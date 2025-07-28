<template>
  <Dialog
    :open="open"
    :title="category ? '编辑分类' : '添加分类'"
    :confirm-text="category ? '更新' : '添加'"
    :confirm-disabled="!isFormValid || isSubmitting"
    @close="$emit('close')"
    @confirm="handleSubmit"
    class-name="max-w-lg"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- 分类标题 -->
      <div class="space-y-2">
        <label class="text-sm font-medium text-foreground">
          分类标题 <span class="text-red-500">*</span>
        </label>
        <Input
          v-model="formData.title"
          placeholder="请输入分类标题"
          :class="errors.title && 'border-red-500'"
        />
        <p v-if="errors.title" class="text-sm text-red-500">
          {{ errors.title }}
        </p>
      </div>

      <!-- 英文标题 -->
      <div class="space-y-2">
        <label class="text-sm font-medium text-foreground">
          英文标题
        </label>
        <Input
          v-model="formData.titleEn"
          placeholder="请输入英文标题（可选）"
        />
      </div>

      <!-- 分类描述 -->
      <div class="space-y-2">
        <label class="text-sm font-medium text-foreground">
          分类描述
        </label>
        <Textarea
          v-model="formData.description"
          placeholder="请输入分类描述（可选）"
          :rows="3"
          :class="errors.description && 'border-red-500'"
        />
        <p v-if="errors.description" class="text-sm text-red-500">
          {{ errors.description }}
        </p>
      </div>

      <!-- 英文描述 -->
      <div class="space-y-2">
        <label class="text-sm font-medium text-foreground">
          英文描述
        </label>
        <Textarea
          v-model="formData.descriptionEn"
          placeholder="请输入英文描述（可选）"
          :rows="3"
        />
      </div>

      <!-- 分类图标 -->
      <div class="space-y-2">
        <label class="text-sm font-medium text-foreground">
          分类图标
        </label>
        <div class="flex items-center space-x-2">
          <Input
            v-model="formData.icon"
            placeholder="请输入图标（emoji 或 URL）"
            class="flex-1"
          />
          <div class="w-10 h-10 border rounded-md flex items-center justify-center bg-muted">
            <span v-if="isEmoji(formData.icon)" class="text-lg">
              {{ formData.icon }}
            </span>
            <img
              v-else-if="formData.icon"
              :src="formData.icon"
              :alt="formData.title"
              class="w-6 h-6 rounded"
              @error="handleIconError"
            />
            <FolderIcon v-else class="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
        <p class="text-xs text-muted-foreground">
          可以使用 emoji 表情符号或图标 URL
        </p>
      </div>

      <!-- 排序顺序 -->
      <div class="space-y-2">
        <label class="text-sm font-medium text-foreground">
          排序顺序
        </label>
        <Input
          v-model.number="formData.order"
          type="number"
          placeholder="数字越小排序越靠前"
          min="0"
        />
        <p class="text-xs text-muted-foreground">
          用于控制分类在导航中的显示顺序
        </p>
      </div>

      <!-- 启用状态 -->
      <div class="flex items-center justify-between">
        <div>
          <label class="text-sm font-medium text-foreground">
            启用状态
          </label>
          <p class="text-xs text-muted-foreground">
            禁用后该分类将不会在导航中显示
          </p>
        </div>
        <Switch
          v-model="formData.enabled"
          :label="formData.enabled ? '启用' : '禁用'"
        />
      </div>
    </form>

    <!-- 表单验证错误提示 -->
    <div v-if="hasErrors" class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
      <div class="flex">
        <AlertCircleIcon class="h-5 w-5 text-red-400 flex-shrink-0" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
            表单验证失败
          </h3>
          <div class="mt-2 text-sm text-red-700 dark:text-red-300">
            <ul class="list-disc list-inside space-y-1">
              <li v-for="error in Object.values(errors)" :key="error">
                {{ error }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { FolderIcon, AlertCircleIcon } from 'lucide-vue-next'
import { Dialog, Input, Textarea, Switch } from '@/components/ui'
import { validateNavigationCategory } from '@/utils/validation'
import type { NavigationCategory } from '@/types'

interface Props {
  open: boolean
  category?: NavigationCategory | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  save: [data: Partial<NavigationCategory>]
}>()

// 表单数据
const formData = ref({
  title: '',
  titleEn: '',
  description: '',
  descriptionEn: '',
  icon: '',
  order: 0,
  enabled: true,
})

// 表单验证错误
const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)

// 计算属性
const isFormValid = computed(() => {
  return formData.value.title.trim().length > 0 && Object.keys(errors.value).length === 0
})

const hasErrors = computed(() => {
  return Object.keys(errors.value).length > 0
})

// 方法
const isEmoji = (str: string): boolean => {
  if (!str) return false
  // 简单的 emoji 检测
  const emojiRegex = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]$/u
  return emojiRegex.test(str) || str.length <= 2
}

const handleIconError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

const validateForm = () => {
  errors.value = {}

  // 验证标题
  if (!formData.value.title.trim()) {
    errors.value.title = '分类标题不能为空'
  } else if (formData.value.title.length > 100) {
    errors.value.title = '分类标题长度不能超过 100 个字符'
  }

  // 验证描述长度
  if (formData.value.description && formData.value.description.length > 500) {
    errors.value.description = '分类描述长度不能超过 500 个字符'
  }

  // 验证英文描述长度
  if (formData.value.descriptionEn && formData.value.descriptionEn.length > 500) {
    errors.value.descriptionEn = '英文描述长度不能超过 500 个字符'
  }
}

const resetForm = () => {
  formData.value = {
    title: '',
    titleEn: '',
    description: '',
    descriptionEn: '',
    icon: '',
    order: 0,
    enabled: true,
  }
  errors.value = {}
  isSubmitting.value = false
}

const loadCategoryData = () => {
  if (props.category) {
    formData.value = {
      title: props.category.title || '',
      titleEn: props.category.titleEn || '',
      description: props.category.description || '',
      descriptionEn: props.category.descriptionEn || '',
      icon: props.category.icon || '',
      order: props.category.order || 0,
      enabled: props.category.enabled ?? true,
    }
  } else {
    resetForm()
  }
}

const handleSubmit = async () => {
  validateForm()
  
  if (!isFormValid.value) {
    return
  }

  isSubmitting.value = true

  try {
    // 构建保存数据
    const saveData: Partial<NavigationCategory> = {
      title: formData.value.title.trim(),
      description: formData.value.description.trim() || undefined,
      icon: formData.value.icon.trim() || undefined,
      enabled: formData.value.enabled,
      order: formData.value.order,
      updatedAt: new Date().toISOString(),
    }

    // 添加可选字段
    if (formData.value.titleEn?.trim()) {
      saveData.titleEn = formData.value.titleEn.trim()
    }
    if (formData.value.descriptionEn?.trim()) {
      saveData.descriptionEn = formData.value.descriptionEn.trim()
    }

    emit('save', saveData)
  } finally {
    isSubmitting.value = false
  }
}

// 监听表单数据变化进行实时验证
watch(
  () => formData.value,
  () => {
    if (Object.keys(errors.value).length > 0) {
      validateForm()
    }
  },
  { deep: true }
)

// 监听对话框打开状态
watch(
  () => props.open,
  (newOpen) => {
    if (newOpen) {
      nextTick(() => {
        loadCategoryData()
      })
    }
  },
  { immediate: true }
)
</script>