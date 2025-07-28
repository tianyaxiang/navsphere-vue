/**
 * 数据验证工具 - 专门用于验证数据文件格式
 */

import type {
  NavigationCategory,
  SiteConfig,
  ResourceSection,
  ValidationResult,
} from '@/types'
import {
  validateNavigationData,
  validateSiteConfig,
  validateResourceData,
  validateDataFileStructure,
  validateJsonFormat,
  validateAllDataFiles,
} from './validation'

export class DataValidator {
  /**
   * 验证导航数据文件
   */
  static validateNavigationFile(filePath: string): Promise<ValidationResult> {
    return this.validateDataFile(filePath, 'navigation')
  }

  /**
   * 验证站点配置文件
   */
  static validateSiteConfigFile(filePath: string): Promise<ValidationResult> {
    return this.validateDataFile(filePath, 'site')
  }

  /**
   * 验证资源数据文件
   */
  static validateResourceFile(filePath: string): Promise<ValidationResult> {
    return this.validateDataFile(filePath, 'resources')
  }

  /**
   * 验证数据文件
   */
  private static async validateDataFile(
    filePath: string,
    type: 'navigation' | 'site' | 'resources'
  ): Promise<ValidationResult> {
    try {
      // 读取文件内容
      const response = await fetch(filePath)
      if (!response.ok) {
        return {
          valid: false,
          errors: [
            {
              field: 'file',
              message: `无法读取文件 ${filePath}: ${response.status} ${response.statusText}`,
              code: 'FILE_READ_ERROR',
            },
          ],
        }
      }

      const content = await response.text()

      // 验证 JSON 格式
      const jsonValidation = validateJsonFormat(content)
      if (!jsonValidation.valid) {
        return jsonValidation
      }

      // 解析 JSON
      const data = JSON.parse(content)

      // 验证数据结构
      return validateDataFileStructure(data, type)
    } catch (error) {
      return {
        valid: false,
        errors: [
          {
            field: 'validation',
            message: `验证文件失败: ${error}`,
            code: 'VALIDATION_ERROR',
          },
        ],
      }
    }
  }

  /**
   * 验证所有数据文件
   */
  static async validateAllFiles(): Promise<{
    navigation: ValidationResult
    site: ValidationResult
    resources: ValidationResult
    overall: ValidationResult
  }> {
    try {
      const [navigationResult, siteResult, resourcesResult] = await Promise.all([
        this.validateNavigationFile('/data/navigation.json'),
        this.validateSiteConfigFile('/data/site.json'),
        this.validateResourceFile('/data/resources.json'),
      ])

      const overall: ValidationResult = {
        valid: navigationResult.valid && siteResult.valid && resourcesResult.valid,
        errors: [
          ...navigationResult.errors.map(e => ({ ...e, field: `navigation.${e.field}` })),
          ...siteResult.errors.map(e => ({ ...e, field: `site.${e.field}` })),
          ...resourcesResult.errors.map(e => ({ ...e, field: `resources.${e.field}` })),
        ],
      }

      return {
        navigation: navigationResult,
        site: siteResult,
        resources: resourcesResult,
        overall,
      }
    } catch (error) {
      const errorResult: ValidationResult = {
        valid: false,
        errors: [
          {
            field: 'validation',
            message: `批量验证失败: ${error}`,
            code: 'BATCH_VALIDATION_ERROR',
          },
        ],
      }

      return {
        navigation: errorResult,
        site: errorResult,
        resources: errorResult,
        overall: errorResult,
      }
    }
  }

  /**
   * 验证数据对象（不从文件读取）
   */
  static validateDataObjects(data: {
    navigation?: NavigationCategory[]
    site?: SiteConfig
    resources?: ResourceSection[]
  }): {
    navigation: ValidationResult
    site: ValidationResult
    resources: ValidationResult
    overall: ValidationResult
  } {
    const results = {
      navigation: { valid: true, errors: [] } as ValidationResult,
      site: { valid: true, errors: [] } as ValidationResult,
      resources: { valid: true, errors: [] } as ValidationResult,
      overall: { valid: true, errors: [] } as ValidationResult,
    }

    // 验证导航数据
    if (data.navigation) {
      results.navigation = validateNavigationData(data.navigation)
    }

    // 验证站点配置
    if (data.site) {
      results.site = validateSiteConfig(data.site)
    }

    // 验证资源数据
    if (data.resources) {
      results.resources = validateResourceData(data.resources)
    }

    // 计算总体结果
    const allErrors = [
      ...results.navigation.errors,
      ...results.site.errors,
      ...results.resources.errors,
    ]

    results.overall = {
      valid: allErrors.length === 0,
      errors: allErrors,
    }

    return results
  }

