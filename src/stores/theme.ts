import { defineStore } from 'pinia'
import { ref, computed, watch, nextTick, readonly } from 'vue'

export type Theme = 'light' | 'dark' | 'system'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>('system')
  const systemTheme = ref<'light' | 'dark'>('light')
  const isTransitioning = ref(false)
  const mediaQuery = ref<MediaQueryList | null>(null)

  const currentTheme = computed(() => {
    if (theme.value === 'system') {
      return systemTheme.value
    }
    return theme.value
  })

  const isDark = computed(() => currentTheme.value === 'dark')

  const themeIcon = computed(() => {
    switch (theme.value) {
      case 'light':
        return 'sun'
      case 'dark':
        return 'moon'
      case 'system':
        return 'monitor'
      default:
        return 'monitor'
    }
  })

  const themeLabel = computed(() => {
    switch (theme.value) {
      case 'light':
        return '浅色主题'
      case 'dark':
        return '深色主题'
      case 'system':
        return '跟随系统'
      default:
        return '跟随系统'
    }
  })

  /**
   * 初始化主题系统
   */
  const initializeTheme = () => {
    // 禁用初始过渡动画
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('theme-transition-disabled')
    }

    // 从 localStorage 读取保存的主题偏好
    const savedTheme = localStorage.getItem('navsphere-theme') as Theme
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      theme.value = savedTheme
    }

    // 初始化系统主题检测
    initializeSystemThemeDetection()

    // 应用初始主题
    applyTheme()

    // 启用过渡动画
    if (typeof document !== 'undefined') {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('theme-transition-disabled')
        document.documentElement.classList.add('theme-transition')
      })
    }

    // 监听主题变化
    watch(currentTheme, () => {
      applyTheme()
    })
  }

  /**
   * 初始化系统主题检测
   */
  const initializeSystemThemeDetection = () => {
    if (typeof window === 'undefined') return

    try {
      mediaQuery.value = window.matchMedia('(prefers-color-scheme: dark)')
      systemTheme.value = mediaQuery.value.matches ? 'dark' : 'light'

      // 监听系统主题变化
      const handleSystemThemeChange = (e: MediaQueryListEvent) => {
        systemTheme.value = e.matches ? 'dark' : 'light'
        
        // 如果当前使用系统主题，触发主题应用
        if (theme.value === 'system') {
          applyTheme()
        }
      }

      // 使用现代 API 或回退到旧 API
      if (mediaQuery.value.addEventListener) {
        mediaQuery.value.addEventListener('change', handleSystemThemeChange)
      } else {
        // 兼容旧版浏览器
        mediaQuery.value.addListener(handleSystemThemeChange)
      }
    } catch (error) {
      console.warn('系统主题检测初始化失败:', error)
      systemTheme.value = 'light' // 默认为浅色主题
    }
  }

  /**
   * 设置主题
   */
  const setTheme = async (newTheme: Theme) => {
    if (theme.value === newTheme) return

    // 开始过渡动画
    isTransitioning.value = true

    try {
      theme.value = newTheme
      
      // 保存到 localStorage
      localStorage.setItem('navsphere-theme', newTheme)
      
      // 应用主题
      await applyTheme()
      
      // 触发自定义事件
      window.dispatchEvent(new CustomEvent('theme-changed', {
        detail: { theme: newTheme, currentTheme: currentTheme.value }
      }))
    } catch (error) {
      console.error('设置主题失败:', error)
    } finally {
      // 过渡动画结束
      setTimeout(() => {
        isTransitioning.value = false
      }, 300)
    }
  }

  /**
   * 切换主题（循环切换）
   */
  const toggleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme.value)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  /**
   * 应用主题到 DOM
   */
  const applyTheme = async () => {
    if (typeof document === 'undefined') return

    await nextTick()

    const root = document.documentElement
    const body = document.body

    // 添加过渡类
    if (!root.classList.contains('theme-transition')) {
      root.classList.add('theme-transition')
    }

    // 应用主题类
    const shouldBeDark = currentTheme.value === 'dark'
    
    if (shouldBeDark) {
      root.classList.add('dark')
      body.classList.add('dark')
    } else {
      root.classList.remove('dark')
      body.classList.remove('dark')
    }

    // 设置主题属性
    root.setAttribute('data-theme', currentTheme.value)
    root.setAttribute('data-theme-preference', theme.value)

    // 更新 meta 标签
    updateMetaThemeColor()
  }

  /**
   * 更新 meta 主题颜色
   */
  const updateMetaThemeColor = () => {
    if (typeof document === 'undefined') return

    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    const isDarkTheme = currentTheme.value === 'dark'
    
    const themeColor = isDarkTheme ? '#0f172a' : '#ffffff'
    
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeColor)
    } else {
      const meta = document.createElement('meta')
      meta.name = 'theme-color'
      meta.content = themeColor
      document.head.appendChild(meta)
    }
  }

  /**
   * 获取主题配置
   */
  const getThemeConfig = () => {
    return {
      current: theme.value,
      resolved: currentTheme.value,
      system: systemTheme.value,
      isDark: isDark.value,
      isTransitioning: isTransitioning.value,
      icon: themeIcon.value,
      label: themeLabel.value,
    }
  }

  /**
   * 重置主题设置
   */
  const resetTheme = () => {
    localStorage.removeItem('navsphere-theme')
    theme.value = 'system'
    applyTheme()
  }

  /**
   * 检查是否支持系统主题
   */
  const supportsSystemTheme = () => {
    if (typeof window === 'undefined') return false
    return window.matchMedia && window.matchMedia('(prefers-color-scheme)').media !== 'not all'
  }

  /**
   * 清理资源
   */
  const cleanup = () => {
    if (mediaQuery.value) {
      try {
        if (mediaQuery.value.removeEventListener) {
          mediaQuery.value.removeEventListener('change', () => {})
        } else {
          // 兼容旧版浏览器
          mediaQuery.value.removeListener(() => {})
        }
      } catch (error) {
        console.warn('清理主题监听器失败:', error)
      }
    }
  }

  return {
    // 状态
    theme: readonly(theme),
    systemTheme: readonly(systemTheme),
    currentTheme,
    isDark,
    isTransitioning: readonly(isTransitioning),
    themeIcon,
    themeLabel,

    // 方法
    initializeTheme,
    setTheme,
    toggleTheme,
    applyTheme,
    getThemeConfig,
    resetTheme,
    supportsSystemTheme,
    cleanup,
  }
})