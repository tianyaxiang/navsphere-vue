<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-foreground">站点设置</h2>
        <p class="text-muted-foreground">
          配置站点基本信息、外观设置和功能选项
        </p>
      </div>
      <div class="flex items-center space-x-2">
        <Button
          variant="outline"
          @click="handleReset"
          :disabled="loading"
        >
          重置为默认
        </Button>
        <Button
          @click="handleSave"
          :disabled="loading || !hasChanges"
        >
          <LoadingSpinner v-if="loading" class="w-4 h-4 mr-2" />
          保存设置
        </Button>
      </div>
    </div>

    <!-- 错误提示 -->
    <Alert v-if="error" variant="destructive" class="mb-6">
      <AlertTriangle class="h-4 w-4" />
      <AlertTitle>保存失败</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- 设置表单 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧表单区域 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 基本信息 -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center">
              <Settings class="w-5 h-5 mr-2" />
              基本信息
            </CardTitle>
            <CardDescription>
              配置站点的基本信息，包括标题、描述和关键词
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium">站点标题</label>
                <Input
                  v-model="formData.basic.title"
                  placeholder="请输入站点标题"
                  :disabled="loading"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">英文标题</label>
                <Input
                  v-model="formData.basic.titleEn"
                  placeholder="Site Title (English)"
                  :disabled="loading"
                />
              </div>
            </div>
            
            <div class="space-y-2">
              <label class="text-sm font-medium">站点描述</label>
              <Textarea
                v-model="formData.basic.description"
                placeholder="请输入站点描述"
                :rows="3"
                :disabled="loading"
              />
            </div>
            
            <div class="space-y-2">
              <label class="text-sm font-medium">英文描述</label>
              <Textarea
                v-model="formData.basic.descriptionEn"
                placeholder="Site Description (English)"
                :rows="3"
                :disabled="loading"
              />
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium">关键词</label>
                <Input
                  v-model="formData.basic.keywords"
                  placeholder="关键词1,关键词2,关键词3"
                  :disabled="loading"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">英文关键词</label>
                <Input
                  v-model="formData.basic.keywordsEn"
                  placeholder="keyword1,keyword2,keyword3"
                  :disabled="loading"
                />
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium">作者</label>
                <Input
                  v-model="formData.basic.author"
                  placeholder="请输入作者名称"
                  :disabled="loading"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">邮箱</label>
                <Input
                  v-model="formData.basic.email"
                  type="email"
                  placeholder="请输入邮箱地址"
                  :disabled="loading"
                />
              </div>
            </div>
            
            <div class="space-y-2">
              <label class="text-sm font-medium">站点 URL</label>
              <Input
                v-model="formData.basic.url"
                type="url"
                placeholder="https://example.com"
                :disabled="loading"
              />
            </div>
          </CardContent>
        </Card>

        <!-- 外观设置 -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center">
              <Palette class="w-5 h-5 mr-2" />
              外观设置
            </CardTitle>
            <CardDescription>
              配置站点的视觉外观，包括 Logo、图标和主题
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <!-- Logo 上传 -->
            <div class="space-y-2">
              <label class="text-sm font-medium">站点 Logo</label>
              <div class="flex items-center space-x-4">
                <div class="flex-shrink-0">
                  <img
                    :src="formData.appearance.logo || '/favicon.ico'"
                    alt="Logo"
                    class="w-16 h-16 object-contain border rounded-lg bg-muted"
                    @error="handleImageError"
                  />
                </div>
                <div class="flex-1 space-y-2">
                  <Input
                    v-model="formData.appearance.logo"
                    placeholder="请输入 Logo URL 或上传文件"
                    :disabled="loading"
                  />
                  <FileUpload
                    accept="image/*"
                    @upload="handleLogoUpload"
                    :disabled="loading"
                  >
                    <Button variant="outline" size="sm" :disabled="loading">
                      <Upload class="w-4 h-4 mr-2" />
                      上传 Logo
                    </Button>
                  </FileUpload>
                </div>
              </div>
            </div>

            <!-- Favicon 上传 -->
            <div class="space-y-2">
              <label class="text-sm font-medium">站点图标 (Favicon)</label>
              <div class="flex items-center space-x-4">
                <div class="flex-shrink-0">
                  <img
                    :src="formData.appearance.favicon || '/favicon.ico'"
                    alt="Favicon"
                    class="w-8 h-8 object-contain border rounded bg-muted"
                    @error="handleImageError"
                  />
                </div>
                <div class="flex-1 space-y-2">
                  <Input
                    v-model="formData.appearance.favicon"
                    placeholder="请输入 Favicon URL 或上传文件"
                    :disabled="loading"
                  />
                  <FileUpload
                    accept="image/*"
                    @upload="handleFaviconUpload"
                    :disabled="loading"
                  >
                    <Button variant="outline" size="sm" :disabled="loading">
                      <Upload class="w-4 h-4 mr-2" />
                      上传图标
                    </Button>
                  </FileUpload>
                </div>
              </div>
            </div>

            <!-- 主题设置 -->
            <div class="space-y-2">
              <label class="text-sm font-medium">默认主题</label>
              <div class="flex space-x-2">
                <Button
                  v-for="theme in themes"
                  :key="theme.value"
                  :variant="formData.appearance.theme === theme.value ? 'default' : 'outline'"
                  size="sm"
                  @click="formData.appearance.theme = theme.value"
                  :disabled="loading"
                >
                  <component :is="theme.icon" class="w-4 h-4 mr-2" />
                  {{ theme.label }}
                </Button>
              </div>
            </div>

            <!-- 颜色设置 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium">主色调</label>
                <Input
                  v-model="formData.appearance.primaryColor"
                  type="color"
                  :disabled="loading"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">强调色</label>
                <Input
                  v-model="formData.appearance.accentColor"
                  type="color"
                  :disabled="loading"
                />
              </div>
            </div>

            <!-- 字体设置 -->
            <div class="space-y-2">
              <label class="text-sm font-medium">字体族</label>
              <Input
                v-model="formData.appearance.fontFamily"
                placeholder="例如: Inter, system-ui, sans-serif"
                :disabled="loading"
              />
            </div>

            <!-- 自定义 CSS -->
            <div class="space-y-2">
              <label class="text-sm font-medium">自定义 CSS</label>
              <Textarea
                v-model="formData.appearance.customCss"
                placeholder="/* 自定义 CSS 样式 */"
                :rows="4"
                :disabled="loading"
              />
            </div>
          </CardContent>
        </Card>

        <!-- SEO 设置 -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center">
              <Search class="w-5 h-5 mr-2" />
              SEO 设置
            </CardTitle>
            <CardDescription>
              配置搜索引擎优化相关设置
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium">启用 SEO 优化</label>
                <p class="text-xs text-muted-foreground">开启后将生成 meta 标签和结构化数据</p>
              </div>
              <Switch
                v-model="formData.seo.enableSeo"
                :disabled="loading"
              />
            </div>

            <template v-if="formData.seo.enableSeo">
              <div class="space-y-2">
                <label class="text-sm font-medium">OG 图片</label>
                <Input
                  v-model="formData.seo.ogImage"
                  placeholder="https://example.com/og-image.jpg"
                  :disabled="loading"
                />
              </div>

              <div class="space-y-2">
                <label class="text-sm font-medium">Twitter Card 类型</label>
                <select
                  v-model="formData.seo.twitterCard"
                  class="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  :disabled="loading"
                >
                  <option value="">请选择</option>
                  <option value="summary">Summary</option>
                  <option value="summary_large_image">Summary Large Image</option>
                </select>
              </div>

              <div class="space-y-2">
                <label class="text-sm font-medium">Google Analytics ID</label>
                <Input
                  v-model="formData.seo.googleAnalytics"
                  placeholder="G-XXXXXXXXXX"
                  :disabled="loading"
                />
              </div>

              <div class="space-y-2">
                <label class="text-sm font-medium">百度统计 ID</label>
                <Input
                  v-model="formData.seo.baiduAnalytics"
                  placeholder="百度统计代码"
                  :disabled="loading"
                />
              </div>
            </template>
          </CardContent>
        </Card>

        <!-- 功能设置 -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center">
              <Zap class="w-5 h-5 mr-2" />
              功能设置
            </CardTitle>
            <CardDescription>
              配置站点功能开关
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <label class="text-sm font-medium">搜索功能</label>
                  <p class="text-xs text-muted-foreground">启用站点内搜索功能</p>
                </div>
                <Switch
                  v-model="formData.features.enableSearch"
                  :disabled="loading"
                />
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <label class="text-sm font-medium">主题切换</label>
                  <p class="text-xs text-muted-foreground">允许用户切换明暗主题</p>
                </div>
                <Switch
                  v-model="formData.features.enableThemeToggle"
                  :disabled="loading"
                />
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <label class="text-sm font-medium">多语言支持</label>
                  <p class="text-xs text-muted-foreground">启用国际化功能</p>
                </div>
                <Switch
                  v-model="formData.features.enableI18n"
                  :disabled="loading"
                />
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <label class="text-sm font-medium">PWA 支持</label>
                  <p class="text-xs text-muted-foreground">启用渐进式 Web 应用功能</p>
                </div>
                <Switch
                  v-model="formData.features.enablePwa"
                  :disabled="loading"
                />
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <label class="text-sm font-medium">评论功能</label>
                  <p class="text-xs text-muted-foreground">启用页面评论功能</p>
                </div>
                <Switch
                  v-model="formData.features.enableComments"
                  :disabled="loading"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- 右侧预览区域 -->
      <div class="space-y-6">
        <!-- 预览卡片 -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center">
              <Eye class="w-5 h-5 mr-2" />
              预览
            </CardTitle>
            <CardDescription>
              实时预览站点设置效果
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <!-- 站点信息预览 -->
              <div class="p-4 border rounded-lg bg-muted/50">
                <div class="flex items-center space-x-3 mb-3">
                  <img
                    :src="formData.appearance.logo || '/favicon.ico'"
                    alt="Logo"
                    class="w-8 h-8 object-contain"
                    @error="handleImageError"
                  />
                  <div>
                    <h3 class="font-semibold text-sm">{{ formData.basic.title || '站点标题' }}</h3>
                    <p class="text-xs text-muted-foreground">{{ formData.basic.description || '站点描述' }}</p>
                  </div>
                </div>
                <div class="text-xs text-muted-foreground">
                  <p>关键词: {{ formData.basic.keywords || '暂无' }}</p>
                  <p>作者: {{ formData.basic.author || '暂无' }}</p>
                </div>
              </div>

              <!-- 主题预览 -->
              <div class="p-4 border rounded-lg">
                <h4 class="text-sm font-medium mb-2">主题预览</h4>
                <div class="flex items-center space-x-2">
                  <div
                    class="w-4 h-4 rounded-full border"
                    :style="{ backgroundColor: formData.appearance.primaryColor || '#3b82f6' }"
                  ></div>
                  <span class="text-xs">主色调</span>
                  <div
                    class="w-4 h-4 rounded-full border"
                    :style="{ backgroundColor: formData.appearance.accentColor || '#10b981' }"
                  ></div>
                  <span class="text-xs">强调色</span>
                </div>
                <p class="text-xs text-muted-foreground mt-2">
                  当前主题: {{ themes.find(t => t.value === formData.appearance.theme)?.label }}
                </p>
              </div>

              <!-- 功能状态 -->
              <div class="p-4 border rounded-lg">
                <h4 class="text-sm font-medium mb-2">功能状态</h4>
                <div class="space-y-1">
                  <div class="flex items-center justify-between text-xs">
                    <span>搜索</span>
                    <Badge :variant="formData.features.enableSearch ? 'default' : 'secondary'">
                      {{ formData.features.enableSearch ? '启用' : '禁用' }}
                    </Badge>
                  </div>
                  <div class="flex items-center justify-between text-xs">
                    <span>主题切换</span>
                    <Badge :variant="formData.features.enableThemeToggle ? 'default' : 'secondary'">
                      {{ formData.features.enableThemeToggle ? '启用' : '禁用' }}
                    </Badge>
                  </div>
                  <div class="flex items-center justify-between text-xs">
                    <span>多语言</span>
                    <Badge :variant="formData.features.enableI18n ? 'default' : 'secondary'">
                      {{ formData.features.enableI18n ? '启用' : '禁用' }}
                    </Badge>
                  </div>
                  <div class="flex items-center justify-between text-xs">
                    <span>SEO</span>
                    <Badge :variant="formData.seo.enableSeo ? 'default' : 'secondary'">
                      {{ formData.seo.enableSeo ? '启用' : '禁用' }}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- 操作历史 -->
        <Card v-if="lastUpdated">
          <CardHeader>
            <CardTitle class="flex items-center">
              <Clock class="w-5 h-5 mr-2" />
              更新信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-sm text-muted-foreground">
              <p>最后更新: {{ formatDate(lastUpdated) }}</p>
              <p v-if="hasChanges" class="text-orange-600">有未保存的更改</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
