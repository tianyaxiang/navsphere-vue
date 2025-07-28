/**
 * 导航数据状态管理
 */

import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type {
  NavigationCategory,
  NavigationSubItem,
  NavigationStats,
  RequestState,
} from '@/types'
import { DataService } from '@/services/data'
import { notification } from '@/composables/useNotification'

export const useNavigationStore = defineStore('navigation', () => {
  // 状态
  const categories = ref<NavigationCategory[]>([])
  const stats = ref<NavigationStats | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)

  // 计算属性
  const totalCategories = computed(() => categories.value.length)
  const totalItems = computed(() => {
    return categories.value.reduce((total, category) => {
      let count = category.items.length
      if (category.subCategories) {
        count += category.subCategories.reduce((subTotal, sub) => subTotal + sub.items.length, 0)
      }
      return total + count
    }, 0)
  })

  const enabledCategories = computed(() => 
    categories.value.filter(cat => cat.enabled)
  )

  const enabledItems = computed(() => {
    return categories.value.reduce((total, category) => {
      if (!category.enabled) return total
      
      let count = category.items.filter(item => item.enabled).length
      if (category.subCategories) {
        count += category.subCategories.reduce((subTotal, sub) => {
          if (!sub.enabled) return subTotal
          return subTotal + sub.items.filter(item => item.enabled).length
        }, 0)
      }
      return total + count
    }, 0)
  })

  // ==================== 数据加载 ====================

  /**
   * 加载导航数据
   */
  const loadNavigationData = async (force = false) => {
    if (loading.value && !force) return

    try {
      loading.value = true
      error.value = null

      const data = await DataService.getNavigationData()
      categories.value = data
      lastUpdated.value = new Date()

      // 同时加载统计数据
      await loadStats()
    } catch (err: any) {
      console.error('加载导航数据失败:', err)
      error.value = err.message || '加载导航数据失败'
      notification.error('加载失败', error.value)
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载统计数据
   */
  const loadStats = async () => {
    try {
      const statsData = await DataService.getNavigationStats()
      stats.value = statsData
    } catch (err: any) {
      console.error('加载统计数据失败:', err)
    }
  }

  /**
   * 刷新数据
   */
  const refreshData = async () => {
    await loadNavigationData(true)
    notification.success('刷新成功', '导航数据已更新')
  }

  // ==================== 分类管理 ====================

  /**
   * 添加分类
   */
  const addCategory = async (category: NavigationCategory) => {
    try {
      loading.value = true
      error.value = null

      await DataService.addNavigationCategory(category)
      await loadNavigationData(true)
    } catch (err: any) {
      console.error('添加分类失败:', err)
      error.value = err.message || '添加分类失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新分类
   */
  const updateCategory = async (id: string, updates: Partial<NavigationCategory>) => {
    try {
      loading.value = true
      error.value = null

      await DataService.updateNavigationCategory(id, updates)
      
      // 本地更新
      const index = categories.value.findIndex(cat => cat.id === id)
      if (index !== -1) {
        categories.value[index] = { ...categories.value[index], ...updates }
      }
      
      await loadStats()
    } catch (err: any) {
      console.error('更新分类失败:', err)
      error.value = err.message || '更新分类失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除分类
   */
  const deleteCategory = async (id: string) => {
    try {
      loading.value = true
      error.value = null

      await DataService.deleteNavigationCategory(id)
      
      // 本地删除
      categories.value = categories.value.filter(cat => cat.id !== id)
      
      await loadStats()
    } catch (err: any) {
      console.error('删除分类失败:', err)
      error.value = err.message || '删除分类失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 切换分类启用状态
   */
  const toggleCategoryEnabled = async (id: string) => {
    const category = categories.value.find(cat => cat.id === id)
    if (!category) return

    await updateCategory(id, { enabled: !category.enabled })
  }

  // ==================== 项目管理 ====================

  /**
   * 添加项目
   */
  const addItem = async (categoryId: string, item: NavigationSubItem) => {
    try {
      loading.value = true
      error.value = null

      await DataService.addNavigationItem(categoryId, item)
      
      // 本地添加
      const category = categories.value.find(cat => cat.id === categoryId)
      if (category) {
        category.items.push(item)
      }
      
      await loadStats()
    } catch (err: any) {
      console.error('添加项目失败:', err)
      error.value = err.message || '添加项目失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新项目
   */
  const updateItem = async (
    categoryId: string,
    itemId: string,
    updates: Partial<NavigationSubItem>
  ) => {
    try {
      loading.value = true
      error.value = null

      await DataService.updateNavigationItem(categoryId, itemId, updates)
      
      // 本地更新
      const category = categories.value.find(cat => cat.id === categoryId)
      if (category) {
        const itemIndex = category.items.findIndex(item => item.id === itemId)
        if (itemIndex !== -1) {
          category.items[itemIndex] = { ...category.items[itemIndex], ...updates }
        }
      }
      
      await loadStats()
    } catch (err: any) {
      console.error('更新项目失败:', err)
      error.value = err.message || '更新项目失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除项目
   */
  const deleteItem = async (categoryId: string, itemId: string) => {
    try {
      loading.value = true
      error.value = null

      await DataService.deleteNavigationItem(categoryId, itemId)
      
      // 本地删除
      const category = categories.value.find(cat => cat.id === categoryId)
      if (category) {
        category.items = category.items.filter(item => item.id !== itemId)
      }
      
      await loadStats()
    } catch (err: any) {
      console.error('删除项目失败:', err)
      error.value = err.message || '删除项目失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 切换项目启用状态
   */
  const toggleItemEnabled = async (categoryId: string, itemId: string) => {
    const category = categories.value.find(cat => cat.id === categoryId)
    if (!category) return

    const item = category.items.find(item => item.id === itemId)
    if (!item) return

    await updateItem(categoryId, itemId, { enabled: !item.enabled })
  }

  // ==================== 搜索和过滤 ====================

  /**
   * 搜索项目
   */
  const searchItems = (query: string) => {
    if (!query.trim()) return []

    const results: Array<{
      category: NavigationCategory
      item: NavigationSubItem
      score: number
    }> = []

    const searchQuery = query.toLowerCase()

    categories.value.forEach(category => {
      if (!category.enabled) return

      // 搜索主分类项目
      category.items.forEach(item => {
        if (!item.enabled) return

        let score = 0
        const title = item.title.toLowerCase()
        const description = item.description.toLowerCase()

        if (title.includes(searchQuery)) {
          score += title.startsWith(searchQuery) ? 10 : 5
        }
        if (description.includes(searchQuery)) {
          score += 2
        }
        if (item.tags?.some(tag => tag.toLowerCase().includes(searchQuery))) {
          score += 3
        }

        if (score > 0) {
          results.push({ category, item, score })
        }
      })

      // 搜索子分类项目
      category.subCategories?.forEach(subCategory => {
        if (!subCategory.enabled) return

        subCategory.items.forEach(item => {
          if (!item.enabled) return

          let score = 0
          const title = item.title.toLowerCase()
          const description = item.description.toLowerCase()

          if (title.includes(searchQuery)) {
            score += title.startsWith(searchQuery) ? 10 : 5
          }
          if (description.includes(searchQuery)) {
            score += 2
          }
          if (item.tags?.some(tag => tag.toLowerCase().includes(searchQuery))) {
            score += 3
          }

          if (score > 0) {
            results.push({ category, item, score })
          }
        })
      })
    })

    return results.sort((a, b) => b.score - a.score)
  }

  /**
   * 按分类过滤项目
   */
  const getItemsByCategory = (categoryId: string) => {
    const category = categories.value.find(cat => cat.id === categoryId)
    return category?.items.filter(item => item.enabled) || []
  }

  /**
   * 按标签过滤项目
   */
  const getItemsByTag = (tag: string) => {
    const results: Array<{
      category: NavigationCategory
      item: NavigationSubItem
    }> = []

    categories.value.forEach(category => {
      if (!category.enabled) return

      category.items.forEach(item => {
        if (item.enabled && item.tags?.includes(tag)) {
          results.push({ category, item })
        }
      })

      category.subCategories?.forEach(subCategory => {
        if (!subCategory.enabled) return

        subCategory.items.forEach(item => {
          if (item.enabled && item.tags?.includes(tag)) {
            results.push({ category, item })
          }
        })
      })
    })

    return results
  }

  // ==================== 工具方法 ====================

  /**
   * 获取分类
   */
  const getCategoryById = (id: string) => {
    return categories.value.find(cat => cat.id === id)
  }

  /**
   * 获取项目
   */
  const getItemById = (categoryId: string, itemId: string) => {
    const category = getCategoryById(categoryId)
    return category?.items.find(item => item.id === itemId)
  }

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
    categories.value = []
    stats.value = null
    loading.value = false
    error.value = null
    lastUpdated.value = null
  }

  return {
    // 状态
    categories: readonly(categories),
    stats: readonly(stats),
    loading: readonly(loading),
    error: readonly(error),
    lastUpdated: readonly(lastUpdated),

    // 计算属性
    totalCategories,
    totalItems,
    enabledCategories,
    enabledItems,

    // 数据加载
    loadNavigationData,
    loadStats,
    refreshData,

    // 分类管理
    addCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryEnabled,

    // 项目管理
    addItem,
    updateItem,
    deleteItem,
    toggleItemEnabled,

    // 搜索和过滤
    searchItems,
    getItemsByCategory,
    getItemsByTag,

    // 工具方法
    getCategoryById,
    getItemById,
    clearError,
    resetState,
  }
})