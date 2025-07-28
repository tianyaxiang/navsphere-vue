<template>
  <Dialog
    :open="open"
    :title="item ? '编辑项目' : '添加项目'"
    :confirm-text="item ? '更新' : '添加'"
    :confirm-disabled="!isFormValid || isSubmitting"
    @close="$emit('close')"
    @confirm="handleSubmit"
    class-name="max-w-lg"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- 项目标题 -->
      <div class="space-y-2">
        <label class="text-sm font-medium text-foreground">
          项目标题 <span class="text-red-500">*</span>
        </label>
        <Input
          v-model="formData.title"
          placeholder="请输入项目标题"
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

      <!-- 项目描述 -->
      <div class="space-y-2">
        <label class="text-sm font-medium text-foreground">
          项目描述 <span class="text-red-500">*</span>
        </label>
        <Textarea
          v-model="formData.description"
          placeholder="请输入项目描述"
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

      <!-- 项目链接 -->
      <div class="space-y-2">
        <label class="text-sm font-medium text-foreground">
          项目链接 <span class="text-red-500">*</span>
        </label>
        <Input
          v-model="formData.href"
          type="url"
          placeholder="https://example.com"
          :class="errors.href && 'border-red-500'"
        />
        <p v-if="errors.href" class="text-sm text-red-500">
          {{ errors.href }}
        </p>
        <p class="text-xs text-muted-foreground">
          请输入完整的 URL，包含 http:// 或 https://
        </p>
      </div>

      <!-- 项目图标 -->
      <div class="space-y-2">
        <label class="text-sm font-medium text-foreground">
          项目图标 <span class="text-red-500">*</span>
        </label>
        <div class="space-y-2">
          <div class="flex items-center space-x-2">
            <Input
              v-model="formData.icon"
              placeholder="请输入图标 URL 或选择自动获取"
              class="flex-1"
              :class="errors.icon && 'border-red-500'"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              @click="autoFetchIcon"
              :disabled="!formData.href || isAutoFetching"
            >
              {{ isAutoFetching ? '获取中...' : '自动获取' }}
            </Button>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-10 h-10 border rounded-md flex items-center justify-center bg-muted">
              <img
                v-if="formData.icon"
                :src="formData.icon"
                :alt="formData.title"
                class="w-6 h-6 rounded"
                @error="handleIconError"
              />
              <LinkIcon v-else class="w-5 h-5 text-muted-foreground" />
            </div>
            <div class="text-xs text-muted-foreground">
              <p>图标预览</p>
              <p v-if="iconError" class="text-red-500">图标加载失败</p>
            </div>
          </div>
        </div>
        <p v-if="errors.icon" class="text-sm text-red-500">
          {{ errors.icon }}
        </p>
        <p class="text-xs text-muted-foreground">
          可以手动输入图标 URL，或点击"自动获取"从网站获取 favicon
        </p>
      </div>

      <!-- 标签 -->
      <div class="space-y-2">
        <label class="text-sm font-medium text-foreground">
          标签
        </label>
        <div class="space-y-2">
          <Input
            v-model="tagInput"
            placeholder="输入标签后按回车添加"
            @keydown.enter.prevent="addTag"
          />
          <div v-if="formData.tags && formData.tags.length > 0" class="flex flex-wrap gap-2">
            <Badge
              v-for="(tag, index) in formData.tags"
              :key="index"
              variant="secondary"
              class="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
              @click="removeTag(index)"
            >
              {{ tag }}
              <XIcon class="h-3 w-3 ml-1" />
            </Badge>
          </div>
        </div>
        <p class="text-xs text-muted-foreground">
          标签用于搜索和分类，点击标签可以删除
        </p>
      </div>

      <!-- 启用状态 -->
      <div class="flex items-center justify-between">
        <div>
          <label class="text-sm font-medium text-foreground">
            启用状态
          </label>
          <p class="text-xs text-muted-foreground">
            禁用后该项目将不会在导航中显示
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
import { LinkIcon, AlertCircleIcon, XIcon } from 'lucide-vue-next'
import { Dialog, Input, Textarea, Switch, Button, Badge } from '@/components/ui'
import { validateNavigationItem, validateUrl } from '@/utils/validation'
import { notification } from '@/composables/useNotification'
import type { NavigationSubItem } from '@/types'

interface Props {
  open: boolean
  categoryId: string
  item?: NavigationSubItem | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  save: [data: Partial<NavigationSubItem>]
}>()