  /**
   * 生成验证报告
   */
  static generateValidationReport(results: {
    navigation: ValidationResult
    site: ValidationResult
    resources: ValidationResult
    overall: ValidationResult
  }): string {
    const lines: string[] = []
    
    lines.push('# 数据验证报告')
    lines.push('')
    lines.push(`生成时间: ${new Date().toLocaleString()}`)
    lines.push('')

    // 总体状态
    lines.push('## 总体状态')
    lines.push(`状态: ${results.overall.valid ? '✅ 通过' : '❌ 失败'}`)
    lines.push(`错误数量: ${results.overall.errors.length}`)
    lines.push('')

    // 各文件详情
    const files = [
      { name: '导航数据', key: 'navigation' as const },
      { name: '站点配置', key: 'site' as const },
      { name: '资源数据', key: 'resources' as const },
    ]

    files.forEach(file => {
      const result = results[file.key]
      lines.push(`## ${file.name}`)
      lines.push(`状态: ${result.valid ? '✅ 通过' : '❌ 失败'}`)
      
      if (result.errors.length > 0) {
        lines.push('错误详情:')
        result.errors.forEach((error, index) => {
          lines.push(`${index + 1}. [${error.field}] ${error.message} (${error.code || 'UNKNOWN'})`)
        })
      }
      lines.push('')
    })

    return lines.join('\n')
  }

  /**
   * 检查数据文件是否存在
   */
  static async checkFilesExistence(): Promise<{
    navigation: boolean
    site: boolean
    resources: boolean
    all: boolean
  }> {
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

      return {
        navigation,
        site,
        resources,
        all: navigation && site && resources,
      }
    } catch (error) {
      console.error('检查文件存在性失败:', error)
      return {
        navigation: false,
        site: false,
        resources: false,
        all: false,
      }
    }
  }

  /**
   * 获取数据文件统计信息
   */
  static async getDataFileStats(): Promise<{
    navigation: {
      categories: number
      items: number
      subCategories: number
    }
    site: {
      hasBasicConfig: boolean
      hasAppearanceConfig: boolean
      hasSeoConfig: boolean
      hasFeaturesConfig: boolean
    }
    resources: {
      sections: number
      items: number
    }
  }> {
    try {
      const [navigationData, siteData, resourcesData] = await Promise.all([
        fetch('/data/navigation.json').then(r => r.json()).catch(() => []),
        fetch('/data/site.json').then(r => r.json()).catch(() => ({})),
        fetch('/data/resources.json').then(r => r.json()).catch(() => []),
      ])

      // 统计导航数据
      const navigationStats = {
        categories: Array.isArray(navigationData) ? navigationData.length : 0,
        items: 0,
        subCategories: 0,
      }

      if (Array.isArray(navigationData)) {
        navigationData.forEach((category: any) => {
          if (Array.isArray(category.items)) {
            navigationStats.items += category.items.length
          }
          if (Array.isArray(category.subCategories)) {
            navigationStats.subCategories += category.subCategories.length
            category.subCategories.forEach((sub: any) => {
              if (Array.isArray(sub.items)) {
                navigationStats.items += sub.items.length
              }
            })
          }
        })
      }

      // 统计站点配置
      const siteStats = {
        hasBasicConfig: !!siteData.basic,
        hasAppearanceConfig: !!siteData.appearance,
        hasSeoConfig: !!siteData.seo,
        hasFeaturesConfig: !!siteData.features,
      }

      // 统计资源数据
      const resourcesStats = {
        sections: Array.isArray(resourcesData) ? resourcesData.length : 0,
        items: 0,
      }

      if (Array.isArray(resourcesData)) {
        resourcesData.forEach((section: any) => {
          if (Array.isArray(section.items)) {
            resourcesStats.items += section.items.length
          }
        })
      }

      return {
        navigation: navigationStats,
        site: siteStats,
        resources: resourcesStats,
      }
    } catch (error) {
      console.error('获取数据文件统计失败:', error)
      return {
        navigation: { categories: 0, items: 0, subCategories: 0 },
        site: { hasBasicConfig: false, hasAppearanceConfig: false, hasSeoConfig: false, hasFeaturesConfig: false },
        resources: { sections: 0, items: 0 },
      }
    }
  }
}