<scr
ipt setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { 
  Settings, 
  Palette, 
  Search, 
  Zap, 
  Eye, 
  Clock, 
  Upload, 
  Sun, 
  Moon, 
  Monitor,
  AlertTriangle
} from 'lucide-vue-next'
import { useSiteStore } from '@/stores/site'
import { notification } from '@/composables/useNotification'
import type { SiteConfig } from '@/types'
import { DEFAULT_SITE_CONFIG } from '@/types/constants'

// UI Components
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Textarea from '@/components/ui/Textarea.vue'
import Switch from '@/components/ui/Switch.vue'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import Alert from '@/components/ui/Alert.vue'
import FileUpload from '@/components/FileUpload.vue'

// Card components
const CardHeader = Card.Header
const CardTitle = Card.Title
const CardDescription = Card.Description
const CardContent = Card.Content

// Alert components  
const AlertTitle = Alert.Title
const AlertDescription = Alert.Description

// Store
const siteStore = useSiteStore()

// 响应式数据
const loading = ref(false)
const error = ref<string | null>(null)
const originalData = ref<SiteConfig | null>(null)

// 表单数据
const formData = reactive<SiteConfig>({
  basic: {
    title: '',
    titleEn: '',
    description: '',
    descriptionEn: '',
    keywords: '',
    keywordsEn: '',
    author: '',
    email: '',
    url: '',
  },
  appearance: {
    logo: '',
    favicon: '',
    theme: 'system',
    primaryColor: '#3b82f6',
    accentColor: '#10b981',
    fontFamily: '',
    customCss: '',
  },
  seo: {
    enableSeo: false,
    ogImage: '',
    twitterCard: '',
    googleAnalytics: '',
    baiduAnalytics: '',
  },
  features: {
    enableSearch: true,
    enableThemeToggle: true,
    enableI18n: false,
    enablePwa: false,
    enableComments: false,
  },
})