// 表单数据
const formData = ref({
  title: '',
  titleEn: '',
  description: '',
  descriptionEn: '',
  href: '',
  icon: '',
  tags: [] as string[],
  enabled: true,
})

// 表单状态
const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)
const isAutoFetching = ref(false)
const iconError = ref(false)
const tagInput = ref('')

// 计算属性
const isFormValid = computed(() => {
  return (
    formData.value.title.trim().length > 0 &&
    formData.value.description.trim().length > 0 &&
    formData.value.href.trim().length > 0 &&
    formData.value.icon.trim().length > 0 &&
    Object.keys(errors.value).length === 0
  )
})

const hasErrors = computed(() => {
  return Object.keys(errors.value).length > 0
})

// 方法
const validateForm = () => {
  errors.value = {}

  // 验证标题
  if (!formData.value.title.trim()) {
    errors.value.title = '项目标题不能为空'
  } else if (formData.value.title.length > 100) {
    errors.value.title = '项目标题长度不能超过 100 个字符'
  }

  // 验证描述
  if (!formData.value.description.trim()) {
    errors.value.description = '项目描述不能为空'
  } else if (formData.value.description.length > 500) {
    errors.value.description = '项目描述长度不能超过 500 个字符'
  }

  // 验证链接
  if (!formData.value.href.trim()) {
    errors.value.href = '项目链接不能为空'
  } else if (!validateUrl(formData.value.href)) {
    errors.value.href = '请输入有效的 URL 地址'
  }

  // 验证图标
  if (!formData.value.icon.trim()) {
    errors.value.icon = '项目图标不能为空'
  } else if (!validateUrl(formData.value.icon)) {
    errors.value.icon = '请输入有效的图标 URL'
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
    href: '',
    icon: '',
    tags: [],
    enabled: true,
  }
  errors.value = {}
  isSubmitting.value = false
  iconError.value = false
  tagInput.value = ''
}

const loadItemData = () => {
  if (props.item) {
    formData.value = {
      title: props.item.title || '',
      titleEn: props.item.titleEn || '',
      description: props.item.description || '',
      descriptionEn: props.item.descriptionEn || '',
      href: props.item.href || '',
      icon: props.item.icon || '',
      tags: props.item.tags ? [...props.item.tags] : [],
      enabled: props.item.enabled ?? true,
    }
  } else {
    resetForm()
  }
}

const autoFetchIcon = async () => {
  if (!formData.value.href) {
    notification.warning('提示', '请先输入项目链接')
    return
  }

  isAutoFetching.value = true
  
  try {
    const url = new URL(formData.value.href)
    const faviconUrl = `${url.protocol}//${url.hostname}/favicon.ico`
    
    // 测试图标是否可访问
    const img = new Image()
    img.onload = () => {
      formData.value.icon = faviconUrl
      iconError.value = false
      notification.success('获取成功', '图标已自动获取')
    }
    img.onerror = () => {
      // 尝试其他常见的 favicon 路径
      const altFaviconUrl = `${url.protocol}//${url.hostname}/favicon.png`
      const altImg = new Image()
      altImg.onload = () => {
        formData.value.icon = altFaviconUrl
        iconError.value = false
        notification.success('获取成功', '图标已自动获取')
      }
      altImg.onerror = () => {
        notification.warning('获取失败', '无法自动获取网站图标，请手动输入')
      }
      altImg.src = altFaviconUrl
    }
    img.src = faviconUrl
  } catch (error) {
    notification.error('获取失败', '链接格式不正确')
  } finally {
    isAutoFetching.value = false
  }
}

const handleIconError = () => {
  iconError.value = true
}

const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !formData.value.tags.includes(tag)) {
    formData.value.tags.push(tag)
    tagInput.value = ''
  }
}

const removeTag = (index: number) => {
  formData.value.tags.splice(index, 1)
}

const handleSubmit = async () => {
  validateForm()
  
  if (!isFormValid.value) {
    return
  }

  isSubmitting.value = true

  try {
    // 构建保存数据
    const saveData: Partial<NavigationSubItem> = {
      title: formData.value.title.trim(),
      description: formData.value.description.trim(),
      href: formData.value.href.trim(),
      icon: formData.value.icon.trim(),
      enabled: formData.value.enabled,
      tags: formData.value.tags.length > 0 ? formData.value.tags : undefined,
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
    iconError.value = false
  },
  { deep: true }
)

// 监听对话框打开状态
watch(
  () => props.open,
  (newOpen) => {
    if (newOpen) {
      nextTick(() => {
        loadItemData()
      })
    }
  },
  { immediate: true }
)
</script>