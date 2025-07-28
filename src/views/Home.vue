<template>
  <AppLayout>
    <!-- 主要导航内容 -->
    <NavigationContent
      :navigation-data="navigationStore.categories"
      :search-query="searchQuery"
      :search-results="searchResults"
      @clear-search="clearSearch"
    />

    <!-- 开发测试区域（可选） -->
    <div v-if="showDevTools" class="mt-12 pt-8 border-t border-border">
      <div class="text-center space-y-8">
        <div>
          <h2 class="text-2xl font-bold text-foreground mb-4">
            开发工具
          </h2>
          <p class="text-muted-foreground mb-8">
            用于测试和开发的工具组件
          </p>
        </div>

        <!-- 功能按钮 -->
        <div class="flex justify-center items-center space-x-4 flex-wrap gap-2">
          <Button @click="$router.push('/admin')">
            管理后台
          </Button>
          <Button variant="outline" @click="showDialog = true">
            测试对话框
          </Button>
          <Button variant="secondary" @click="testNotifications">
            测试通知
          </Button>
          <Button variant="outline" @click="toggleDevTools">
            隐藏开发工具
          </Button>
        </div>

        <!-- UI 组件展示 -->
        <div class="max-w-4xl mx-auto space-y-8">
          <Separator />
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- 数据统计卡片 -->
            <Card class="p-6 hover:shadow-lg transition-shadow">
              <h3 class="text-lg font-semibold mb-2">数据统计</h3>
              <p class="text-muted-foreground mb-4">
                当前导航数据统计信息
              </p>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-sm text-muted-foreground">分类数量:</span>
                  <Badge variant="outline">{{ navigationStore.totalCategories }}</Badge>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-muted-foreground">项目数量:</span>
                  <Badge variant="outline">{{ navigationStore.totalItems }}</Badge>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-muted-foreground">启用项目:</span>
                  <Badge variant="success">{{ navigationStore.enabledItems }}</Badge>
                </div>
              </div>
            </Card>

            <!-- 表单组件 -->
            <Card class="p-6">
              <h3 class="text-lg font-semibold mb-4">表单组件</h3>
              <div class="space-y-3">
                <Input v-model="inputValue" placeholder="输入框测试" />
                <div class="flex items-center space-x-2">
                  <Switch v-model="switchValue" />
                  <span class="text-sm">开关组件</span>
                </div>
                <Textarea v-model="textareaValue" placeholder="文本域测试" :rows="3" />
              </div>
            </Card>

            <!-- 状态组件 -->
            <Card class="p-6">
              <h3 class="text-lg font-semibold mb-4">状态组件</h3>
              <div class="space-y-4">
                <div class="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span class="text-sm">加载中...</span>
                </div>
                <Alert variant="success" title="成功提示" description="这是一个成功的提示信息" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>

    <!-- 显示开发工具按钮 -->
    <div v-else class="fixed bottom-4 right-4">
      <Button
        variant="outline"
        size="sm"
        @click="toggleDevTools"
        class="shadow-lg"
      >
        <SettingsIcon class="h-4 w-4 mr-1" />
        开发工具
      </Button>
    </div>

    <!-- 测试对话框 -->
    <Dialog
      :open="showDialog"
      title="测试对话框"
      @close="showDialog = false"
      @confirm="handleConfirm"
      @cancel="showDialog = false"
    >
      <p class="text-muted-foreground">
        这是一个测试对话框，展示了基于 Headless UI 的 Dialog 组件。
      </p>
    </Dialog>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { SettingsIcon } from 'lucide-vue-next'
import {
  Button,
  Card,
  Input,
  Textarea,
  Switch,
  Badge,
  LoadingSpinner,
  LoadingState,
  Alert,
  Dialog,
  Separator,
} from '@/components/ui'
import AppLayout from '@/components/layout/AppLayout.vue'
import NavigationContent from '@/components/NavigationContent.vue'
import { useNavigationStore, useSiteStore } from '@/stores'
import { notification } from '@/composables/useNotification'

const router = useRouter()
const navigationStore = useNavigationStore()
const siteStore = useSiteStore()

// 表单数据
const inputValue = ref('')
const textareaValue = ref('')
const switchValue = ref(false)

// 对话框状态
const showDialog = ref(false)

// 开发工具状态
const showDevTools = ref(false)

// 搜索状态
const searchQuery = ref('')
const searchResults = computed(() => {
  if (!searchQuery.value) return []
  return navigationStore.searchItems(searchQuery.value)
})

onMounted(async () => {
  // 数据已在 AppLayout 中加载
})

// 方法
const toggleDevTools = () => {
  showDevTools.value = !showDevTools.value
}

const clearSearch = () => {
  searchQuery.value = ''
}

// 测试通知
const testNotifications = () => {
  notification.success('成功', '这是一个成功通知')
  setTimeout(() => {
    notification.warning('警告', '这是一个警告通知')
  }, 1000)
  setTimeout(() => {
    notification.error('错误', '这是一个错误通知')
  }, 2000)
  setTimeout(() => {
    notification.info('信息', '这是一个信息通知')
  }, 3000)
}

// 处理对话框确认
const handleConfirm = () => {
  showDialog.value = false
  notification.success('确认', '对话框确认操作成功')
}
</script>