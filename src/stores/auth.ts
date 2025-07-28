/**
 * 认证状态管理
 */

import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { GitHubUser } from '@/types'
import { GitHubAuthService } from '@/services/github'
import { notification } from '@/composables/useNotification'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<GitHubUser | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const isAuthenticated = computed(() => !!user.value)
  const accessToken = computed(() => GitHubAuthService.getAccessToken())

  /**
   * 初始化认证状态
   */
  const initializeAuth = async () => {
    isLoading.value = true
    error.value = null

    try {
      // 检查登录是否过期
      if (GitHubAuthService.isLoginExpired()) {
        GitHubAuthService.clearAllAuthData()
        user.value = null
        return false
      }

      // 检查本地存储的用户信息
      const cachedUser = GitHubAuthService.getCachedUserInfo()
      if (cachedUser) {
        user.value = cachedUser
      }

      // 验证 token 是否有效
      const isValid = await GitHubAuthService.checkAuthStatus()
      if (!isValid) {
        GitHubAuthService.clearAllAuthData()
        user.value = null
        return false
      }

      // 如果没有缓存的用户信息，重新获取
      if (!user.value) {
        user.value = await GitHubAuthService.getUserInfo()
        GitHubAuthService.setUserInfo(user.value)
      }

      return true
    } catch (err: any) {
      console.error('Failed to initialize auth:', err)
      error.value = err.message || '认证初始化失败'
      GitHubAuthService.clearAllAuthData()
      user.value = null
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 开始登录流程
   */
  const login = async () => {
    try {
      isLoading.value = true
      error.value = null
      await GitHubAuthService.login()
    } catch (err: any) {
      console.error('Login failed:', err)
      error.value = err.message || '登录失败'
      notification.error('登录失败', error.value || '未知错误')
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 处理 OAuth 回调
   */
  const handleCallback = async (code: string, state: string) => {
    try {
      isLoading.value = true
      error.value = null

      const userInfo = await GitHubAuthService.handleCallback(code, state)
      user.value = userInfo

      // 设置登录时间和持久化状态
      GitHubAuthService.setLastLoginTime()
      GitHubAuthService.setPersistentLogin(true) // 默认启用持久化登录

      notification.success('登录成功', `欢迎回来，${userInfo.name || userInfo.login}！`)
      return true
    } catch (err: any) {
      console.error('OAuth callback failed:', err)
      error.value = err.message || 'OAuth 回调处理失败'
      notification.error('登录失败', error.value || '未知错误')
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 登出
   */
  const logout = async () => {
    try {
      isLoading.value = true
      error.value = null

      await GitHubAuthService.logout()
      GitHubAuthService.clearAllAuthData()
      user.value = null

      notification.success('登出成功', '您已成功登出')
    } catch (err: any) {
      console.error('Logout failed:', err)
      error.value = err.message || '登出失败'
      notification.error('登出失败', error.value || '未知错误')
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 刷新用户信息
   */
  const refreshUserInfo = async () => {
    if (!isAuthenticated.value) return

    try {
      isLoading.value = true
      error.value = null

      const userInfo = await GitHubAuthService.refreshUserInfo()
      user.value = userInfo

      return userInfo
    } catch (err: any) {
      console.error('Failed to refresh user info:', err)
      error.value = err.message || '刷新用户信息失败'
      
      // 如果刷新失败，可能是 token 过期，清除认证状态
      if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        await logout()
      }
      
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 清除错误状态
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * 检查是否有特定权限
   */
  const hasPermission = (_permission: string): boolean => {
    // 这里可以根据用户角色或权限进行判断
    // 目前简单地检查是否已认证
    return isAuthenticated.value
  }

  /**
   * 检查是否是仓库所有者
   */
  const isRepositoryOwner = (): boolean => {
    if (!user.value) return false
    // Check if user is repository owner (you can configure this)
    const githubOwner = (import.meta as any).env?.VITE_GITHUB_OWNER || 'owner'
    return user.value.login === githubOwner
  }

  return {
    // 状态
    user: readonly(user),
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // 计算属性
    isAuthenticated,
    accessToken,
    
    // 方法
    initializeAuth,
    login,
    handleCallback,
    logout,
    refreshUserInfo,
    clearError,
    hasPermission,
    isRepositoryOwner,
  }
})