// 主题选项
const themes = [
  { value: 'light', label: '浅色', icon: Sun },
  { value: 'dark', label: '深色', icon: Moon },
  { value: 'system', label: '跟随系统', icon: Monitor },
]

// 计算属性
const hasChanges = computed(() => {
  if (!originalData.value) return false
  return JSON.stringify(formData) !== JSON.stringify(originalData.value)
})

const lastUpdated = computed(() => siteStore.lastUpdated)

// 方法
const loadSiteConfig = async () => {
  try {
    loading.value = true
    error.value = null
    
    await siteStore.loadSiteConfig()
    
    if (siteStore.config) {
      // 深拷贝配置数据
      const config = JSON.parse(JSON.stringify(siteStore.config))
      Object.assign(formData, config)
      originalData.value = JSON.parse(JSON.stringify(config))
    } else {
      // 使用默认配置
      const defaultConfig = {
        ...DEFAULT_SITE_CONFIG,
        seo: {
          enableSeo: false,
          ogImage: '',
          twitterCard: '',
          googleAnalytics: '',
          baiduAnalytics: '',
        },
        features: {
          enableSearch: true,
          enableThemeToggle: true,
          enableI18n: false,
          enablePwa: false,
          enableComments: false,
        },
      }
      Object.assign(formData, defaultConfig)
      originalData.value = JSON.parse(JSON.stringify(defaultConfig))
    }
  } catch (err: any) {
    console.error('加载站点配置失败:', err)
    error.value = err.message || '加载站点配置失败'
    notification.error('加载失败', error.value)
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  try {
    loading.value = true
    error.value = null
    
    // 验证表单数据
    const validation = validateFormData()
    if (!validation.valid) {
      error.value = validation.errors.join(', ')
      return
    }
    
    // 保存配置
    await siteStore.updateConfig(formData)
    
    // 更新原始数据
    originalData.value = JSON.parse(JSON.stringify(formData))
    
    notification.success('保存成功', '站点设置已更新')
  } catch (err: any) {
    console.error('保存站点设置失败:', err)
    error.value = err.message || '保存站点设置失败'
    notification.error('保存失败', error.value)
  } finally {
    loading.value = false
  }
}

const handleReset = async () => {
  if (!confirm('确定要重置为默认设置吗？这将丢失所有自定义配置。')) {
    return
  }
  
  try {
    loading.value = true
    error.value = null
    
    await siteStore.resetToDefault()
    await loadSiteConfig()
    
    notification.success('重置成功', '站点设置已重置为默认值')
  } catch (err: any) {
    console.error('重置失败:', err)
    error.value = err.message || '重置失败'
    notification.error('重置失败', error.value)
  } finally {
    loading.value = false
  }
}

const handleLogoUpload = async (file: File) => {
  try {
    loading.value = true
    const url = await uploadFile(file)
    formData.appearance.logo = url
    notification.success('上传成功', 'Logo 已更新')
  } catch (err: any) {
    console.error('Logo 上传失败:', err)
    notification.error('上传失败', err.message || 'Logo 上传失败')
  } finally {
    loading.value = false
  }
}

const handleFaviconUpload = async (file: File) => {
  try {
    loading.value = true
    const url = await uploadFile(file)
    formData.appearance.favicon = url
    notification.success('上传成功', 'Favicon 已更新')
  } catch (err: any) {
    console.error('Favicon 上传失败:', err)
    notification.error('上传失败', err.message || 'Favicon 上传失败')
  } finally {
    loading.value = false
  }
}

const uploadFile = async (file: File): Promise<string> => {
  // 这里应该实现文件上传逻辑
  // 可以上传到 GitHub、CDN 或其他存储服务
  // 暂时返回一个本地 URL 作为示例
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      resolve(result)
    }
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    reader.readAsDataURL(file)
  })
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/favicon.ico'
}

