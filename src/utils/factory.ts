/**
 * 数据模型工厂函数
 */

import type {
  NavigationCategory,
  NavigationSubItem,
  NavigationSubCategory,
  SiteConfig,
  ResourceSection,
  ResourceItem,
  GitHubUser,
  SearchResult,
  NavigationStats,
  SystemStats,
} from '@/types'
import { generateId } from './index'
import { DEFAULT_SITE_CONFIG } from '@/types/constants'

/**
 * 创建导航项目
 */
export function createNavigationItem(data: Partial<NavigationSubItem> = {}): NavigationSubItem {
  return {
    id: data.id || generateId(),
    title: data.title || '',
    titleEn: data.titleEn,
    description: data.description || '',
    descriptionEn: data.descriptionEn,
    icon: data.icon || '',
    href: data.href || '',
    enabled: data.enabled ?? true,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    tags: data.tags || [],
    category: data.category,
  }
}

/**
 * 创建导航子分类
 */
export function createNavigationSubCategory(
  data: Partial<NavigationSubCategory> = {}
): NavigationSubCategory {
  return {
    id: data.id || generateId(),
    title: data.title || '',
    titleEn: data.titleEn,
    description: data.description,
    icon: data.icon,
    items: data.items || [],
    enabled: data.enabled ?? true,
    order: data.order || 0,
  }
}

/**
 * 创建导航分类
 */
export function createNavigationCategory(
  data: Partial<NavigationCategory> = {}
): NavigationCategory {
  return {
    id: data.id || generateId(),
    title: data.title || '',
    titleEn: data.titleEn,
    icon: data.icon,
    description: data.description,
    descriptionEn: data.descriptionEn,
    items: data.items || [],
    subCategories: data.subCategories || [],
    enabled: data.enabled ?? true,
    order: data.order || 0,
    parentId: data.parentId,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  }
}

/**
 * 创建站点配置
 */
export function createSiteConfig(data: Partial<SiteConfig> = {}): SiteConfig {
  return {
    basic: {
      ...DEFAULT_SITE_CONFIG.basic,
      ...data.basic,
    },
    appearance: {
      ...DEFAULT_SITE_CONFIG.appearance,
      ...data.appearance,
    },
    seo: data.seo || {
      enableSeo: true,
    },
    features: data.features || {
      enableSearch: true,
      enableThemeToggle: true,
      enableI18n: false,
      enablePwa: false,
      enableComments: false,
    },
    version: data.version || '1.0.0',
    lastUpdated: data.lastUpdated || new Date().toISOString(),
  }
}

/**
 * 创建资源项目
 */
export function createResourceItem(data: Partial<ResourceItem> = {}): ResourceItem {
  return {
    title: data.title || '',
    description: data.description || '',
    icon: data.icon || '',
    url: data.url || '',
  }
}

/**
 * 创建资源分类
 */
export function createResourceSection(data: Partial<ResourceSection> = {}): ResourceSection {
  return {
    id: data.id || generateId(),
    title: data.title || '',
    items: data.items || [],
  }
}

/**
 * 创建搜索结果
 */
export function createSearchResult(data: Partial<SearchResult> = {}): SearchResult {
  return {
    category: data.category || createNavigationCategory(),
    items: data.items || [],
    subCategories: data.subCategories || [],
    score: data.score || 0,
  }
}

/**
 * 创建导航统计数据
 */
export function createNavigationStats(data: Partial<NavigationStats> = {}): NavigationStats {
  return {
    totalCategories: data.totalCategories || 0,
    totalSubCategories: data.totalSubCategories || 0,
    totalItems: data.totalItems || 0,
    enabledItems: data.enabledItems || 0,
    disabledItems: data.disabledItems || 0,
    lastUpdated: data.lastUpdated || new Date().toISOString(),
  }
}

/**
 * 创建系统统计数据
 */
export function createSystemStats(data: Partial<SystemStats> = {}): SystemStats {
  return {
    navigation: data.navigation || createNavigationStats(),
    storage: data.storage || {
      used: 0,
      total: 0,
      files: 0,
    },
    performance: data.performance || {
      loadTime: 0,
      renderTime: 0,
      apiCalls: 0,
    },
  }
}

/**
 * 创建默认导航数据
 */
export function createDefaultNavigationData(): NavigationCategory[] {
  return [
    createNavigationCategory({
      id: 'dev-tools',
      title: '开发工具',
      icon: '🛠️',
      description: '开发相关工具和资源',
      items: [
        createNavigationItem({
          id: 'github',
          title: 'GitHub',
          description: '代码托管平台',
          icon: 'https://github.com/favicon.ico',
          href: 'https://github.com',
        }),
        createNavigationItem({
          id: 'vscode',
          title: 'Visual Studio Code',
          description: '轻量级代码编辑器',
          icon: 'https://code.visualstudio.com/favicon.ico',
          href: 'https://code.visualstudio.com',
        }),
      ],
    }),
    createNavigationCategory({
      id: 'design',
      title: '设计资源',
      icon: '🎨',
      description: '设计工具和资源',
      items: [
        createNavigationItem({
          id: 'figma',
          title: 'Figma',
          description: '在线设计工具',
          icon: 'https://www.figma.com/favicon.ico',
          href: 'https://www.figma.com',
        }),
      ],
    }),
  ]
}

/**
 * 克隆导航项目
 */
export function cloneNavigationItem(item: NavigationSubItem): NavigationSubItem {
  return createNavigationItem({
    ...item,
    id: generateId(),
    title: `${item.title} (副本)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

/**
 * 克隆导航分类
 */
export function cloneNavigationCategory(category: NavigationCategory): NavigationCategory {
  return createNavigationCategory({
    ...category,
    id: generateId(),
    title: `${category.title} (副本)`,
    items: category.items.map(item => cloneNavigationItem(item)),
    subCategories: category.subCategories?.map(sub =>
      createNavigationSubCategory({
        ...sub,
        id: generateId(),
        items: sub.items.map(item => cloneNavigationItem(item)),
      })
    ),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

/**
 * 更新导航项目时间戳
 */
export function updateNavigationItemTimestamp(item: NavigationSubItem): NavigationSubItem {
  return {
    ...item,
    updatedAt: new Date().toISOString(),
  }
}

/**
 * 更新导航分类时间戳
 */
export function updateNavigationCategoryTimestamp(
  category: NavigationCategory
): NavigationCategory {
  return {
    ...category,
    updatedAt: new Date().toISOString(),
  }
}

/**
 * 计算导航统计数据
 */
export function calculateNavigationStats(categories: NavigationCategory[]): NavigationStats {
  let totalCategories = 0
  let totalSubCategories = 0
  let totalItems = 0
  let enabledItems = 0
  let disabledItems = 0

  categories.forEach(category => {
    if (category.enabled) {
      totalCategories++
    }

    // 统计主分类下的项目
    category.items.forEach(item => {
      totalItems++
      if (item.enabled) {
        enabledItems++
      } else {
        disabledItems++
      }
    })

    // 统计子分类
    if (category.subCategories) {
      category.subCategories.forEach(subCategory => {
        if (subCategory.enabled) {
          totalSubCategories++
        }

        // 统计子分类下的项目
        subCategory.items.forEach(item => {
          totalItems++
          if (item.enabled) {
            enabledItems++
          } else {
            disabledItems++
          }
        })
      })
    }
  })

  return createNavigationStats({
    totalCategories,
    totalSubCategories,
    totalItems,
    enabledItems,
    disabledItems,
  })
}