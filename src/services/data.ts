/**
 * 数据服务 - 基于 GitHub API 的数据管理
 */

import type {
  NavigationCategory,
  NavigationSubItem,
  SiteConfig,
  ResourceSection,
  NavigationStats,
  ApiResponse,
} from '@/types'
import { GitHubApiService, createGitHubApiService } from './github'
import { DATA_FILES, DEFAULT_SITE_CONFIG } from '@/types/constants'
import {
  validateNavigationData,
  validateSiteConfig,
  createDefaultNavigationData,
  createSiteConfig,
  calculateNavigationStats,
} from '@/utils'
import { notification } from '@/composables/useNotification'

export class DataService {
  private static githubApi: GitHubApiService | null = null

  /**
   * 获取 GitHub API 服务实例
   */
  private static getGitHubApi(): GitHubApiService {
    if (!this.githubApi) {
      this.githubApi = createGitHubApiService()
      if (!this.githubApi) {
        throw new Error('未找到有效的访问令牌，请重新登录')
      }
    }
    return this.githubApi
  }

  /**
   * 重置 API 实例（用于 token 更新后）
   */
  static resetApiInstance(): void {
    this.githubApi = null
  }

  // ==================== 导航数据管理 ====================

  /**
   * 获取导航数据
   */
  static async getNavigationData(): Promise<NavigationCategory[]> {
    try {
      const api = this.getGitHubApi()
      const content = await api.getFileContent(DATA_FILES.NAVIGATION)
      
      if (!content.trim()) {
        // 如果文件为空，返回默认数据
        return createDefaultNavigationData()
      }

      const data = JSON.parse(content) as NavigationCategory[]
      
      // 验证数据格式
      const validation = validateNavigationData(data)
      if (!validation.valid) {
        console.warn('导航数据验证失败:', validation.errors)
        notification.warning('数据格式警告', '导航数据格式可能存在问题')
      }

      return data
    } catch (error: any) {
      console.error('获取导航数据失败:', error)
      
      if (error.message.includes('File not found')) {
        // 文件不存在，创建默认数据
        const defaultData = createDefaultNavigationData()
        await this.updateNavigationData(defaultData)
        return defaultData
      }
      
      throw new Error(`获取导航数据失败: ${error.message}`)
    }
  }

  /**
   * 更新导航数据
   */
  static async updateNavigationData(data: NavigationCategory[]): Promise<void> {
    try {
      // 验证数据
      const validation = validateNavigationData(data)
      if (!validation.valid) {
        const errorMessages = validation.errors.map(e => e.message).join(', ')
        throw new Error(`数据验证失败: ${errorMessages}`)
      }

      const api = this.getGitHubApi()
      const content = JSON.stringify(data, null, 2)
      const message = `更新导航数据 - ${new Date().toLocaleString()}`

      try {
        // 尝试更新文件
        await api.updateFile(DATA_FILES.NAVIGATION, content, message)
      } catch (error: any) {
        if (error.message.includes('File not found')) {
          // 文件不存在，创建新文件
          await api.createFile(DATA_FILES.NAVIGATION, content, message)
        } else {
          throw error
        }
      }

      notification.success('保存成功', '导航数据已更新')
    } catch (error: any) {
      console.error('更新导航数据失败:', error)
      notification.error('保存失败', error.message)
      throw error
    }
  }

  /**
   * 添加导航分类
   */
  static async addNavigationCategory(category: NavigationCategory): Promise<void> {
    const data = await this.getNavigationData()
    data.push(category)
    await this.updateNavigationData(data)
  }

