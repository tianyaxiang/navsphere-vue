/**
 * 状态管理入口文件
 */

import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { useAuthStore } from './auth'
import { useNavigationStore } from './navigation'
import { useSiteStore } from './site'
import { useThemeStore } from './theme'
import { CacheService } from '@/services/cache'
import { DataService } from '@/services/data'
import { notification } from '@/composables/useNotification'

export const useAppStore = defineStore('app', () => {
  // 应用状态
  const isInitialized = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastSyncTime = ref<Date | null>(null)

  // 获取其他 stores
  const authStore = useAuthStore()
  const navigationStore = useNavigationStore()
  const siteStore = useSiteStore()
  const themeStore = useThemeStore()

  // 计算属性
  const isReady = computed(() => 
    isInitialized.value && 
    !isLoading.value && 
    !error.value
  )

  const hasData = computed(() => 
    navigationStore.categories.length > 0 || 
    siteStore.isLoaded
  )

  const syncStatus = computed(() => {
    if (isLoading.value) return 'syncing'
    if (error.value) return 'error'
    if (hasData.value) return 'synced'
    return 'pending'
  })

  /**
   * 初始化应用
   */
  const initializeApp = async () => {
    if (isInitialized.value) return

    try {
      isLoading.value = true
      error.value = null

      // 初始化主题
      themeStore.initializeTheme()

      // 初始化认证状态
      await authStore.initializeAuth()

      // 如果已认证，加载数据
      if (authStore.isAuthenticated) {
        await loadAppData()
      }

      isInitialized.value = true
      lastSyncTime.value = new Date()
    } catch (err: any) {
      console.error('应用初始化失败:', err)
      error.value = err.message || '应用初始化失败'
      notification.error('初始化失败', error.value)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 加载应用数据
   */
  const loadAppData = async (force = false) => {
    if (!authStore.isAuthenticated) {
      throw new Error('用户未认证')
    }

    try {
      isLoading.value = true
      error.value = null

      // 并行加载数据
      await Promise.all([
        navigationStore.loadNavigationData(force),
        siteStore.loadSiteConfig(force),
      ])

      lastSyncTime.value = new Date()
      DataService.updateSyncTimestamp()
    } catch (err: any) {
      console.error('加载应用数据失败:', err)
      error.value = err.message || '加载应用数据失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 刷新应用数据
   */
  const refreshAppData = async () => {
    try {
      await loadAppData(true)
      notification.success('刷新成功', '应用数据已更新')
    } catch (err: any) {
      notification.error('刷新失败', err.message)
      throw err
    }
  }

  /**
   * 检查数据同步状态
   */
  const checkSyncStatus = async () => {
    if (!authStore.isAuthenticated) return

    try {
      const syncStatus = await DataService.checkDataSync()
      
      if (syncStatus.navigation || syncStatus.site || syncStatus.resources) {
        notification.info('数据更新', '检测到远程数据更新，建议刷新')
        return true
      }
      
      return false
    } catch (err: any) {
      console.error('检查同步状态失败:', err)
      return false
    }
  }

  /**
   * 重置应用状态
   */
  const resetApp = async () => {
    try {
      isLoading.value = true

      // 重置各个 store
      authStore.logout()
      navigationStore.resetState()
      siteStore.resetState()
      
      // 清除缓存
      CacheService.clear()
      
      // 重置应用状态
      isInitialized.value = false
      error.value = null
      lastSyncTime.value = null

      notification.success('重置成功', '应用状态已重置')
    } catch (err: any) {
      console.error('重置应用失败:', err)
      notification.error('重置失败', err.message)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 处理全局错误
   */
  const handleGlobalError = (err: Error, context?: string) => {
    console.error(`全局错误${context ? ` (${context})` : ''}:`, err)
    
    error.value = err.message
    
    // 根据错误类型进行不同处理
    if (err.message.includes('401') || err.message.includes('Unauthorized')) {
      // 认证错误，重新登录
      authStore.logout()
      notification.error('认证失败', '请重新登录')
    } else if (err.message.includes('403') || err.message.includes('Forbidden')) {
      // 权限错误
      notification.error('权限不足', '您没有执行此操作的权限')
    } else if (err.message.includes('404') || err.message.includes('Not Found')) {
      // 资源不存在
      notification.warning('资源不存在', '请检查配置或联系管理员')
    } else if (err.message.includes('Network') || err.message.includes('fetch')) {
      // 网络错误
      notification.error('网络错误', '请检查网络连接')
    } else {
      // 其他错误
      notification.error('操作失败', err.message)
    }
  }

  /**
   * 清除错误状态
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * 获取应用统计信息
   */
  const getAppStats = () => {
    return {
      isInitialized: isInitialized.value,
      isLoading: isLoading.value,
      hasError: !!error.value,
      isAuthenticated: authStore.isAuthenticated,
      navigationStats: {
        categories: navigationStore.totalCategories,
        items: navigationStore.totalItems,
        enabledItems: navigationStore.enabledItems,
      },
      siteConfig: {
        isLoaded: siteStore.isLoaded,
        title: siteStore.siteTitle,
        theme: siteStore.siteTheme,
      },
      cache: CacheService.getStats(),
      lastSyncTime: lastSyncTime.value,
    }
  }

  /**
   * 导出应用数据
   */
  const exportAppData = async () => {
    try {
      const backup = await DataService.createBackup()
      
      const exportData = {
        ...backup,
        appVersion: '1.0.0',
        exportedBy: authStore.user?.login,
      }

      return exportData
    } catch (err: any) {
      console.error('导出应用数据失败:', err)
      throw err
    }
  }

  /**
   * 导入应用数据
   */
  const importAppData = async (data: any) => {
    try {
      isLoading.value = true

      await DataService.restoreBackup(data)
      await loadAppData(true)

      notification.success('导入成功', '应用数据已导入')
    } catch (err: any) {
      console.error('导入应用数据失败:', err)
      notification.error('导入失败', err.message)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    // 状态
    isInitialized: readonly(isInitialized),
    isLoading: readonly(isLoading),
    error: readonly(error),
    lastSyncTime: readonly(lastSyncTime),

    // 计算属性
    isReady,
    hasData,
    syncStatus,

    // 方法
    initializeApp,
    loadAppData,
    refreshAppData,
    checkSyncStatus,
    resetApp,
    handleGlobalError,
    clearError,
    getAppStats,
    exportAppData,
    importAppData,
  }
})

// 导出所有 stores
export { useAuthStore } from './auth'
export { useNavigationStore } from './navigation'
export { useSiteStore } from './site'
export { useThemeStore } from './theme'