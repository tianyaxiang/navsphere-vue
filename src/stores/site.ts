/**
 * 站点配置状态管理
 */

import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { SiteConfig } from '@/types'
import { DataService } from '@/services/data'
import { DEFAULT_SITE_CONFIG } from '@/types/constants'
import { notification } from '@/composables/useNotification'

export const useSiteStore = defineStore('site', () => {
  // 状态
  const config = ref<SiteConfig | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)

  // 计算属性
  const siteTitle = computed(() => config.value?.basic.title || DEFAULT_SITE_CONFIG.basic.title)
  const siteDescription = computed(() => config.value?.basic.description || DEFAULT_SITE_CONFIG.basic.description)
  const siteLogo = computed(() => config.value?.appearance.logo || DEFAULT_SITE_CONFIG.appearance.logo)
  const siteFavicon = computed(() => config.value?.appearance.favicon || DEFAULT_SITE_CONFIG.appearance.favicon)
  const siteTheme = computed(() => config.value?.appearance.theme || DEFAULT_SITE_CONFIG.appearance.theme)

  const isLoaded = computed(() => config.value !== null)
  const hasChanges = computed(() => {
    // 这里可以实现变更检测逻辑
    return false
  })

  // ==================== 数据加载 ====================

  /**
   * 加载站点配置
   */
  const loadSiteConfig = async (force = false) => {
    if (loading.value && !force) return

    try {
      loading.value = true
      error.value = null

      const siteConfig = await DataService.getSiteConfig()
      config.value = siteConfig
      lastUpdated.value = new Date()
    } catch (err: any) {
      console.error('加载站点配置失败:', err)
      error.value = err.message || '加载站点配置失败'
      notification.error('加载失败', error.value)
    } finally {
      loading.value = false
    }
  }

  /**
   * 刷新配置
   */
  const refreshConfig = async () => {
    await loadSiteConfig(true)
    notification.success('刷新成功', '站点配置已更新')
  }

  // ==================== 配置更新 ====================

  /**
   * 更新完整配置
   */
  const updateConfig = async (newConfig: SiteConfig) => {
    try {
      loading.value = true
      error.value = null

      await DataService.updateSiteConfig(newConfig)
      config.value = newConfig
      lastUpdated.value = new Date()
    } catch (err: any) {
      console.error('更新站点配置失败:', err)
      error.value = err.message || '更新站点配置失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新基本配置
   */
  const updateBasicConfig = async (updates: Partial<SiteConfig['basic']>) => {
    if (!config.value) return

    try {
      loading.value = true
      error.value = null

      await DataService.updateSiteBasicConfig(updates)
      
      // 本地更新
      config.value.basic = { ...config.value.basic, ...updates }
      lastUpdated.value = new Date()
    } catch (err: any) {
      console.error('更新基本配置失败:', err)
      error.value = err.message || '更新基本配置失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新外观配置
   */
  const updateAppearanceConfig = async (updates: Partial<SiteConfig['appearance']>) => {
    if (!config.value) return

    try {
      loading.value = true
      error.value = null

      await DataService.updateSiteAppearanceConfig(updates)
      
      // 本地更新
      config.value.appearance = { ...config.value.appearance, ...updates }
      lastUpdated.value = new Date()
    } catch (err: any) {
      console.error('更新外观配置失败:', err)
      error.value = err.message || '更新外观配置失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新 SEO 配置
   */
  const updateSeoConfig = async (updates: Partial<SiteConfig['seo']>) => {
    if (!config.value) return

    const newConfig = {
      ...config.value,
      seo: { ...config.value.seo, ...updates },
    }

    await updateConfig(newConfig)
  }

  /**
   * 更新功能配置
   */
  const updateFeatureConfig = async (updates: Partial<SiteConfig['features']>) => {
    if (!config.value) return

    const newConfig = {
      ...config.value,
      features: { ...config.value.features, ...updates },
    }

    await updateConfig(newConfig)
  }

  // ==================== 特定字段更新 ====================

  /**
   * 更新站点标题
   */
  const updateSiteTitle = async (title: string) => {
    await updateBasicConfig({ title })
  }

  /**
   * 更新站点描述
   */
  const updateSiteDescription = async (description: string) => {
    await updateBasicConfig({ description })
  }

  /**
   * 更新站点关键词
   */
  const updateSiteKeywords = async (keywords: string) => {
    await updateBasicConfig({ keywords })
  }

  /**
   * 更新站点 Logo
   */
  const updateSiteLogo = async (logo: string) => {
    await updateAppearanceConfig({ logo })
  }

  /**
   * 更新站点图标
   */
  const updateSiteFavicon = async (favicon: string) => {
    await updateAppearanceConfig({ favicon })
  }

  /**
   * 更新站点主题
   */
  const updateSiteTheme = async (theme: 'light' | 'dark' | 'system') => {
    await updateAppearanceConfig({ theme })
  }

  // ==================== 配置验证 ====================

  /**
   * 验证配置
   */
  const validateConfig = (configToValidate: SiteConfig) => {
    const errors: string[] = []

    // 基本配置验证
    if (!configToValidate.basic.title?.trim()) {
      errors.push('站点标题不能为空')
    }
    if (!configToValidate.basic.description?.trim()) {
      errors.push('站点描述不能为空')
    }

    // 外观配置验证
    if (!['light', 'dark', 'system'].includes(configToValidate.appearance.theme)) {
      errors.push('主题设置无效')
    }

    // URL 验证
    if (configToValidate.basic.url && !isValidUrl(configToValidate.basic.url)) {
      errors.push('站点 URL 格式无效')
    }

    // 邮箱验证
    if (configToValidate.basic.email && !isValidEmail(configToValidate.basic.email)) {
      errors.push('邮箱格式无效')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  // ==================== 配置导入导出 ====================

  /**
   * 导出配置
   */
  const exportConfig = () => {
    if (!config.value) return null

    return {
      ...config.value,
      exportedAt: new Date().toISOString(),
    }
  }

  /**
   * 导入配置
   */
  const importConfig = async (importedConfig: SiteConfig) => {
    const validation = validateConfig(importedConfig)
    if (!validation.valid) {
      throw new Error(`配置验证失败: ${validation.errors.join(', ')}`)
    }

    await updateConfig(importedConfig)
    notification.success('导入成功', '站点配置已导入')
  }

  /**
   * 重置为默认配置
   */
  const resetToDefault = async () => {
    const defaultConfig = {
      ...DEFAULT_SITE_CONFIG,
      lastUpdated: new Date().toISOString(),
    } as SiteConfig

    await updateConfig(defaultConfig)
    notification.success('重置成功', '站点配置已重置为默认值')
  }

  // ==================== 工具方法 ====================

  /**
   * 清除错误状态
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * 重置状态
   */
  const resetState = () => {
    config.value = null
    loading.value = false
    error.value = null
    lastUpdated.value = null
  }

  /**
   * 获取配置副本
   */
  const getConfigCopy = () => {
    return config.value ? JSON.parse(JSON.stringify(config.value)) : null
  }

  // 辅助函数
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

  return {
    // 状态
    config: readonly(config),
    loading: readonly(loading),
    error: readonly(error),
    lastUpdated: readonly(lastUpdated),

    // 计算属性
    siteTitle,
    siteDescription,
    siteLogo,
    siteFavicon,
    siteTheme,
    isLoaded,
    hasChanges,

    // 数据加载
    loadSiteConfig,
    refreshConfig,

    // 配置更新
    updateConfig,
    updateBasicConfig,
    updateAppearanceConfig,
    updateSeoConfig,
    updateFeatureConfig,

    // 特定字段更新
    updateSiteTitle,
    updateSiteDescription,
    updateSiteKeywords,
    updateSiteLogo,
    updateSiteFavicon,
    updateSiteTheme,

    // 配置管理
    validateConfig,
    exportConfig,
    importConfig,
    resetToDefault,

    // 工具方法
    clearError,
    resetState,
    getConfigCopy,
  }
})