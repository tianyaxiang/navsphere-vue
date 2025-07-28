/**
 * 数据验证工具
 */

import type {
  NavigationCategory,
  NavigationSubItem,
  SiteConfig,
  ValidationResult,
  ValidationRules,
} from '@/types'
import { VALIDATION_RULES } from '@/types/constants'

/**
 * 验证导航项目
 */
export function validateNavigationItem(item: NavigationSubItem): ValidationResult {
  const errors: Array<{ field: string; message: string; code?: string }> = []

  // 验证必填字段
  if (!item.id?.trim()) {
    errors.push({ field: 'id', message: 'ID 不能为空', code: 'REQUIRED' })
  }

  if (!item.title?.trim()) {
    errors.push({ field: 'title', message: '标题不能为空', code: 'REQUIRED' })
  } else if (item.title.length > VALIDATION_RULES.MAX_TITLE_LENGTH) {
    errors.push({
      field: 'title',
      message: `标题长度不能超过 ${VALIDATION_RULES.MAX_TITLE_LENGTH} 个字符`,
      code: 'MAX_LENGTH',
    })
  }

  if (!item.description?.trim()) {
    errors.push({ field: 'description', message: '描述不能为空', code: 'REQUIRED' })
  } else if (item.description.length > VALIDATION_RULES.MAX_DESCRIPTION_LENGTH) {
    errors.push({
      field: 'description',
      message: `描述长度不能超过 ${VALIDATION_RULES.MAX_DESCRIPTION_LENGTH} 个字符`,
      code: 'MAX_LENGTH',
    })
  }

  if (!item.href?.trim()) {
    errors.push({ field: 'href', message: '链接不能为空', code: 'REQUIRED' })
  } else if (!VALIDATION_RULES.URL_PATTERN.test(item.href)) {
    errors.push({ field: 'href', message: '链接格式不正确', code: 'INVALID_FORMAT' })
  }

  if (!item.icon?.trim()) {
    errors.push({ field: 'icon', message: '图标不能为空', code: 'REQUIRED' })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * 验证导航分类
 */
export function validateNavigationCategory(category: NavigationCategory): ValidationResult {
  const errors: Array<{ field: string; message: string; code?: string }> = []

  // 验证必填字段
  if (!category.id?.trim()) {
    errors.push({ field: 'id', message: 'ID 不能为空', code: 'REQUIRED' })
  }

  if (!category.title?.trim()) {
    errors.push({ field: 'title', message: '标题不能为空', code: 'REQUIRED' })
  } else if (category.title.length > VALIDATION_RULES.MAX_TITLE_LENGTH) {
    errors.push({
      field: 'title',
      message: `标题长度不能超过 ${VALIDATION_RULES.MAX_TITLE_LENGTH} 个字符`,
      code: 'MAX_LENGTH',
    })
  }

  // 验证子项目
  if (category.items && category.items.length > 0) {
    category.items.forEach((item, index) => {
      const itemValidation = validateNavigationItem(item)
      if (!itemValidation.valid) {
        itemValidation.errors.forEach(error => {
          errors.push({
            field: `items[${index}].${error.field}`,
            message: `第 ${index + 1} 个项目的${error.message}`,
            code: error.code,
          })
        })
      }
    })
  }

  // 验证子分类
  if (category.subCategories && category.subCategories.length > 0) {
    category.subCategories.forEach((subCategory, index) => {
      if (!subCategory.id?.trim()) {
        errors.push({
          field: `subCategories[${index}].id`,
          message: `第 ${index + 1} 个子分类的 ID 不能为空`,
          code: 'REQUIRED',
        })
      }

      if (!subCategory.title?.trim()) {
        errors.push({
          field: `subCategories[${index}].title`,
          message: `第 ${index + 1} 个子分类的标题不能为空`,
          code: 'REQUIRED',
        })
      }

      // 验证子分类的项目
      if (subCategory.items && subCategory.items.length > 0) {
        subCategory.items.forEach((item, itemIndex) => {
          const itemValidation = validateNavigationItem(item)
          if (!itemValidation.valid) {
            itemValidation.errors.forEach(error => {
              errors.push({
                field: `subCategories[${index}].items[${itemIndex}].${error.field}`,
                message: `第 ${index + 1} 个子分类的第 ${itemIndex + 1} 个项目的${error.message}`,
                code: error.code,
              })
            })
          }
        })
      }
    })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * 验证导航数据
 */
export function validateNavigationData(data: NavigationCategory[]): ValidationResult {
  const errors: Array<{ field: string; message: string; code?: string }> = []

  if (!Array.isArray(data)) {
    errors.push({ field: 'data', message: '数据格式不正确', code: 'INVALID_FORMAT' })
    return { valid: false, errors }
  }

  // 检查 ID 重复
  const ids = new Set<string>()
  data.forEach((category, index) => {
    if (category.id && ids.has(category.id)) {
      errors.push({
        field: `[${index}].id`,
        message: `分类 ID "${category.id}" 重复`,
        code: 'DUPLICATE',
      })
    } else if (category.id) {
      ids.add(category.id)
    }

    // 验证每个分类
    const categoryValidation = validateNavigationCategory(category)
    if (!categoryValidation.valid) {
      categoryValidation.errors.forEach(error => {
        errors.push({
          field: `[${index}].${error.field}`,
          message: error.message,
          code: error.code,
        })
      })
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * 验证站点配置
 */
export function validateSiteConfig(config: SiteConfig): ValidationResult {
  const errors: Array<{ field: string; message: string; code?: string }> = []

  // 验证基本配置
  if (!config.basic) {
    errors.push({ field: 'basic', message: '基本配置不能为空', code: 'REQUIRED' })
  } else {
    if (!config.basic.title?.trim()) {
      errors.push({ field: 'basic.title', message: '网站标题不能为空', code: 'REQUIRED' })
    }

    if (!config.basic.description?.trim()) {
      errors.push({ field: 'basic.description', message: '网站描述不能为空', code: 'REQUIRED' })
    }

    if (config.basic.email && !VALIDATION_RULES.EMAIL_PATTERN.test(config.basic.email)) {
      errors.push({ field: 'basic.email', message: '邮箱格式不正确', code: 'INVALID_FORMAT' })
    }

    if (config.basic.url && !VALIDATION_RULES.URL_PATTERN.test(config.basic.url)) {
      errors.push({ field: 'basic.url', message: '网站 URL 格式不正确', code: 'INVALID_FORMAT' })
    }
  }

  // 验证外观配置
  if (!config.appearance) {
    errors.push({ field: 'appearance', message: '外观配置不能为空', code: 'REQUIRED' })
  } else {
    if (!['light', 'dark', 'system'].includes(config.appearance.theme)) {
      errors.push({
        field: 'appearance.theme',
        message: '主题设置不正确',
        code: 'INVALID_VALUE',
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * 验证 URL
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return VALIDATION_RULES.URL_PATTERN.test(url)
  } catch {
    return false
  }
}

/**
 * 验证邮箱
 */
export function validateEmail(email: string): boolean {
  return VALIDATION_RULES.EMAIL_PATTERN.test(email)
}

/**
 * 验证资源数据
 */
export function validateResourceData(data: any[]): ValidationResult {
  const errors: Array<{ field: string; message: string; code?: string }> = []

  if (!Array.isArray(data)) {
    errors.push({ field: 'data', message: '资源数据格式不正确，应为数组', code: 'INVALID_FORMAT' })
    return { valid: false, errors }
  }

  data.forEach((section, index) => {
    // 验证资源分类基本字段
    if (!section.id?.trim()) {
      errors.push({
        field: `[${index}].id`,
        message: `资源分类 ${index + 1} 的 ID 不能为空`,
        code: 'REQUIRED',
      })
    }

    if (!section.title?.trim()) {
      errors.push({
        field: `[${index}].title`,
        message: `资源分类 ${index + 1} 的标题不能为空`,
        code: 'REQUIRED',
      })
    }

    if (!Array.isArray(section.items)) {
      errors.push({
        field: `[${index}].items`,
        message: `资源分类 ${index + 1} 的 items 字段应为数组`,
        code: 'INVALID_FORMAT',
      })
    } else {
      // 验证每个资源项目
      section.items.forEach((item: any, itemIndex: number) => {
        if (!item.title?.trim()) {
          errors.push({
            field: `[${index}].items[${itemIndex}].title`,
            message: `资源分类 ${index + 1} 的项目 ${itemIndex + 1} 的标题不能为空`,
            code: 'REQUIRED',
          })
        }

        if (!item.description?.trim()) {
          errors.push({
            field: `[${index}].items[${itemIndex}].description`,
            message: `资源分类 ${index + 1} 的项目 ${itemIndex + 1} 的描述不能为空`,
            code: 'REQUIRED',
          })
        }

        if (!item.url?.trim()) {
          errors.push({
            field: `[${index}].items[${itemIndex}].url`,
            message: `资源分类 ${index + 1} 的项目 ${itemIndex + 1} 的 URL 不能为空`,
            code: 'REQUIRED',
          })
        } else if (!validateUrl(item.url)) {
          errors.push({
            field: `[${index}].items[${itemIndex}].url`,
            message: `资源分类 ${index + 1} 的项目 ${itemIndex + 1} 的 URL 格式不正确`,
            code: 'INVALID_FORMAT',
          })
        }
      })
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * 验证数据文件结构完整性
 */
export function validateDataFileStructure(data: any, expectedType: 'navigation' | 'site' | 'resources'): ValidationResult {
  const errors: Array<{ field: string; message: string; code?: string }> = []

  try {
    switch (expectedType) {
      case 'navigation':
        if (!Array.isArray(data)) {
          errors.push({ field: 'root', message: '导航数据应为数组格式', code: 'INVALID_FORMAT' })
        } else {
          return validateNavigationData(data)
        }
        break

      case 'site':
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
          errors.push({ field: 'root', message: '站点配置应为对象格式', code: 'INVALID_FORMAT' })
        } else {
          return validateSiteConfig(data)
        }
        break

      case 'resources':
        if (!Array.isArray(data)) {
          errors.push({ field: 'root', message: '资源数据应为数组格式', code: 'INVALID_FORMAT' })
        } else {
          return validateResourceData(data)
        }
        break

      default:
        errors.push({ field: 'type', message: '未知的数据类型', code: 'INVALID_TYPE' })
    }
  } catch (error) {
    errors.push({ field: 'structure', message: `数据结构验证失败: ${error}`, code: 'VALIDATION_ERROR' })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * 验证 JSON 格式
 */
export function validateJsonFormat(jsonString: string): ValidationResult {
  const errors: Array<{ field: string; message: string; code?: string }> = []

  try {
    JSON.parse(jsonString)
  } catch (error) {
    errors.push({
      field: 'json',
      message: `JSON 格式不正确: ${error}`,
      code: 'INVALID_JSON',
    })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * 批量验证数据文件
 */
export function validateAllDataFiles(files: {
  navigation?: any
  site?: any
  resources?: any
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
  if (files.navigation !== undefined) {
    results.navigation = validateDataFileStructure(files.navigation, 'navigation')
  }

  // 验证站点配置
  if (files.site !== undefined) {
    results.site = validateDataFileStructure(files.site, 'site')
  }

  // 验证资源数据
  if (files.resources !== undefined) {
    results.resources = validateDataFileStructure(files.resources, 'resources')
  }

  // 计算总体验证结果
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
 * 通用表单验证
 */
export function validateForm(data: Record<string, any>, rules: ValidationRules): ValidationResult {
  const errors: Array<{ field: string; message: string; code?: string }> = []

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field]

    // 必填验证
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      errors.push({ field, message: `${field} 不能为空`, code: 'REQUIRED' })
      continue
    }

    // 如果值为空且不是必填，跳过其他验证
    if (!value && !rule.required) continue

    // 类型验证
    if (rule.type) {
      let isValidType = true
      switch (rule.type) {
        case 'string':
          isValidType = typeof value === 'string'
          break
        case 'number':
          isValidType = typeof value === 'number' && !isNaN(value)
          break
        case 'email':
          isValidType = typeof value === 'string' && validateEmail(value)
          break
        case 'url':
          isValidType = typeof value === 'string' && validateUrl(value)
          break
        case 'array':
          isValidType = Array.isArray(value)
          break
        case 'object':
          isValidType = typeof value === 'object' && value !== null && !Array.isArray(value)
          break
      }

      if (!isValidType) {
        errors.push({ field, message: `${field} 类型不正确`, code: 'INVALID_TYPE' })
        continue
      }
    }

    // 长度验证
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push({
          field,
          message: `${field} 长度不能少于 ${rule.minLength} 个字符`,
          code: 'MIN_LENGTH',
        })
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push({
          field,
          message: `${field} 长度不能超过 ${rule.maxLength} 个字符`,
          code: 'MAX_LENGTH',
        })
      }
    }

    // 正则验证
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      errors.push({ field, message: `${field} 格式不正确`, code: 'INVALID_FORMAT' })
    }

    // 自定义验证
    if (rule.custom) {
      const customResult = rule.custom(value)
      if (customResult !== true) {
        errors.push({
          field,
          message: typeof customResult === 'string' ? customResult : `${field} 验证失败`,
          code: 'CUSTOM_VALIDATION',
        })
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}