const validateFormData = () => {
  const errors: string[] = []
  
  // 基本信息验证
  if (!formData.basic.title?.trim()) {
    errors.push('站点标题不能为空')
  }
  
  if (!formData.basic.description?.trim()) {
    errors.push('站点描述不能为空')
  }
  
  // URL 验证
  if (formData.basic.url && !isValidUrl(formData.basic.url)) {
    errors.push('站点 URL 格式无效')
  }
  
  // 邮箱验证
  if (formData.basic.email && !isValidEmail(formData.basic.email)) {
    errors.push('邮箱格式无效')
  }
  
  // 外观设置验证
  if (!['light', 'dark', 'system'].includes(formData.appearance.theme)) {
    errors.push('主题设置无效')
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const formatDate = (date: Date | null): string => {
  if (!date) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

// 监听表单变化，自动清除错误
watch(formData, () => {
  if (error.value) {
    error.value = null
  }
}, { deep: true })

// 组件挂载时加载数据
onMounted(() => {
  loadSiteConfig()
})
</script>

<style scoped>
/* 自定义样式 */
.grid {
  display: grid;
}

.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (min-width: 768px) {
  .md\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .lg\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  
  .lg\:col-span-2 {
    grid-column: span 2 / span 2;
  }
}

.space-y-2 > * + * {
  margin-top: 0.5rem;
}

.space-y-4 > * + * {
  margin-top: 1rem;
}

.space-y-6 > * + * {
  margin-top: 1.5rem;
}

.space-x-2 > * + * {
  margin-left: 0.5rem;
}

.space-x-3 > * + * {
  margin-left: 0.75rem;
}

.space-x-4 > * + * {
  margin-left: 1rem;
}

.gap-4 {
  gap: 1rem;
}

.gap-6 {
  gap: 1.5rem;
}
</style>