<template>
  <div class="file-upload">
    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      class="hidden"
      @change="handleFileChange"
    />
    
    <div
      v-if="dragAndDrop"
      :class="[
        'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
        isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
        disabled && 'opacity-50 cursor-not-allowed'
      ]"
      @click="triggerFileInput"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <div class="flex flex-col items-center space-y-2">
        <Upload class="w-8 h-8 text-muted-foreground" />
        <div>
          <p class="text-sm font-medium">点击上传或拖拽文件到此处</p>
          <p class="text-xs text-muted-foreground">
            支持格式: {{ acceptText }}
            <span v-if="maxSize"> (最大 {{ formatFileSize(maxSize) }})</span>
          </p>
        </div>
      </div>
    </div>
    
    <div v-else @click="triggerFileInput">
      <slot>
        <Button variant="outline" :disabled="disabled">
          <Upload class="w-4 h-4 mr-2" />
          选择文件
        </Button>
      </slot>
    </div>

    <!-- 上传进度 -->
    <div v-if="uploading" class="mt-2">
      <div class="flex items-center space-x-2">
        <LoadingSpinner class="w-4 h-4" />
        <span class="text-sm text-muted-foreground">上传中...</span>
        <span v-if="progress > 0" class="text-sm text-muted-foreground">{{ progress }}%</span>
      </div>
      <div class="w-full bg-muted rounded-full h-2 mt-1">
        <div
          class="bg-primary h-2 rounded-full transition-all duration-300"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
    </div>

    <!-- 文件列表 -->
    <div v-if="files.length > 0" class="mt-4 space-y-2">
      <div
        v-for="(file, index) in files"
        :key="index"
        class="flex items-center justify-between p-2 border rounded-lg"
      >
        <div class="flex items-center space-x-2">
          <FileIcon class="w-4 h-4 text-muted-foreground" />
          <div>
            <p class="text-sm font-medium">{{ file.name }}</p>
            <p class="text-xs text-muted-foreground">{{ formatFileSize(file.size) }}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          @click="removeFile(index)"
          :disabled="disabled || uploading"
        >
          <X class="w-4 h-4" />
        </Button>
      </div>
    </div>

    <!-- 错误信息 -->
    <div v-if="error" class="mt-2">
      <Alert variant="destructive">
        <AlertTriangle class="h-4 w-4" />
        <AlertTitle>上传失败</AlertTitle>
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Upload, X, FileIcon, AlertTriangle } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import Alert from '@/components/ui/Alert.vue'

const AlertTitle = Alert.Title
const AlertDescription = Alert.Description

interface Props {
  accept?: string
  multiple?: boolean
  maxSize?: number // bytes
  maxFiles?: number
  disabled?: boolean
  dragAndDrop?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  accept: '*/*',
  multiple: false,
  maxSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 1,
  disabled: false,
  dragAndDrop: false,
})

interface Emits {
  upload: [file: File]
  uploads: [files: File[]]
  error: [error: string]
}

const emit = defineEmits<Emits>()

// 响应式数据
const fileInput = ref<HTMLInputElement>()
const files = ref<File[]>([])
const uploading = ref(false)
const progress = ref(0)
const error = ref<string | null>(null)
const isDragOver = ref(false)

// 计算属性
const acceptText = computed(() => {
  if (props.accept === '*/*') return '所有文件'
  if (props.accept.includes('image/*')) return '图片文件'
  if (props.accept.includes('video/*')) return '视频文件'
  if (props.accept.includes('audio/*')) return '音频文件'
  return props.accept.replace(/\*/g, '').replace(/\./g, '').toUpperCase()
})

// 方法
const triggerFileInput = () => {
  if (props.disabled || uploading.value) return
  fileInput.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const selectedFiles = Array.from(target.files || [])
  processFiles(selectedFiles)
}

const handleDragOver = (event: DragEvent) => {
  if (props.disabled || uploading.value) return
  isDragOver.value = true
}

const handleDragLeave = (event: DragEvent) => {
  isDragOver.value = false
}

const handleDrop = (event: DragEvent) => {
  if (props.disabled || uploading.value) return
  
  isDragOver.value = false
  const droppedFiles = Array.from(event.dataTransfer?.files || [])
  processFiles(droppedFiles)
}

const processFiles = (selectedFiles: File[]) => {
  error.value = null
  
  // 验证文件
  const validFiles: File[] = []
  
  for (const file of selectedFiles) {
    // 检查文件大小
    if (file.size > props.maxSize) {
      error.value = `文件 "${file.name}" 超过最大大小限制 (${formatFileSize(props.maxSize)})`
      continue
    }
    
    // 检查文件类型
    if (props.accept !== '*/*' && !isFileTypeAccepted(file)) {
      error.value = `文件 "${file.name}" 类型不支持`
      continue
    }
    
    validFiles.push(file)
  }
  
  if (validFiles.length === 0) return
  
  // 检查文件数量限制
  const totalFiles = files.value.length + validFiles.length
  if (totalFiles > props.maxFiles) {
    error.value = `最多只能上传 ${props.maxFiles} 个文件`
    return
  }
  
  // 添加文件到列表
  if (props.multiple) {
    files.value.push(...validFiles)
    emit('uploads', validFiles)
  } else {
    files.value = [validFiles[0]]
    emit('upload', validFiles[0])
  }
  
  // 清空 input
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const removeFile = (index: number) => {
  files.value.splice(index, 1)
}

const isFileTypeAccepted = (file: File): boolean => {
  const acceptTypes = props.accept.split(',').map(type => type.trim())
  
  return acceptTypes.some(acceptType => {
    if (acceptType === '*/*') return true
    if (acceptType.endsWith('/*')) {
      const category = acceptType.split('/')[0]
      return file.type.startsWith(category + '/')
    }
    return file.type === acceptType || file.name.toLowerCase().endsWith(acceptType.replace('.', ''))
  })
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 暴露方法给父组件
defineExpose({
  triggerFileInput,
  clearFiles: () => {
    files.value = []
    error.value = null
  },
  files: files.value,
})
</script>

<style scoped>
.file-upload {
  width: 100%;
}

.hidden {
  display: none;
}

.space-y-2 > * + * {
  margin-top: 0.5rem;
}

.space-x-2 > * + * {
  margin-left: 0.5rem;
}

.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.items-center {
  align-items: center;
}

.justify-between {
  justify-content: space-between;
}

.text-center {
  text-align: center;
}

.transition-colors {
  transition-property: color, background-color, border-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.duration-300 {
  transition-duration: 300ms;
}

.cursor-not-allowed {
  cursor: not-allowed;
}

.opacity-50 {
  opacity: 0.5;
}

.rounded-lg {
  border-radius: 0.5rem;
}

.rounded-full {
  border-radius: 9999px;
}

.border {
  border-width: 1px;
}

.border-2 {
  border-width: 2px;
}

.border-dashed {
  border-style: dashed;
}

.p-2 {
  padding: 0.5rem;
}

.p-6 {
  padding: 1.5rem;
}

.mt-1 {
  margin-top: 0.25rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.mt-4 {
  margin-top: 1rem;
}

.w-full {
  width: 100%;
}

.h-2 {
  height: 0.5rem;
}

.text-sm {
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.text-xs {
  font-size: 0.75rem;
  line-height: 1rem;
}

.font-medium {
  font-weight: 500;
}
</style>