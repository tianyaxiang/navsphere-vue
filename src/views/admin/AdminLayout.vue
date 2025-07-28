<template>
  <div class="min-h-screen bg-background">
    <!-- 顶部导航栏 -->
    <header class="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="container mx-auto px-4">
        <div class="flex h-16 items-center justify-between">
          <div class="flex items-center space-x-4">
            <!-- Logo 和标题 -->
            <div class="flex items-center space-x-3">
              <img 
                :src="siteStore.siteLogo" 
                :alt="siteStore.siteTitle"
                class="h-8 w-8 rounded"
                @error="handleLogoError"
              />
              <div>
                <h1 class="text-xl font-semibold text-foreground">
                  {{ siteStore.siteTitle }} 管理后台
                </h1>
                <p class="text-xs text-muted-foreground">
                  管理和配置您的导航站点
                </p>
              </div>
            </div>
          </div>
          
          <div class="flex items-center space-x-4">
            <!-- 系统状态指示器 -->
            <div class="flex items-center space-x-2">
              <div 
                :class="cn(
                  'w-2 h-2 rounded-full',
                  getSystemStatusColor()
                )"
                :title="getSystemStatusText()"
              />
              <span class="text-sm text-muted-foreground hidden sm:inline">
                {{ getSystemStatusText() }}
              </span>
            </div>
            
            <!-- 快捷操作 -->
            <Button
              variant="ghost"
              size="sm"
              @click="refreshAllData"
              :disabled="appStore.isLoading"
              title="刷新所有数据"
            >
              <RefreshCwIcon :class="cn('h-4 w-4', appStore.isLoading && 'animate-spin')" />
            </Button>
            
            <ThemeToggle />
            <UserProfile v-if="authStore.isAuthenticated" />
          </div>
        </div>
      </div>
    </header>

    <div class="flex">
      <!-- 侧边栏 -->
      <aside class="hidden md:flex md:w-64 md:flex-col border-r bg-muted/10">
        <div class="flex flex-col flex-grow pt-6 pb-4 overflow-y-auto">
          <!-- 用户信息卡片 -->
          <div class="px-4 mb-6">
            <div class="flex items-center space-x-3 p-3 bg-background rounded-lg border">
              <img
                :src="authStore.user?.avatar_url"
                :alt="authStore.user?.name || authStore.user?.login"
                class="h-10 w-10 rounded-full"
              />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-foreground truncate">
                  {{ authStore.user?.name || authStore.user?.login }}
                </p>
                <p class="text-xs text-muted-foreground truncate">
                  {{ authStore.isRepositoryOwner() ? '管理员' : '协作者' }}
                </p>
              </div>
            </div>
          </div>

          <!-- 导航菜单 -->
          <nav class="flex-1 px-2 space-y-1">
            <router-link
              v-for="item in navigation"
              :key="item.name"
              :to="item.href"
              :class="cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                $route.path === item.href
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )"
            >
              <component :is="item.icon" class="mr-3 h-5 w-5 flex-shrink-0" />
              <span class="truncate">{{ item.name }}</span>
              <Badge 
                v-if="item.badge" 
                variant="secondary" 
                class="ml-auto text-xs"
              >
                {{ item.badge }}
              </Badge>
            </router-link>
          </nav>

          <!-- 底部信息 -->
          <div class="px-4 pt-4 border-t">
            <div class="text-xs text-muted-foreground space-y-1">
              <div class="flex justify-between">
                <span>版本:</span>
                <span>v1.0.0</span>
              </div>
              <div class="flex justify-between">
                <span>最后同步:</span>
                <span>{{ formatLastSync() }}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- 移动端侧边栏 -->
      <div 
        v-if="showMobileSidebar"
        class="fixed inset-0 z-50 md:hidden"
        @click="showMobileSidebar = false"
      >
        <div class="fixed inset-y-0 left-0 w-64 bg-background border-r shadow-lg">
          <!-- 移动端侧边栏内容 -->
          <div class="flex flex-col h-full">
            <div class="flex items-center justify-between p-4 border-b">
              <h2 class="text-lg font-semibold">管理菜单</h2>
              <Button
                variant="ghost"
                size="sm"
                @click="showMobileSidebar = false"
              >
                <XIcon class="h-4 w-4" />
              </Button>
            </div>
            <nav class="flex-1 px-2 py-4 space-y-1">
              <router-link
                v-for="item in navigation"
                :key="item.name"
                :to="item.href"
                :class="cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  $route.path === item.href
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )"
                @click="showMobileSidebar = false"
              >
                <component :is="item.icon" class="mr-3 h-5 w-5" />
                {{ item.name }}
              </router-link>
            </nav>
          </div>
        </div>
      </div>

      <!-- 主内容区域 -->
      <main class="flex-1 min-w-0">
        <!-- 移动端顶部菜单按钮 -->
        <div class="md:hidden flex items-center justify-between p-4 border-b bg-background">
          <Button
            variant="ghost"
            size="sm"
            @click="showMobileSidebar = true"
          >
            <MenuIcon class="h-4 w-4 mr-2" />
            菜单
          </Button>
          <div class="flex items-center space-x-2">
            <div 
              :class="cn(
                'w-2 h-2 rounded-full',
                getSystemStatusColor()
              )"
            />
            <span class="text-sm text-muted-foreground">
              {{ getSystemStatusText() }}
            </span>
          </div>
        </div>

        <div class="py-6">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <ErrorBoundary>
              <RouterView />
            </ErrorBoundary>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  LayoutDashboardIcon,
  NavigationIcon,
  SettingsIcon,
  RefreshCwIcon,
  MenuIcon,
  XIcon,
} from 'lucide-vue-next'
import { ThemeToggle, ErrorBoundary, Button, Badge } from '@/components/ui'
import UserProfile from '@/components/UserProfile.vue'
import { useAuthStore, useAppStore, useNavigationStore, useSiteStore } from '@/stores'
import { notification } from '@/composables/useNotification'
import { cn } from '@/utils'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const navigationStore = useNavigationStore()
const siteStore = useSiteStore()