  /**
   * 更新导航分类
   */
  static async updateNavigationCategory(
    id: string,
    updates: Partial<NavigationCategory>
  ): Promise<void> {
    const data = await this.getNavigationData()
    const index = data.findIndex(cat => cat.id === id)
    
    if (index === -1) {
      throw new Error(`未找到 ID 为 ${id} 的分类`)
    }

    data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() }
    await this.updateNavigationData(data)
  }

  /**
   * 删除导航分类
   */
  static async deleteNavigationCategory(id: string): Promise<void> {
    const data = await this.getNavigationData()
    const filteredData = data.filter(cat => cat.id !== id)
    
    if (filteredData.length === data.length) {
      throw new Error(`未找到 ID 为 ${id} 的分类`)
    }

    await this.updateNavigationData(filteredData)
  }

  /**
   * 添加导航项目
   */
  static async addNavigationItem(categoryId: string, item: NavigationSubItem): Promise<void> {
    const data = await this.getNavigationData()
    const category = data.find(cat => cat.id === categoryId)
    
    if (!category) {
      throw new Error(`未找到 ID 为 ${categoryId} 的分类`)
    }

    category.items.push(item)
    category.updatedAt = new Date().toISOString()
    await this.updateNavigationData(data)
  }

  /**
   * 更新导航项目
   */
  static async updateNavigationItem(
    categoryId: string,
    itemId: string,
    updates: Partial<NavigationSubItem>
  ): Promise<void> {
    const data = await this.getNavigationData()
    const category = data.find(cat => cat.id === categoryId)
    
    if (!category) {
      throw new Error(`未找到 ID 为 ${categoryId} 的分类`)
    }

    const itemIndex = category.items.findIndex(item => item.id === itemId)
    if (itemIndex === -1) {
      throw new Error(`未找到 ID 为 ${itemId} 的项目`)
    }

    category.items[itemIndex] = {
      ...category.items[itemIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    category.updatedAt = new Date().toISOString()
    
    await this.updateNavigationData(data)
  }

  /**
   * 删除导航项目
   */
  static async deleteNavigationItem(categoryId: string, itemId: string): Promise<void> {
    const data = await this.getNavigationData()
    const category = data.find(cat => cat.id === categoryId)
    
    if (!category) {
      throw new Error(`未找到 ID 为 ${categoryId} 的分类`)
    }

    const originalLength = category.items.length
    category.items = category.items.filter(item => item.id !== itemId)
    
    if (category.items.length === originalLength) {
      throw new Error(`未找到 ID 为 ${itemId} 的项目`)
    }

    category.updatedAt = new Date().toISOString()
    await this.updateNavigationData(data)
  }

  // ==================== 站点配置管理 ====================

  /**
   * 获取站点配置
   */
  static async getSiteConfig(): Promise<SiteConfig> {
    try {
      const api = this.getGitHubApi()
      const content = await api.getFileContent(DATA_FILES.SITE_CONFIG)
      
      if (!content.trim()) {
        return createSiteConfig(DEFAULT_SITE_CONFIG)
      }

      const config = JSON.parse(content) as SiteConfig
      
      // 验证配置
      const validation = validateSiteConfig(config)
      if (!validation.valid) {
        console.warn('站点配置验证失败:', validation.errors)
        notification.warning('配置格式警告', '站点配置格式可能存在问题')
      }

      return config
    } catch (error: any) {
      console.error('获取站点配置失败:', error)
      
      if (error.message.includes('File not found')) {
        // 文件不存在，创建默认配置
        const defaultConfig = createSiteConfig(DEFAULT_SITE_CONFIG)
        await this.updateSiteConfig(defaultConfig)
        return defaultConfig
      }
      
      throw new Error(`获取站点配置失败: ${error.message}`)
    }
  }

  /**
   * 更新站点配置
   */
  static async updateSiteConfig(config: SiteConfig): Promise<void> {
    try {
      // 验证配置
      const validation = validateSiteConfig(config)
      if (!validation.valid) {
        const errorMessages = validation.errors.map(e => e.message).join(', ')
        throw new Error(`配置验证失败: ${errorMessages}`)
      }

      const api = this.getGitHubApi()
      const updatedConfig = {
        ...config,
        lastUpdated: new Date().toISOString(),
      }
      
      const content = JSON.stringify(updatedConfig, null, 2)
      const message = `更新站点配置 - ${new Date().toLocaleString()}`

      try {
        await api.updateFile(DATA_FILES.SITE_CONFIG, content, message)
      } catch (error: any) {
        if (error.message.includes('File not found')) {
          await api.createFile(DATA_FILES.SITE_CONFIG, content, message)
        } else {
          throw error
        }
      }

      notification.success('保存成功', '站点配置已更新')
    } catch (error: any) {
      console.error('更新站点配置失败:', error)
      notification.error('保存失败', error.message)
      throw error
    }
  }

  /**
   * 更新站点基本配置
   */
  static async updateSiteBasicConfig(
    updates: Partial<SiteConfig['basic']>
  ): Promise<void> {
    const config = await this.getSiteConfig()
    config.basic = { ...config.basic, ...updates }
    await this.updateSiteConfig(config)
  }

  /**
   * 更新站点外观配置
   */
  static async updateSiteAppearanceConfig(
    updates: Partial<SiteConfig['appearance']>
  ): Promise<void> {
    const config = await this.getSiteConfig()
    config.appearance = { ...config.appearance, ...updates }
    await this.updateSiteConfig(config)
  }

  // ==================== 资源数据管理 ====================

  /**
   * 获取资源数据
   */
  static async getResourceData(): Promise<ResourceSection[]> {
    try {
      const api = this.getGitHubApi()
      const content = await api.getFileContent(DATA_FILES.RESOURCES)
      
      if (!content.trim()) {
        return []
      }

      return JSON.parse(content) as ResourceSection[]
    } catch (error: any) {
      console.error('获取资源数据失败:', error)
      
      if (error.message.includes('File not found')) {
        // 文件不存在，返回空数组
        return []
      }
      
      throw new Error(`获取资源数据失败: ${error.message}`)
    }
  }

  /**
   * 更新资源数据
   */
  static async updateResourceData(data: ResourceSection[]): Promise<void> {
    try {
      const api = this.getGitHubApi()
      const content = JSON.stringify(data, null, 2)
      const message = `更新资源数据 - ${new Date().toLocaleString()}`

      try {
        await api.updateFile(DATA_FILES.RESOURCES, content, message)
      } catch (error: any) {
        if (error.message.includes('File not found')) {
          await api.createFile(DATA_FILES.RESOURCES, content, message)
        } else {
          throw error
        }
      }

      notification.success('保存成功', '资源数据已更新')
    } catch (error: any) {
      console.error('更新资源数据失败:', error)
      notification.error('保存失败', error.message)
      throw error
    }
  }

  // ==================== 统计和分析 ====================

  /**
   * 获取导航统计数据
   */
  static async getNavigationStats(): Promise<NavigationStats> {
    try {
      const data = await this.getNavigationData()
      return calculateNavigationStats(data)
    } catch (error: any) {
      console.error('获取导航统计失败:', error)
      throw new Error(`获取导航统计失败: ${error.message}`)
    }
  }

  // ==================== 数据备份和恢复 ====================

  /**
   * 创建数据备份
   */
  static async createBackup(): Promise<{
    navigation: NavigationCategory[]
    site: SiteConfig
    resources: ResourceSection[]
    timestamp: string
  }> {
    try {
      const [navigation, site, resources] = await Promise.all([
        this.getNavigationData(),
        this.getSiteConfig(),
        this.getResourceData(),
      ])

      return {
        navigation,
        site,
        resources,
        timestamp: new Date().toISOString(),
      }
    } catch (error: any) {
      console.error('创建备份失败:', error)
      throw new Error(`创建备份失败: ${error.message}`)
    }
  }

  /**
   * 恢复数据备份
   */
  static async restoreBackup(backup: {
    navigation: NavigationCategory[]
    site: SiteConfig
    resources: ResourceSection[]
  }): Promise<void> {
    try {
      await Promise.all([
        this.updateNavigationData(backup.navigation),
        this.updateSiteConfig(backup.site),
        this.updateResourceData(backup.resources),
      ])

      notification.success('恢复成功', '数据已从备份恢复')
    } catch (error: any) {
      console.error('恢复备份失败:', error)
      notification.error('恢复失败', error.message)
      throw error
    }
  }

  // ==================== 数据同步和缓存 ====================

  /**
   * 检查数据是否需要同步
   */
  static async checkDataSync(): Promise<{
    navigation: boolean
    site: boolean
    resources: boolean
  }> {
    try {
      const api = this.getGitHubApi()
      const commits = await api.getCommits(undefined, 1)
      
      if (commits.length === 0) {
        return { navigation: false, site: false, resources: false }
      }

      const lastCommit = commits[0]
      const lastSyncTime = localStorage.getItem('last_sync_time')
      
      if (!lastSyncTime) {
        return { navigation: true, site: true, resources: true }
      }

      const needsSync = new Date(lastCommit.author.date) > new Date(lastSyncTime)
      
      return {
        navigation: needsSync,
        site: needsSync,
        resources: needsSync,
      }
    } catch (error: any) {
      console.error('检查数据同步失败:', error)
      return { navigation: true, site: true, resources: true }
    }
  }

  /**
   * 更新同步时间戳
   */
  static updateSyncTimestamp(): void {
    localStorage.setItem('last_sync_time', new Date().toISOString())
  }
}