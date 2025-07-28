<template>
  <div :class="cn('flex items-center space-x-3', className)">
    <!-- 用户头像 -->
    <div class="relative">
      <img
        :src="user?.avatar_url"
        :alt="displayName"
        :class="cn(
          'rounded-full object-cover',
          avatarSize === 'sm' && 'h-6 w-6',
          avatarSize === 'md' && 'h-8 w-8',
          avatarSize === 'lg' && 'h-10 w-10',
          avatarSize === 'xl' && 'h-12 w-12'
        )"
        @error="handleAvatarError"
      />
      
      <!-- 在线状态指示器 -->
      <div 
        v-if="showStatus"
        :class="cn(
          'absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-background',
          isOnline ? 'bg-green-500' : 'bg-gray-400',
          avatarSize === 'sm' && 'h-2 w-2',
          avatarSize === 'md' && 'h-2.5 w-2.5',
          avatarSize === 'lg' && 'h-3 w-3',
          avatarSize === 'xl' && 'h-3.5 w-3.5'
        )"
      />
    </div>

    <!-- 用户信息 -->
    <div v-if="showInfo" class="flex-1 min-w-0">
      <div class="flex items-center space-x-2">
        <p :class="cn(
          'font-medium text-foreground truncate',
          textSize === 'sm' && 'text-sm',
          textSize === 'md' && 'text-base',
          textSize === 'lg' && 'text-lg'
        )">
          {{ displayName }}
        </p>
        
        <!-- 验证徽章 -->
        <BadgeCheckIcon 
          v-if="isVerified" 
          class="h-4 w-4 text-blue-500 flex-shrink-0" 
          title="已验证用户"
        />
      </div>
      
      <div v-if="showDetails" class="space-y-1">
        <!-- 用户名 -->
        <p :class="cn(
          'text-muted-foreground truncate',
          textSize === 'sm' && 'text-xs',
          textSize === 'md' && 'text-sm',
          textSize === 'lg' && 'text-base'
        )">
          @{{ user?.login }}
        </p>
        
        <!-- 邮箱 -->
        <p v-if="user?.email && showEmail" :class="cn(
          'text-muted-foreground truncate',
          textSize === 'sm' && 'text-xs',
          textSize === 'md' && 'text-sm',
          textSize === 'lg' && 'text-base'
        )">
          {{ user.email }}
        </p>
        
        <!-- 公司/组织 -->
        <p v-if="user?.company && showCompany" :class="cn(
          'text-muted-foreground truncate flex items-center',
          textSize === 'sm' && 'text-xs',
          textSize === 'md' && 'text-sm',
          textSize === 'lg' && 'text-base'
        )">
          <BuildingIcon class="h-3 w-3 mr-1 flex-shrink-0" />
          {{ user.company }}
        </p>
        
        <!-- 位置 -->
        <p v-if="user?.location && showLocation" :class="cn(
          'text-muted-foreground truncate flex items-center',
          textSize === 'sm' && 'text-xs',
          textSize === 'md' && 'text-sm',
          textSize === 'lg' && 'text-base'
        )">
          <MapPinIcon class="h-3 w-3 mr-1 flex-shrink-0" />
          {{ user.location }}
        </p>
        
        <!-- 统计信息 -->
        <div v-if="showStats" class="flex items-center space-x-4 pt-1">
          <span :class="cn(
            'text-muted-foreground flex items-center',
            textSize === 'sm' && 'text-xs',
            textSize === 'md' && 'text-sm',
            textSize === 'lg' && 'text-base'
          )">
            <GitBranchIcon class="h-3 w-3 mr-1" />
            {{ user?.public_repos || 0 }}
          </span>
          <span :class="cn(
            'text-muted-foreground flex items-center',
            textSize === 'sm' && 'text-xs',
            textSize === 'md' && 'text-sm',
            textSize === 'lg' && 'text-base'
          )">
            <UsersIcon class="h-3 w-3 mr-1" />
            {{ user?.followers || 0 }}
          </span>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div v-if="showActions" class="flex items-center space-x-2">
      <Button
        v-if="showGitHubLink"
        variant="ghost"
        size="sm"
        @click="openGitHubProfile"
        title="查看 GitHub 资料"
      >
        <ExternalLinkIcon class="h-4 w-4" />
      </Button>
      
      <Button
        v-if="showRefresh"
        variant="ghost"
        size="sm"
        @click="refreshUserInfo"
        :disabled="isRefreshing"
        title="刷新用户信息"
      >
        <RefreshCwIcon :class="cn('h-4 w-4', isRefreshing && 'animate-spin')" />
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  BadgeCheckIcon,
  BuildingIcon,
  MapPinIcon,
  GitBranchIcon,
  UsersIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
} from 'lucide-vue-next'
import { Button } from '@/components/ui'
import { useAuthStore } from '@/stores/auth'
import { cn } from '@/utils'
import type { GitHubUser } from '@/types'

interface Props {
  /**
   * 用户数据（如果不提供，则使用当前登录用户）
   */
  user?: GitHubUser | null
  /**
   * 头像大小
   */
  avatarSize?: 'sm' | 'md' | 'lg' | 'xl'
  /**
   * 文字大小
   */
  textSize?: 'sm' | 'md' | 'lg'
  /**
   * 是否显示用户信息
   */
  showInfo?: boolean
  /**
   * 是否显示详细信息
   */
  showDetails?: boolean
  /**
   * 是否显示邮箱
   */
  showEmail?: boolean
  /**
   * 是否显示公司
   */
  showCompany?: boolean
  /**
   * 是否显示位置
   */
  showLocation?: boolean
  /**
   * 是否显示统计信息
   */
  showStats?: boolean
  /**
   * 是否显示在线状态
   */
  showStatus?: boolean
  /**
   * 是否显示操作按钮
   */
  showActions?: boolean
  /**
   * 是否显示 GitHub 链接
   */
  showGitHubLink?: boolean
  /**
   * 是否显示刷新按钮
   */
  showRefresh?: boolean
  /**
   * 自定义样式类名
   */
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  avatarSize: 'md',
  textSize: 'md',
  showInfo: true,
  showDetails: false,
  showEmail: false,
  showCompany: false,
  showLocation: false,
  showStats: false,
  showStatus: false,
  showActions: false,
  showGitHubLink: false,
  showRefresh: false,
})

const emit = defineEmits<{
  refresh: []
  avatarError: [Event]
}>()

const authStore = useAuthStore()
const isRefreshing = ref(false)

// 计算属性
const user = computed(() => props.user || authStore.user)
const displayName = computed(() => user.value?.name || user.value?.login || '未知用户')
const isOnline = computed(() => authStore.isAuthenticated)
const isVerified = computed(() => {
  // 这里可以根据实际需求判断用户是否已验证
  // 例如检查用户是否有特定的权限或角色
  return authStore.isRepositoryOwner()
})

// 方法
const handleAvatarError = (event: Event) => {
  emit('avatarError', event)
  
  // 设置默认头像
  const img = event.target as HTMLImageElement
  img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName.value)}&background=random`
}

const openGitHubProfile = () => {
  if (user.value?.html_url) {
    window.open(user.value.html_url, '_blank', 'noopener,noreferrer')
  }
}

const refreshUserInfo = async () => {
  try {
    isRefreshing.value = true
    await authStore.refreshUserInfo()
    emit('refresh')
  } catch (error) {
    // 错误已在 store 中处理
  } finally {
    isRefreshing.value = false
  }
}
</script>