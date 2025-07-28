/**
 * 本地数据服务 - 用于读取和解析本地数据文件
 */

import type {
  NavigationCategory,
  SiteConfig,
  ResourceSection,
  NavigationStats,
} from '@/types'
import {
  validateNavigationData,
  validateSiteConfig,
  createDefaultNavigationData,
  createSiteConfig,
  calculateNavigationStats,
} from '@/utils'
import { DEFAULT_SITE_CONFIG } from '@/types/constants'

export class LocalDataService {
  /**
   * 读取本地 JSON 文件
   */
  private static async loadJsonFile<T>(path: string): Promise<T> {
    try {
      const response = await fetch(path)
      if (!response.ok) {
        throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      return data as T
    } catch (error) {
      console.error(`Error loading ${path}:`, error)
      throw error
    }
  }

  /**
   * 获取导航数据
   */
  static async getNavigationData(): Promise<NavigationCategory[]> {
    try {
      const data = await this.loadJsonFile<NavigationCategory[]>('/data/navigation.json')
      
      // 验证数据格式
      const validation = validateNavigationData(data)
      if (!validation.valid) {
        console.warn('导航数据验证失败:', validation.errors)
        // 如果验证失败，返回默认数据
        return createDefaultNavigationData()
      }

      return data
    } catch (error) {
      console.error('获取导航数据失败:', error)
      // 如果加载失败，返回默认数据
      return createDefaultNavigationData()
    }
  }

  /**
   * 获取站点配置
   */
  static async getSiteConfig(): Promise<SiteConfig> {
    try {
      const data = await this.loadJsonFile<SiteConfig>('/data/site.json')
      
      // 验证配置
      const validation = validateSiteConfig(data)
      if (!validation.valid) {
        console.warn('站点配置验证失败:', validation.errors)
        // 如果验证失败，返回默认配置
        return createSiteConfig(DEFAULT_SITE_CONFIG)
      }

      return data
    } catch (error) {
      console.error('获取站点配置失败:', error)
      // 如果加载失败，返回默认配置
      return createSiteConfig(DEFAULT_SITE_CONFIG)
    }
  }

  /**
   * 获取资源数据
   */
  static async getResourceData(): Promise<ResourceSection[]> {
    try {
      const data = await this.loadJsonFile<ResourceSection[]>('/data/resources.json')
      
      // 基本验证
      if (!Array.isArray(data)) {
        console.warn('资源数据格式不正确，应为数组')
        return []
      }

      // 验证每个资源分类的基本结构
      const validatedData = data.filter(section => {
        if (!section.id || !section.title || !Array.isArray(section.items)) {
          console.warn('资源分类格式不正确:', section)
          return false
        }
        
        // 验证每个资源项目
        section.items = section.items.filter(item => {
          if (!item.title || !item.description || !item.url) {
            console.warn('资源项目格式不正确:', item)
            return false
          }
          return true
        })
        
        return true
      })

      return validatedData
    } catch (error) {
      console.error('获取资源数据失败:', error)
      return []
    }
  }

  /**
   * 获取导航统计数据
   */
  static async getNavigationStats(): Promise<NavigationStats> {
    try {
      const data = await this.getNavigationData()
      return calculateNavigationStats(data)
    } catch (error) {
      console.error('获取导航统计失败:', error)
      throw new Error(`获取导航统计失败: ${error}`)
    }
  }

  /**
   * 预加载所有数据
   */
  static async preloadAllData(): Promise<{
    navigation: NavigationCategory[]
    site: SiteConfig
    resources: ResourceSection[]
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
      }
    } catch (error) {
      console.error('预加载数据失败:', error)
      throw error
    }
  }

  /**
   * 验证数据文件完整性
   */
  static async validateDataFiles(): Promise<{
    navigation: { valid: boolean; errors: string[] }
    site: { valid: boolean; errors: string[] }
    resources: { valid: boolean; errors: string[] }
  }> {
    const results = {
      navigation: { valid: true, errors: [] as string[] },
      site: { valid: true, errors: [] as string[] },
      resources: { valid: true, errors: [] as string[] },
    }

    try {
      // 验证导航数据
      const navigationData = await this.loadJsonFile<NavigationCategory[]>('/data/navigation.json')
      const navigationValidation = validateNavigationData(navigationData)
      results.navigation.valid = navigationValidation.valid
      results.navigation.errors = navigationValidation.errors.map(e => e.message)
    } catch (error) {
      results.navigation.valid = false
      results.navigation.errors.push(`无法加载导航数据: ${error}`)
    }

    try {
      // 验证站点配置
      const siteData = await this.loadJsonFile<SiteConfig>('/data/site.json')
      const siteValidation = validateSiteConfig(siteData)
      results.site.valid = siteValidation.valid
      results.site.errors = siteValidation.errors.map(e => e.message)
    } catch (error) {
      results.site.valid = false
      results.site.errors.push(`无法加载站点配置: ${error}`)
    }

    try {
      // 验证资源数据
      const resourceData = await this.loadJsonFile<ResourceSection[]>('/data/resources.json')
      if (!Array.isArray(resourceData)) {
        results.resources.valid = false
        results.resources.errors.push('资源数据格式不正确，应为数组')
      } else {
        // 检查每个资源分类
        resourceData.forEach((section, index) => {
          if (!section.id) {
            results.resources.errors.push(`资源分类 ${index + 1} 缺少 id 字段`)
          }
          if (!section.title) {
            results.resources.errors.push(`资源分类 ${index + 1} 缺少 title 字段`)
          }
          if (!Array.isArray(section.items)) {
            results.resources.errors.push(`资源分类 ${index + 1} 的 items 字段应为数组`)
          } else {
            // 检查每个资源项目
            section.items.forEach((item, itemIndex) => {
              if (!item.title) {
                results.resources.errors.push(`资源分类 ${index + 1} 的项目 ${itemIndex + 1} 缺少 title 字段`)
              }
              if (!item.description) {
                results.resources.errors.push(`资源分类 ${index + 1} 的项目 ${itemIndex + 1} 缺少 description 字段`)
              }
              if (!item.url) {
                results.resources.errors.push(`资源分类 ${index + 1} 的项目 ${itemIndex + 1} 缺少 url 字段`)
              }
            })
          }
        })
        
        if (results.resources.errors.length > 0) {
          results.resources.valid = false
        }
      }
    } catch (error) {
      results.resources.valid = false
      results.resources.errors.push(`无法加载资源数据: ${error}`)
    }

    return results
  }

  /**
   * 检查数据文件是否存在
   */
  static async checkDataFilesExistence(): Promise<{
    navigation: boolean
    site: boolean
    resources: boolean
  }> {
    const results = {
      navigation: false,
      site: false,
      resources: false,
    }

    const checkFile = async (path: string): Promise<boolean> => {
      try {
        const response = await fetch(path, { method: 'HEAD' })
        return response.ok
      } catch {
        return false
      }
    }

    try {
      const [navigation, site, resources] = await Promise.all([
        checkFile('/data/navigation.json'),
        checkFile('/data/site.json'),
        checkFile('/data/resources.json'),
      ])

      results.navigation = navigation
      results.site = site
      results.resources = resources
    } catch (error) {
      console.error('检查数据文件存在性失败:', error)
    }

    return results
  }
}