<template>
  <header class="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="container mx-auto px-4">
      <div class="flex h-14 items-center justify-between">
        <!-- 左侧 -->
        <div class="flex items-center space-x-4">
          <!-- 移动端菜单按钮 -->
          <Button
            variant="ghost"
            size="icon"
            class="lg:hidden"
            @click="$emit('toggle-sidebar')"
          >
            <MenuIcon class="h-5 w-5" />
          </Button>

          <!-- 面包屑导航 -->
          <nav class="hidden md:flex items-center space-x-2 text-sm">
            <router-link
              to="/"
              class="text-muted-foreground hover:text-foreground transition-colors"
            >
              {{ siteInfo?.basic?.title || 'NavSphere' }}
            </router-link>
            <ChevronRightIcon class="h-4 w-4 text-muted-foreground" />
            <span class="text-foreground font-medium">
              {{ getPageTitle() }}
            </span>
          </nav>
        </div>

        <!-- 中间搜索框 -->
        <div class="flex-1 max-w-md mx-4">
          <button
            class="w-full flex items-center px-3 py-2 text-sm text-muted-foreground bg-background border border-input rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            @click="showAdvancedSearch = true"
          >
            <SearchIcon class="h-4 w-4 mr-2" />
            <span class="flex-1 text-left">搜索导航项目...</span>
            <kbd class="text-xs bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
          </button>
        </div>

        <!-- 右侧 -->
        <div class="flex items-center space-x-2">
          <!-- 通知按钮 -->
          <Button variant="ghost" size="icon" @click="showNotifications = !showNotifications">
            <BellIcon class="h-5 w-5" />
            <span v-if="notificationCount > 0" class="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
              {{ notificationCount }}
            </span>
          </Button>

          <!-- 主题切换 -->
          <ThemeToggle class="hidden sm:flex" />

          <!-- GitHub 链接 -->
          <Button variant="ghost" size="icon" asChild>
            <a
              href="https://github.com/tianyaxiang/NavSphere"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="访问 GitHub 仓库"
            >
              <GithubIcon class="h-5 w-5" />
            </a>
          </Button>

          <!-- 用户菜单 -->
          <UserProfile v-if="authStore.isAuthenticated" />
          
          <!-- 登录按钮 -->
          <Button v-else variant="outline" size="sm" @click="$router.push('/login')">
            登录
          </Button>
        </div>
      </div>
    </div>

    <!-- 通知下拉面板 -->
    <div
      v-if="showNotifications"
      class="absolute right-4 top-full mt-2 w-80 bg-popover border border-border rounded-md shadow-lg z-50"
    >
      <div class="p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold">通知</h3>
          <Button variant="ghost" size="sm" @click="clearAllNotifications">
            全部清除
          </Button>
        </div>
        
        <div v-if="notifications.length === 0" class="text-center py-8 text-muted-foreground">
          暂无通知
        </div>
        
        <div v-else class="space-y-2 max-h-64 overflow-y-auto">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
          >
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 mt-0.5">
                <div :class="cn('w-2 h-2 rounded-full', getNotificationColor(notification.type))" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium">{{ notification.title }}</p>
                <p v-if="notification.message" class="text-sm text-muted-foreground mt-1">
                  {{ notification.message }}
                </p>
                <p class="text-xs text-muted-foreground mt-2">
                  {{ formatTime(notification.timestamp) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 高级搜索对话框 -->
    <AdvancedSearch
      :open="showAdvancedSearch"
      @close="showAdvancedSearch = false"
      @select="handleSearchSelect"
    />
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  MenuIcon,
  ChevronRightIcon,
  BellIcon,
  GithubIcon,
} from 'lucide-vue-next'
import { Button, ThemeToggle } from '@/components/ui'
import UserProfile from '@/components/UserProfile.vue'
import AdvancedSearch from '@/components/AdvancedSearch.vue'
import { useAuthStore, useNavigationStore } from '@/stores'
import { notification } from '@/composables/useNotification'
import type { SiteConfig } from '@/types'
import { cn } from '@/utils'

interface Props {
  siteInfo?: SiteConfig | null
}

defineProps<Props>()

defineEmits<{
  'toggle-sidebar': []
}>()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const navigationStore = useNavigationStore()

const showNotifications = ref(false)
const showAdvancedSearch = ref(false)
const notifications = ref<Array<{
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message?: string
  timestamp: Date
}>>([])

// 计算属性
const notificationCount = computed(() => notifications.value.length)

// 方法
const getPageTitle = () => {
  const routeTitle = route.meta?.title as string
  if (routeTitle) return routeTitle

  switch (route.name) {
    case 'Home': return '首页'
    case 'AdminDashboard': return '控制台'
    case 'NavigationManager': return '导航管理'
    case 'SiteSettings': return '站点设置'
    case 'Login': return '登录'
    default: return '页面'
  }
}

const handleSearchSelect = (item: any) => {
  // 选择搜索结果
  if (item.href) {
    window.open(item.href, '_blank')
  }
}

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'success': return 'bg-green-500'
    case 'warning': return 'bg-yellow-500'
    case 'error': return 'bg-red-500'
    default: return 'bg-blue-500'
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

const clearAllNotifications = () => {
  notifications.value = []
  showNotifications.value = false
}

// 全局快捷键
const handleGlobalKeydown = (event: KeyboardEvent) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    event.preventDefault()
    showAdvancedSearch.value = true
  }
}

// 点击外部关闭通知面板
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.notification-panel') && !target.closest('[data-notification-trigger]')) {
    showNotifications.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleGlobalKeydown)
})
</script>