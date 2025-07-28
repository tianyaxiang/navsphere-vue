<template>
  <div class="min-h-screen bg-background">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-foreground mb-8">认证组件演示</h1>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- AuthGuard 演示 -->
        <Card class="p-6">
          <h2 class="text-xl font-semibold mb-4">AuthGuard 组件</h2>
          <p class="text-muted-foreground mb-4">
            这个组件会检查用户的认证状态，如果未认证会显示登录界面。
          </p>
          
          <AuthGuard>
            <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
              <p class="text-green-700 dark:text-green-300">
                🎉 您已成功通过认证！这是受保护的内容。
              </p>
            </div>
          </AuthGuard>
        </Card>

        <!-- UserInfo 演示 -->
        <Card class="p-6">
          <h2 class="text-xl font-semibold mb-4">UserInfo 组件</h2>
          <p class="text-muted-foreground mb-4">
            显示用户信息的组件，支持多种配置选项。
          </p>
          
          <div class="space-y-4">
            <!-- 基础显示 -->
            <div>
              <h3 class="text-sm font-medium mb-2">基础显示</h3>
              <UserInfo />
            </div>
            
            <!-- 详细信息 -->
            <div>
              <h3 class="text-sm font-medium mb-2">详细信息</h3>
              <UserInfo 
                :show-details="true"
                :show-email="true"
                :show-company="true"
                :show-location="true"
                avatar-size="lg"
              />
            </div>
            
            <!-- 带统计信息 -->
            <div>
              <h3 class="text-sm font-medium mb-2">带统计信息</h3>
              <UserInfo 
                :show-details="true"
                :show-stats="true"
                :show-actions="true"
                :show-github-link="true"
                :show-refresh="true"
                avatar-size="xl"
              />
            </div>
          </div>
        </Card>

        <!-- 权限演示 -->
        <Card class="p-6">
          <h2 class="text-xl font-semibold mb-4">权限控制演示</h2>
          <p class="text-muted-foreground mb-4">
            演示不同权限级别的访问控制。
          </p>
          
          <div class="space-y-4">
            <!-- 需要管理员权限 -->
            <div>
              <h3 class="text-sm font-medium mb-2">管理员权限</h3>
              <AuthGuard require-permission="admin">
                <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <p class="text-blue-700 dark:text-blue-300">
                    👑 管理员专用内容
                  </p>
                </div>
              </AuthGuard>
            </div>
            
            <!-- 需要写入权限 -->
            <div>
              <h3 class="text-sm font-medium mb-2">写入权限</h3>
              <AuthGuard require-permission="write">
                <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                  <p class="text-purple-700 dark:text-purple-300">
                    ✏️ 需要写入权限的内容
                  </p>
                </div>
              </AuthGuard>
            </div>
          </div>
        </Card>

        <!-- 登录状态信息 -->
        <Card class="p-6">
          <h2 class="text-xl font-semibold mb-4">登录状态信息</h2>
          <p class="text-muted-foreground mb-4">
            当前的认证状态和用户信息。
          </p>
          
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">认证状态:</span>
              <Badge :variant="authStore.isAuthenticated ? 'success' : 'destructive'">
                {{ authStore.isAuthenticated ? '已认证' : '未认证' }}
              </Badge>
            </div>
            
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">加载状态:</span>
              <Badge :variant="authStore.isLoading ? 'warning' : 'secondary'">
                {{ authStore.isLoading ? '加载中' : '空闲' }}
              </Badge>
            </div>
            
            <div v-if="authStore.error" class="flex items-center justify-between">
              <span class="text-sm font-medium">错误信息:</span>
              <span class="text-sm text-destructive">{{ authStore.error }}</span>
            </div>
            
            <div v-if="authStore.user" class="pt-3 border-t">
              <h4 class="text-sm font-medium mb-2">用户信息:</h4>
              <div class="text-xs text-muted-foreground space-y-1">
                <p>ID: {{ authStore.user.id }}</p>
                <p>用户名: {{ authStore.user.login }}</p>
                <p>姓名: {{ authStore.user.name || '未设置' }}</p>
                <p>邮箱: {{ authStore.user.email || '未公开' }}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <!-- 操作按钮 -->
      <div class="mt-8 flex flex-wrap gap-4">
        <Button 
          v-if="!authStore.isAuthenticated" 
          @click="authStore.login()"
          :disabled="authStore.isLoading"
        >
          <LoadingSpinner v-if="authStore.isLoading" size="sm" class="mr-2" />
          登录
        </Button>
        
        <Button 
          v-if="authStore.isAuthenticated" 
          @click="authStore.logout()"
          variant="destructive"
          :disabled="authStore.isLoading"
        >
          登出
        </Button>
        
        <Button 
          v-if="authStore.isAuthenticated" 
          @click="authStore.refreshUserInfo()"
          variant="outline"
          :disabled="authStore.isLoading"
        >
          <RefreshCwIcon class="h-4 w-4 mr-2" />
          刷新用户信息
        </Button>
        
        <Button @click="authStore.clearError()" variant="ghost">
          清除错误
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RefreshCwIcon } from 'lucide-vue-next'
import { Button, Card, Badge, LoadingSpinner } from '@/components/ui'
import AuthGuard from '@/components/AuthGuard.vue'
import UserInfo from '@/components/UserInfo.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>