const showMobileSidebar = ref(false)

// 导航菜单
const navigation = computed(() => [
  {
    name: '控制台',
    href: '/admin',
    icon: LayoutDashboardIcon,
    badge: null,
  },
  {
    name: '导航管理',
    href: '/admin/navigation',
    icon: NavigationIcon,
    badge: navigationStore.totalCategories > 0 ? navigationStore.totalCategories : null,
  },
  {
    name: '站点设置',
    href: '/admin/site',
    icon: SettingsIcon,
    badge: null,
  },
])

// 系统状态
const getSystemStatusColor = () => {
  if (appStore.error || navigationStore.error || siteStore.error) {
    return 'bg-red-500'
  }
  if (appStore.isLoading || navigationStore.loading || siteStore.loading) {
    return 'bg-yellow-500'
  }
  if (!authStore.isAuthenticated) {
    return 'bg-gray-500'
  }
  return 'bg-green-500'
}

const getSystemStatusText = () => {
  if (appStore.error || navigationStore.error || siteStore.error) {
    return '系统错误'
  }
  if (appStore.isLoading || navigationStore.loading || siteStore.loading) {
    return '加载中'
  }
  if (!authStore.isAuthenticated) {
    return '未认证'
  }
  return '运行正常'
}

// 格式化最后同步时间
const formatLastSync = () => {
  const lastSync = appStore.lastSyncTime || navigationStore.lastUpdated || siteStore.lastUpdated
  if (!lastSync) return '从未'
  
  const now = new Date()
  const diff = now.getTime() - lastSync.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return lastSync.toLocaleDateString()
}

// 刷新所有数据
const refreshAllData = async () => {
  try {
    await appStore.refreshAppData()
  } catch (error) {
    // 错误已在 store 中处理
  }
}

// Logo 错误处理
const handleLogoError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/favicon.ico' // 回退到默认图标
}

onMounted(async () => {
  // 检查认证状态
  if (!authStore.isAuthenticated) {
    const isAuthenticated = await authStore.initializeAuth()
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
  }

  // 初始化应用数据
  try {
    await appStore.initializeApp()
  } catch (error) {
    console.error('初始化应用失败:', error)
    notification.error('初始化失败', '应用初始化失败，请刷新页面重试')
  }
})
</script>