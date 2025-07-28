/**
 * 主题管理 Composable
 * 提供主题相关的响应式状态和方法
 */

import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useThemeStore } from '@/stores/theme'
import type { Theme } from '@/stores/theme'

export function useTheme() {
  const themeStore = useThemeStore()

  // 响应式状态
  const theme = computed(() => themeStore.theme)
  const currentTheme = computed(() => themeStore.currentTheme)
  const isDark = computed(() => themeStore.isDark)
  const isTransitioning = computed(() => themeStore.isTransitioning)
  const themeIcon = computed(() => themeStore.themeIcon)
  const themeLabel = computed(() => themeStore.themeLabel)

  // 主题选项
  const themeOptions = computed(() => [
    {
      value: 'light' as Theme,
      label: '浅色主题',
      icon: 'sun',
      description: '始终使用浅色主题',
    },
    {
      value: 'dark' as Theme,
      label: '深色主题',
      icon: 'moon',
      description: '始终使用深色主题',
    },
    {
      value: 'system' as Theme,
      label: '跟随系统',
      icon: 'monitor',
      description: '根据系统设置自动切换',
    },
  ])

  // 方法
  const setTheme = (newTheme: Theme) => themeStore.setTheme(newTheme)
  const toggleTheme = () => themeStore.toggleTheme()
  const resetTheme = () => themeStore.resetTheme()
  const getThemeConfig = () => themeStore.getThemeConfig()

  // 主题变化监听
  const onThemeChange = (callback: (theme: Theme, currentTheme: 'light' | 'dark') => void) => {
    return watch(
      [theme, currentTheme],
      ([newTheme, newCurrentTheme]) => {
        callback(newTheme, newCurrentTheme)
      },
      { immediate: true }
    )
  }

  // 系统主题变化监听
  const onSystemThemeChange = (callback: (systemTheme: 'light' | 'dark') => void) => {
    return watch(
      () => themeStore.systemTheme,
      (newSystemTheme) => {
        callback(newSystemTheme)
      },
      { immediate: true }
    )
  }

  // 主题过渡状态监听
  const onTransitionChange = (callback: (isTransitioning: boolean) => void) => {
    return watch(
      isTransitioning,
      (newIsTransitioning) => {
        callback(newIsTransitioning)
      },
      { immediate: true }
    )
  }

  // 检查主题支持
  const supportsSystemTheme = () => themeStore.supportsSystemTheme()
  const supportsDarkMode = () => {
    if (typeof window === 'undefined') return false
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches !== undefined
  }

  // 获取主题相关的 CSS 类
  const getThemeClasses = (baseClasses = '') => {
    const classes = [baseClasses]
    
    if (isDark.value) {
      classes.push('dark')
    }
    
    if (isTransitioning.value) {
      classes.push('theme-switching')
    }
    
    return classes.filter(Boolean).join(' ')
  }

  // 获取主题相关的样式变量
  const getThemeStyles = () => {
    return {
      '--theme-transition-duration': '0.3s',
      '--theme-transition-timing': 'ease',
    }
  }

  // 预加载主题资源
  const preloadThemeAssets = async () => {
    // 预加载主题相关的图标或资源
    const icons = ['sun', 'moon', 'monitor']
    
    try {
      await Promise.all(
        icons.map(async (icon) => {
          // 这里可以预加载图标资源
          return Promise.resolve()
        })
      )
    } catch (error) {
      console.warn('预加载主题资源失败:', error)
    }
  }

  // 生命周期钩子
  onMounted(() => {
    preloadThemeAssets()
  })

  onUnmounted(() => {
    themeStore.cleanup()
  })

  return {
    // 状态
    theme,
    currentTheme,
    isDark,
    isTransitioning,
    themeIcon,
    themeLabel,
    themeOptions,

    // 方法
    setTheme,
    toggleTheme,
    resetTheme,
    getThemeConfig,
    getThemeClasses,
    getThemeStyles,

    // 监听器
    onThemeChange,
    onSystemThemeChange,
    onTransitionChange,

    // 工具方法
    supportsSystemTheme,
    supportsDarkMode,
    preloadThemeAssets,
  }
}

/**
 * 主题持久化 Composable
 * 处理主题设置的本地存储
 */
export function useThemePersistence() {
  const STORAGE_KEY = 'navsphere-theme'
  const STORAGE_VERSION = '1.0'

  // 保存主题设置
  const saveThemePreference = (theme: Theme, metadata?: Record<string, any>) => {
    try {
      const data = {
        theme,
        version: STORAGE_VERSION,
        timestamp: Date.now(),
        metadata: metadata || {},
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      return true
    } catch (error) {
      console.error('保存主题偏好失败:', error)
      return false
    }
  }

  // 加载主题设置
  const loadThemePreference = (): { theme: Theme; metadata?: Record<string, any> } | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return null

      const data = JSON.parse(stored)
      
      // 检查版本兼容性
      if (data.version !== STORAGE_VERSION) {
        console.warn('主题设置版本不兼容，使用默认设置')
        return null
      }

      // 验证主题值
      if (!['light', 'dark', 'system'].includes(data.theme)) {
        console.warn('无效的主题设置，使用默认设置')
        return null
      }

      return {
        theme: data.theme,
        metadata: data.metadata || {},
      }
    } catch (error) {
      console.error('加载主题偏好失败:', error)
      return null
    }
  }

  // 清除主题设置
  const clearThemePreference = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      return true
    } catch (error) {
      console.error('清除主题偏好失败:', error)
      return false
    }
  }

  // 检查存储可用性
  const isStorageAvailable = () => {
    try {
      const test = '__theme_storage_test__'
      localStorage.setItem(test, 'test')
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  return {
    saveThemePreference,
    loadThemePreference,
    clearThemePreference,
    isStorageAvailable,
  }
}

/**
 * 主题动画 Composable
 * 处理主题切换时的动画效果
 */
export function useThemeAnimation() {
  // 添加主题切换动画
  const animateThemeChange = async (element?: HTMLElement) => {
    const target = element || document.documentElement
    
    // 添加动画类
    target.classList.add('theme-switching')
    
    // 等待动画完成
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 移除动画类
    target.classList.remove('theme-switching')
  }

  // 禁用过渡动画（用于初始化）
  const disableTransitions = () => {
    document.documentElement.classList.add('theme-transition-disabled')
    
    // 强制重绘
    document.documentElement.offsetHeight
    
    // 下一帧移除禁用类
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('theme-transition-disabled')
    })
  }

  // 启用过渡动画
  const enableTransitions = () => {
    document.documentElement.classList.add('theme-transition')
  }

  return {
    animateThemeChange,
    disableTransitions,
    enableTransitions,
  }
}