/**
 * 数据同步组合式函数
 */

import { ref, computed, readonly, onMounted, onUnmounted } from 'vue'
import { useAppStore, useNavigationStore, useSiteStore } from '@/stores'
import { DataService } from '@/services/data'
import { CacheService } from '@/services/cache'
import { notification } from './useNotification'

export function useDataSync() {
  const appStore = useAppStore()
  const navigationStore = useNavigationStore()
  const siteStore = useSiteStore()

  const isSyncing = ref(false)
  const lastSyncCheck = ref<Date | null>(null)
  const syncInterval = ref<NodeJS.Timeout | null>(null)
  const autoSyncEnabled = ref(true)
  const syncIntervalMs = ref(5 * 60 * 1000) // 5 minutes

  // 计算属性
  const needsSync = computed(() => {
    if (!lastSyncCheck.value) return true
    
    const timeSinceLastCheck = Date.now() - lastSyncCheck.value.getTime()
    return timeSinceLastCheck > syncIntervalMs.value
  })

  const syncStatus = computed(() => {
    if (isSyncing.value) return 'syncing'
    if (needsSync.value) return 'needs-sync'
    return 'synced'
  })

  /**
   * 检查数据同步状态
   */
  const checkSync = async () => {
    try {
      isSyncing.value = true
      
      const syncStatus = await DataService.checkDataSync()
      lastSyncCheck.value = new Date()

      let hasUpdates = false

      // 检查导航数据
      if (syncStatus.navigation) {
        await navigationStore.loadNavigationData(true)
        hasUpdates = true
      }

      // 检查站点配置
      if (syncStatus.site) {
        await siteStore.loadSiteConfig(true)
        hasUpdates = true
      }

      if (hasUpdates) {
        notification.info('数据已同步', '检测到远程数据更新并已同步')
      }

      return hasUpdates
    } catch (error: any) {
      console.error('检查数据同步失败:', error)
      return false
    } finally {
      isSyncing.value = false
    }
  }

  /**
   * 强制同步数据
   */
  const forceSync = async () => {
    try {
      isSyncing.value = true
      
      await Promise.all([
        navigationStore.refreshData(),
        siteStore.refreshConfig(),
      ])

      lastSyncCheck.value = new Date()
      notification.success('同步完成', '所有数据已同步')
    } catch (error: any) {
      console.error('强制同步失败:', error)
      notification.error('同步失败', error.message)
      throw error
    } finally {
      isSyncing.value = false
    }
  }

  /**
   * 启动自动同步
   */
  const startAutoSync = () => {
    if (syncInterval.value) {
      clearInterval(syncInterval.value)
    }

    if (autoSyncEnabled.value) {
      syncInterval.value = setInterval(() => {
        if (appStore.isReady && !isSyncing.value) {
          checkSync()
        }
      }, syncIntervalMs.value)
    }
  }

  /**
   * 停止自动同步
   */
  const stopAutoSync = () => {
    if (syncInterval.value) {
      clearInterval(syncInterval.value)
      syncInterval.value = null
    }
  }

  /**
   * 设置同步间隔
   */
  const setSyncInterval = (intervalMs: number) => {
    syncIntervalMs.value = intervalMs
    if (autoSyncEnabled.value) {
      startAutoSync()
    }
  }

  /**
   * 启用/禁用自动同步
   */
  const toggleAutoSync = (enabled: boolean) => {
    autoSyncEnabled.value = enabled
    
    if (enabled) {
      startAutoSync()
    } else {
      stopAutoSync()
    }
  }

  /**
   * 获取同步统计信息
   */
  const getSyncStats = () => {
    return {
      isSyncing: isSyncing.value,
      lastSyncCheck: lastSyncCheck.value,
      autoSyncEnabled: autoSyncEnabled.value,
      syncInterval: syncIntervalMs.value,
      needsSync: needsSync.value,
      status: syncStatus.value,
    }
  }

  /**
   * 清理缓存
   */
  const clearCache = () => {
    CacheService.clear()
    notification.success('缓存已清理', '所有缓存数据已清除')
  }

  /**
   * 获取缓存统计
   */
  const getCacheStats = () => {
    return CacheService.getStats()
  }

  /**
   * 预加载数据
   */
  const preloadData = async () => {
    try {
      // 预加载常用数据到缓存
      const cachePromises = [
        CacheService.getOrSet('navigation-data', () => 
          DataService.getNavigationData(), { ttl: 10 * 60 * 1000 }
        ),
        CacheService.getOrSet('site-config', () => 
          DataService.getSiteConfig(), { ttl: 30 * 60 * 1000 }
        ),
      ]

      await Promise.all(cachePromises)
    } catch (error: any) {
      console.error('预加载数据失败:', error)
    }
  }

  /**
   * 数据备份
   */
  const createBackup = async () => {
    try {
      const backup = await DataService.createBackup()
      
      // 保存到本地存储作为紧急备份
      const backupKey = `backup_${Date.now()}`
      localStorage.setItem(backupKey, JSON.stringify(backup))
      
      // 清理旧备份（只保留最近5个）
      const backupKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('backup_'))
        .sort()
      
      if (backupKeys.length > 5) {
        backupKeys.slice(0, -5).forEach(key => {
          localStorage.removeItem(key)
        })
      }

      notification.success('备份创建成功', '数据已备份到本地')
      return backup
    } catch (error: any) {
      console.error('创建备份失败:', error)
      notification.error('备份失败', error.message)
      throw error
    }
  }

  /**
   * 获取本地备份列表
   */
  const getLocalBackups = () => {
    const backupKeys = Object.keys(localStorage)
      .filter(key => key.startsWith('backup_'))
      .sort()

    return backupKeys.map(key => {
      const timestamp = key.replace('backup_', '')
      const data = localStorage.getItem(key)
      
      return {
        key,
        timestamp: new Date(parseInt(timestamp)),
        size: data?.length || 0,
      }
    })
  }

  /**
   * 恢复本地备份
   */
  const restoreLocalBackup = async (backupKey: string) => {
    try {
      const backupData = localStorage.getItem(backupKey)
      if (!backupData) {
        throw new Error('备份数据不存在')
      }

      const backup = JSON.parse(backupData)
      await DataService.restoreBackup(backup)
      
      // 重新加载数据
      await forceSync()
      
      notification.success('恢复成功', '数据已从备份恢复')
    } catch (error: any) {
      console.error('恢复备份失败:', error)
      notification.error('恢复失败', error.message)
      throw error
    }
  }

  // 生命周期
  onMounted(() => {
    if (autoSyncEnabled.value) {
      startAutoSync()
    }
  })

  onUnmounted(() => {
    stopAutoSync()
  })

  return {
    // 状态
    isSyncing: readonly(isSyncing),
    lastSyncCheck: readonly(lastSyncCheck),
    autoSyncEnabled: readonly(autoSyncEnabled),
    syncIntervalMs: readonly(syncIntervalMs),

    // 计算属性
    needsSync,
    syncStatus,

    // 方法
    checkSync,
    forceSync,
    startAutoSync,
    stopAutoSync,
    setSyncInterval,
    toggleAutoSync,
    getSyncStats,
    clearCache,
    getCacheStats,
    preloadData,
    createBackup,
    getLocalBackups,
    restoreLocalBackup,
  }
}