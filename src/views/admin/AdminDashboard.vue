<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-bold text-foreground">管理控制台</h2>
        <p class="text-muted-foreground mt-1">
          欢迎使用 {{ siteStore.siteTitle }} 管理后台，管理您的导航站点
        </p>
      </div>
      <div class="flex items-center space-x-2">
        <Badge :variant="getOverallStatusVariant()">
          {{ getOverallStatusText() }}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          @click="refreshAllData"
          :disabled="isRefreshing"
        >
          <RefreshCwIcon :class="cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')" />
          刷新全部
        </Button>
      </div>
    </div>

    <!-- 统计概览卡片 -->
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <!-- 导航分类统计 -->
      <Card class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">导航分类</p>
            <div class="flex items-baseline space-x-2">
              <p class="text-2xl font-bold">{{ navigationStore.totalCategories }}</p>
              <p class="text-sm text-muted-foreground">
                ({{ navigationStore.enabledCategories.length }} 启用)
              </p>
            </div>
          </div>
          <div class="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <FolderIcon class="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div class="mt-4">
          <div class="flex items-center text-sm">
            <TrendingUpIcon class="h-4 w-4 text-green-500 mr-1" />
            <span class="text-green-600 dark:text-green-400">
              {{ Math.round((navigationStore.enabledCategories.length / Math.max(navigationStore.totalCategories, 1)) * 100) }}% 启用率
            </span>
          </div>
        </div>
      </Card>

      <!-- 导航项目统计 -->
      <Card class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">导航项目</p>
            <div class="flex items-baseline space-x-2">
              <p class="text-2xl font-bold">{{ navigationStore.totalItems }}</p>
              <p class="text-sm text-muted-foreground">
                ({{ navigationStore.enabledItems }} 启用)
              </p>
            </div>
          </div>
          <div class="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
            <LinkIcon class="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div class="mt-4">
          <div class="flex items-center text-sm">
            <TrendingUpIcon class="h-4 w-4 text-green-500 mr-1" />
            <span class="text-green-600 dark:text-green-400">
              {{ Math.round((navigationStore.enabledItems / Math.max(navigationStore.totalItems, 1)) * 100) }}% 启用率
            </span>
          </div>
        </div>
      </Card>

      <!-- 系统状态 -->
      <Card class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">系统状态</p>
            <p class="text-2xl font-bold">{{ getSystemHealthScore() }}%</p>
          </div>
          <div class="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
            <ActivityIcon class="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        <div class="mt-4">
          <div class="flex items-center text-sm">
            <div :class="cn('h-2 w-2 rounded-full mr-2', getSystemStatusColor())" />
            <span :class="getSystemStatusTextColor()">
              {{ getSystemStatusText() }}
            </span>
          </div>
        </div>
      </Card>

      <!-- 最后更新时间 -->
      <Card class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">最后同步</p>
            <p class="text-2xl font-bold">{{ formatLastUpdate() }}</p>
          </div>
          <div class="h-12 w-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
            <ClockIcon class="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
        <div class="mt-4">
          <div class="flex items-center text-sm">
            <CalendarIcon class="h-4 w-4 text-muted-foreground mr-1" />
            <span class="text-muted-foreground">
              {{ getLastUpdateDetails() }}
            </span>
          </div>
        </div>
      </Card>
    </div>

    <!-- 用户信息和快捷操作 -->
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <!-- 用户信息卡片 -->
      <Card class="p-6">
        <div class="flex items-center space-x-4 mb-4">
          <img
            :src="authStore.user?.avatar_url"
            :alt="authStore.user?.name || authStore.user?.login"
            class="h-12 w-12 rounded-full ring-2 ring-border"
          />
          <div>
            <h3 class="text-lg font-semibold">
              {{ authStore.user?.name || authStore.user?.login }}
            </h3>
            <p class="text-sm text-muted-foreground">
              {{ authStore.user?.email || `@${authStore.user?.login}` }}
            </p>
          </div>
        </div>
        
        <div class="space-y-3">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">权限级别:</span>
            <Badge :variant="authStore.isRepositoryOwner() ? 'default' : 'secondary'">
              {{ authStore.isRepositoryOwner() ? '管理员' : '协作者' }}
            </Badge>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">GitHub ID:</span>
            <span class="font-mono">{{ authStore.user?.id }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">公开仓库:</span>
            <span>{{ authStore.user?.public_repos }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">关注者:</span>
            <span>{{ authStore.user?.followers }}</span>
          </div>
        </div>
      </Card>

      <!-- 认证状态卡片 -->
      <Card class="p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center">
          <ShieldCheckIcon class="h-5 w-5 mr-2 text-green-500" />
          认证状态
        </h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">OAuth 状态:</span>
            <Badge variant="default">已认证</Badge>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">访问令牌:</span>
            <Badge :variant="authStore.accessToken ? 'default' : 'destructive'">
              {{ authStore.accessToken ? '有效' : '无效' }}
            </Badge>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">仓库权限:</span>
            <Badge :variant="authStore.isRepositoryOwner() ? 'default' : 'secondary'">
              {{ authStore.isRepositoryOwner() ? '完全访问' : '受限访问' }}
            </Badge>
          </div>
          <div class="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              class="w-full"
              @click="refreshUserInfo"
              :disabled="authStore.isLoading"
            >
              <UserIcon class="h-4 w-4 mr-2" />
              刷新用户信息
            </Button>
          </div>
        </div>
      </Card>

      <!-- 快捷操作卡片 -->
      <Card class="p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center">
          <ZapIcon class="h-5 w-5 mr-2 text-yellow-500" />
          快捷操作
        </h3>
        <div class="space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            class="w-full justify-start" 
            @click="$router.push('/admin/navigation')"
          >
            <NavigationIcon class="mr-2 h-4 w-4" />
            管理导航 ({{ navigationStore.totalCategories }})
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            class="w-full justify-start" 
            @click="$router.push('/admin/site')"
          >
            <SettingsIcon class="mr-2 h-4 w-4" />
            站点设置
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            class="w-full justify-start" 
            @click="exportData"
          >
            <DownloadIcon class="mr-2 h-4 w-4" />
            导出数据
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            class="w-full justify-start" 
            @click="viewLogs"
          >
            <FileTextIcon class="mr-2 h-4 w-4" />
            查看日志
          </Button>
        </div>
      </Card>
    </div>

    <!-- 详细系统信息和活动日志 -->
    <div class="grid gap-6 md:grid-cols-2">
      <!-- 系统状态监控 -->
      <SystemStatus :show-details="true" />
      
      <!-- 最近活动日志 -->
      <Card class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold flex items-center">
            <HistoryIcon class="h-5 w-5 mr-2 text-blue-500" />
            最近活动
          </h3>
          <Button variant="ghost" size="sm" @click="refreshActivityLog">
            <RefreshCwIcon class="h-4 w-4" />
          </Button>
        </div>
        
        <div class="space-y-3 max-h-64 overflow-y-auto">
          <div 
            v-for="activity in activityLog" 
            :key="activity.id"
            class="flex items-start space-x-3 text-sm p-2 rounded-md hover:bg-muted/50"
          >
            <div :class="cn('w-2 h-2 rounded-full mt-2 flex-shrink-0', activity.color)" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <span class="font-medium">{{ activity.action }}</span>
                <span class="text-xs text-muted-foreground">{{ activity.time }}</span>
              </div>
              <p class="text-muted-foreground truncate">{{ activity.description }}</p>
            </div>
          </div>
          
          <div v-if="activityLog.length === 0" class="text-center py-8 text-muted-foreground">
            <HistoryIcon class="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>暂无活动记录</p>
          </div>
        </div>
      </Card>
    </div>

    <!-- 性能和存储信息 -->
    <Card class="p-6">
      <h3 class="text-lg font-semibold mb-4 flex items-center">
        <BarChart3Icon class="h-5 w-5 mr-2 text-indigo-500" />
        性能监控
      </h3>
      
      <div class="grid gap-6 md:grid-cols-3">
        <!-- 加载性能 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">数据加载时间</span>
            <span class="font-mono">{{ getLoadTime() }}ms</span>
          </div>
          <div class="w-full bg-muted rounded-full h-2">
            <div 
              class="bg-blue-500 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${Math.min(getLoadTime() / 10, 100)}%` }"
            />
          </div>
        </div>

        <!-- 缓存使用 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">缓存使用率</span>
            <span class="font-mono">{{ getCacheUsage() }}%</span>
          </div>
          <div class="w-full bg-muted rounded-full h-2">
            <div 
              class="bg-green-500 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${getCacheUsage()}%` }"
            />
          </div>
        </div>

        <!-- API 调用 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">API 响应时间</span>
            <span class="font-mono">{{ getApiResponseTime() }}ms</span>
          </div>
          <div class="w-full bg-muted rounded-full h-2">
            <div 
              class="bg-purple-500 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${Math.min(getApiResponseTime() / 20, 100)}%` }"
            />
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NavigationIcon,
  SettingsIcon,
  RefreshCwIcon,
  FolderIcon,
  LinkIcon,
  ActivityIcon,
  ClockIcon,
  CalendarIcon,
  ShieldCheckIcon,
  UserIcon,
  ZapIcon,
  DownloadIcon,
  FileTextIcon,
  HistoryIcon,
  BarChart3Icon,
  TrendingUpIcon,
} from 'lucide-vue-next'
import { Card, Button, Badge } from '@/components/ui'
import SystemStatus from '@/components/SystemStatus.vue'
import { useAuthStore, useAppStore, useNavigationStore, useSiteStore } from '@/stores'
import { notification } from '@/composables/useNotification'
import { cn } from '@/utils'

const authStore = useAuthStore()
const appStore = useAppStore()
const navigationStore = useNavigationStore()
const siteStore = useSiteStore()

const isRefreshing = ref(false)
const activityLog = ref([
  {
    id: 1,
    action: '用户登录',
    description: `用户 ${authStore.user?.login} 成功登录系统`,
    time: '刚刚',
    color: 'bg-green-500'
  },
  {
    id: 2,
    action: '数据加载',
    description: '导航数据和站点配置已成功加载',
    time: '2分钟前',
    color: 'bg-blue-500'
  },
  {
    id: 3,
    action: '系统初始化',
    description: '管理后台系统初始化完成',
    time: '5分钟前',
    color: 'bg-purple-500'
  }
])

// 计算属性
const getOverallStatusVariant = () => {
  if (appStore.error || navigationStore.error || siteStore.error) return 'destructive'
  if (appStore.isLoading || navigationStore.loading || siteStore.loading) return 'secondary'
  return 'default'
}

const getOverallStatusText = () => {
  if (appStore.error || navigationStore.error || siteStore.error) return '系统异常'
  if (appStore.isLoading || navigationStore.loading || siteStore.loading) return '加载中'
  return '运行正常'
}

const getSystemHealthScore = () => {
  let score = 100
  if (appStore.error) score -= 30
  if (navigationStore.error) score -= 20
  if (siteStore.error) score -= 20
  if (!authStore.isAuthenticated) score -= 30
  return Math.max(score, 0)
}

const getSystemStatusColor = () => {
  const score = getSystemHealthScore()
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

const getSystemStatusText = () => {
  const score = getSystemHealthScore()
  if (score >= 80) return '系统健康'
  if (score >= 60) return '需要关注'
  return '存在问题'
}

const getSystemStatusTextColor = () => {
  const score = getSystemHealthScore()
  if (score >= 80) return 'text-green-600 dark:text-green-400'
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

const formatLastUpdate = () => {
  const lastUpdate = appStore.lastSyncTime || navigationStore.lastUpdated || siteStore.lastUpdated
  if (!lastUpdate) return '从未'
  
  const now = new Date()
  const diff = now.getTime() - lastUpdate.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return lastUpdate.toLocaleDateString()
}

const getLastUpdateDetails = () => {
  const lastUpdate = appStore.lastSyncTime || navigationStore.lastUpdated || siteStore.lastUpdated
  if (!lastUpdate) return '尚未同步数据'
  return lastUpdate.toLocaleString()
}

const getLoadTime = () => {
  // 模拟加载时间计算
  return Math.floor(Math.random() * 500) + 200
}

const getCacheUsage = () => {
  // 模拟缓存使用率
  return Math.floor(Math.random() * 40) + 30
}

const getApiResponseTime = () => {
  // 模拟 API 响应时间
  return Math.floor(Math.random() * 300) + 100
}

// 方法
const refreshAllData = async () => {
  isRefreshing.value = true
  try {
    await Promise.all([
      authStore.refreshUserInfo(),
      navigationStore.refreshData(),
      siteStore.refreshConfig(),
    ])
    
    // 添加活动日志
    activityLog.value.unshift({
      id: Date.now(),
      action: '数据刷新',
      description: '所有数据已成功刷新',
      time: '刚刚',
      color: 'bg-blue-500'
    })
    
    notification.success('刷新成功', '所有数据已更新')
  } catch (error) {
    // 错误已在 store 中处理
    activityLog.value.unshift({
      id: Date.now(),
      action: '刷新失败',
      description: '数据刷新过程中发生错误',
      time: '刚刚',
      color: 'bg-red-500'
    })
  } finally {
    isRefreshing.value = false
  }
}

const refreshUserInfo = async () => {
  try {
    await authStore.refreshUserInfo()
    notification.success('刷新成功', '用户信息已更新')
  } catch (error) {
    // 错误已在 store 中处理
  }
}

const exportData = async () => {
  try {
    const data = await appStore.exportAppData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `navsphere-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    notification.success('导出成功', '数据已导出到本地文件')
  } catch (error) {
    notification.error('导出失败', '无法导出数据')
  }
}

const viewLogs = () => {
  // 这里可以实现查看详细日志的功能
  notification.info('功能开发中', '日志查看功能正在开发中')
}

const refreshActivityLog = () => {
  // 刷新活动日志
  activityLog.value.unshift({
    id: Date.now(),
    action: '日志刷新',
    description: '活动日志已刷新',
    time: '刚刚',
    color: 'bg-gray-500'
  })
}

onMounted(async () => {
  // 确保应用已初始化
  if (!appStore.isInitialized) {
    await appStore.initializeApp()
  }
  
  // 加载数据
  await Promise.all([
    navigationStore.loadNavigationData(),
    siteStore.loadSiteConfig(),
  ])
  
  // 添加初始化完成日志
  activityLog.value.unshift({
    id: Date.now(),
    action: '控制台加载',
    description: '管理控制台页面加载完成',
    time: '刚刚',
    color: 'bg-green-500'
  })
})
</script>