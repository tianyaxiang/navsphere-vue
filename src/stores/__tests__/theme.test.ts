/**
 * 主题 Store 测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useThemeStore } from '../theme'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

// Mock matchMedia
const matchMediaMock = vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: matchMediaMock,
})

describe('useThemeStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    
    // Reset DOM
    document.documentElement.className = ''
    document.body.className = ''
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('初始化', () => {
    it('应该使用默认主题 system', () => {
      const themeStore = useThemeStore()
      expect(themeStore.theme).toBe('system')
    })

    it('应该从 localStorage 加载保存的主题', () => {
      localStorageMock.getItem.mockReturnValue('dark')
      
      const themeStore = useThemeStore()
      themeStore.initializeTheme()
      
      expect(themeStore.theme).toBe('dark')
    })

    it('应该忽略无效的保存主题', () => {
      localStorageMock.getItem.mockReturnValue('invalid-theme')
      
      const themeStore = useThemeStore()
      themeStore.initializeTheme()
      
      expect(themeStore.theme).toBe('system')
    })

    it('应该检测系统主题', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })
      
      const themeStore = useThemeStore()
      themeStore.initializeTheme()
      
      expect(themeStore.systemTheme).toBe('dark')
    })
  })

  describe('主题设置', () => {
    it('应该设置新主题', async () => {
      const themeStore = useThemeStore()
      
      await themeStore.setTheme('dark')
      
      expect(themeStore.theme).toBe('dark')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('navsphere-theme', 'dark')
    })

    it('应该跳过相同主题的设置', async () => {
      const themeStore = useThemeStore()
      themeStore.theme = 'dark'
      
      await themeStore.setTheme('dark')
      
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })

    it('应该触发主题变化事件', async () => {
      const themeStore = useThemeStore()
      const eventSpy = vi.spyOn(window, 'dispatchEvent')
      
      await themeStore.setTheme('dark')
      
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'theme-changed',
          detail: expect.objectContaining({
            theme: 'dark',
            currentTheme: 'dark'
          })
        })
      )
    })
  })

  describe('主题切换', () => {
    it('应该循环切换主题', () => {
      const themeStore = useThemeStore()
      
      // light -> dark
      themeStore.theme = 'light'
      themeStore.toggleTheme()
      expect(themeStore.theme).toBe('dark')
      
      // dark -> system
      themeStore.toggleTheme()
      expect(themeStore.theme).toBe('system')
      
      // system -> light
      themeStore.toggleTheme()
      expect(themeStore.theme).toBe('light')
    })
  })

  describe('计算属性', () => {
    it('应该正确计算当前主题', () => {
      const themeStore = useThemeStore()
      
      // 直接主题
      themeStore.theme = 'dark'
      expect(themeStore.currentTheme).toBe('dark')
      
      // 系统主题
      themeStore.theme = 'system'
      themeStore.systemTheme = 'light'
      expect(themeStore.currentTheme).toBe('light')
    })

    it('应该正确计算 isDark', () => {
      const themeStore = useThemeStore()
      
      themeStore.theme = 'dark'
      expect(themeStore.isDark).toBe(true)
      
      themeStore.theme = 'light'
      expect(themeStore.isDark).toBe(false)
    })

    it('应该正确计算主题图标', () => {
      const themeStore = useThemeStore()
      
      themeStore.theme = 'light'
      expect(themeStore.themeIcon).toBe('sun')
      
      themeStore.theme = 'dark'
      expect(themeStore.themeIcon).toBe('moon')
      
      themeStore.theme = 'system'
      expect(themeStore.themeIcon).toBe('monitor')
    })

    it('应该正确计算主题标签', () => {
      const themeStore = useThemeStore()
      
      themeStore.theme = 'light'
      expect(themeStore.themeLabel).toBe('浅色主题')
      
      themeStore.theme = 'dark'
      expect(themeStore.themeLabel).toBe('深色主题')
      
      themeStore.theme = 'system'
      expect(themeStore.themeLabel).toBe('跟随系统')
    })
  })

  describe('DOM 操作', () => {
    it('应该应用主题类到 DOM', async () => {
      const themeStore = useThemeStore()
      
      themeStore.theme = 'dark'
      await themeStore.applyTheme()
      
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.body.classList.contains('dark')).toBe(true)
    })

    it('应该移除主题类', async () => {
      const themeStore = useThemeStore()
      
      // 先添加 dark 类
      document.documentElement.classList.add('dark')
      document.body.classList.add('dark')
      
      themeStore.theme = 'light'
      await themeStore.applyTheme()
      
      expect(document.documentElement.classList.contains('dark')).toBe(false)
      expect(document.body.classList.contains('dark')).toBe(false)
    })

    it('应该设置主题属性', async () => {
      const themeStore = useThemeStore()
      
      themeStore.theme = 'dark'
      await themeStore.applyTheme()
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
      expect(document.documentElement.getAttribute('data-theme-preference')).toBe('dark')
    })
  })

  describe('工具方法', () => {
    it('应该重置主题', () => {
      const themeStore = useThemeStore()
      
      themeStore.theme = 'dark'
      themeStore.resetTheme()
      
      expect(themeStore.theme).toBe('system')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('navsphere-theme')
    })

    it('应该检查系统主题支持', () => {
      const themeStore = useThemeStore()
      
      // Mock 支持
      matchMediaMock.mockReturnValue({
        media: '(prefers-color-scheme)',
      })
      
      expect(themeStore.supportsSystemTheme()).toBe(true)
      
      // Mock 不支持
      matchMediaMock.mockReturnValue({
        media: 'not all',
      })
      
      expect(themeStore.supportsSystemTheme()).toBe(false)
    })

    it('应该获取主题配置', () => {
      const themeStore = useThemeStore()
      
      themeStore.theme = 'dark'
      themeStore.systemTheme = 'light'
      
      const config = themeStore.getThemeConfig()
      
      expect(config).toEqual({
        current: 'dark',
        resolved: 'dark',
        system: 'light',
        isDark: true,
        isTransitioning: false,
        icon: 'moon',
        label: '深色主题',
      })
    })
  })

  describe('错误处理', () => {
    it('应该处理 localStorage 错误', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error')
      })
      
      const themeStore = useThemeStore()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      await themeStore.setTheme('dark')
      
      // 主题应该仍然设置成功
      expect(themeStore.theme).toBe('dark')
      
      consoleSpy.mockRestore()
    })

    it('应该处理 matchMedia 错误', () => {
      matchMediaMock.mockImplementation(() => {
        throw new Error('matchMedia error')
      })
      
      const themeStore = useThemeStore()
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      themeStore.initializeTheme()
      
      // 应该回退到默认主题
      expect(themeStore.systemTheme).toBe('light')
      
      consoleSpy.mockRestore()
    })
  })
})