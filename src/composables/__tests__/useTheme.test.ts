/**
 * useTheme Composable 测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import { useTheme, useThemePersistence, useThemeAnimation } from '../useTheme'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

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

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: matchMediaMock,
})

describe('useTheme', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    document.documentElement.className = ''
    document.body.className = ''
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('基本功能', () => {
    it('应该提供响应式主题状态', () => {
      const {
        theme,
        currentTheme,
        isDark,
        isTransitioning,
        themeIcon,
        themeLabel,
      } = useTheme()

      expect(theme.value).toBe('system')
      expect(currentTheme.value).toBe('light')
      expect(isDark.value).toBe(false)
      expect(isTransitioning.value).toBe(false)
      expect(themeIcon.value).toBe('monitor')
      expect(themeLabel.value).toBe('跟随系统')
    })

    it('应该提供主题选项', () => {
      const { themeOptions } = useTheme()

      expect(themeOptions.value).toHaveLength(3)
      expect(themeOptions.value[0]).toEqual({
        value: 'light',
        label: '浅色主题',
        icon: 'sun',
        description: '始终使用浅色主题',
      })
    })

    it('应该提供主题操作方法', () => {
      const {
        setTheme,
        toggleTheme,
        resetTheme,
        getThemeConfig,
      } = useTheme()

      expect(typeof setTheme).toBe('function')
      expect(typeof toggleTheme).toBe('function')
      expect(typeof resetTheme).toBe('function')
      expect(typeof getThemeConfig).toBe('function')
    })
  })

  describe('主题监听', () => {
    it('应该监听主题变化', async () => {
      const { onThemeChange, setTheme } = useTheme()
      
      const callback = vi.fn()
      const unwatch = onThemeChange(callback)

      // 初始调用
      expect(callback).toHaveBeenCalledWith('system', 'light')

      // 主题变化
      await setTheme('dark')
      await nextTick()

      expect(callback).toHaveBeenCalledWith('dark', 'dark')

      unwatch()
    })

    it('应该监听系统主题变化', async () => {
      const { onSystemThemeChange } = useTheme()
      
      const callback = vi.fn()
      const unwatch = onSystemThemeChange(callback)

      // 初始调用
      expect(callback).toHaveBeenCalledWith('light')

      unwatch()
    })

    it('应该监听过渡状态变化', async () => {
      const { onTransitionChange } = useTheme()
      
      const callback = vi.fn()
      const unwatch = onTransitionChange(callback)

      // 初始调用
      expect(callback).toHaveBeenCalledWith(false)

      unwatch()
    })
  })

  describe('工具方法', () => {
    it('应该检查系统主题支持', () => {
      const { supportsSystemTheme } = useTheme()

      matchMediaMock.mockReturnValue({
        media: '(prefers-color-scheme)',
      })

      expect(supportsSystemTheme()).toBe(true)
    })

    it('应该检查深色模式支持', () => {
      const { supportsDarkMode } = useTheme()

      matchMediaMock.mockReturnValue({
        matches: true,
      })

      expect(supportsDarkMode()).toBe(true)
    })

    it('应该生成主题 CSS 类', () => {
      const { getThemeClasses, setTheme } = useTheme()

      // 浅色主题
      expect(getThemeClasses('base-class')).toBe('base-class')

      // 深色主题
      setTheme('dark')
      expect(getThemeClasses('base-class')).toContain('base-class')
      expect(getThemeClasses('base-class')).toContain('dark')
    })

    it('应该生成主题样式变量', () => {
      const { getThemeStyles } = useTheme()

      const styles = getThemeStyles()

      expect(styles).toEqual({
        '--theme-transition-duration': '0.3s',
        '--theme-transition-timing': 'ease',
      })
    })
  })
})

describe('useThemePersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('主题持久化', () => {
    it('应该保存主题偏好', () => {
      const { saveThemePreference } = useThemePersistence()

      const result = saveThemePreference('dark', { custom: 'data' })

      expect(result).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'navsphere-theme',
        expect.stringContaining('"theme":"dark"')
      )
    })

    it('应该加载主题偏好', () => {
      const { loadThemePreference } = useThemePersistence()

      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        theme: 'dark',
        version: '1.0',
        timestamp: Date.now(),
        metadata: { custom: 'data' },
      }))

      const result = loadThemePreference()

      expect(result).toEqual({
        theme: 'dark',
        metadata: { custom: 'data' },
      })
    })

    it('应该处理无效的存储数据', () => {
      const { loadThemePreference } = useThemePersistence()

      localStorageMock.getItem.mockReturnValue('invalid-json')

      const result = loadThemePreference()

      expect(result).toBeNull()
    })

    it('应该处理版本不兼容', () => {
      const { loadThemePreference } = useThemePersistence()

      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        theme: 'dark',
        version: '0.9',
      }))

      const result = loadThemePreference()

      expect(result).toBeNull()
    })

    it('应该清除主题偏好', () => {
      const { clearThemePreference } = useThemePersistence()

      const result = clearThemePreference()

      expect(result).toBe(true)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('navsphere-theme')
    })

    it('应该检查存储可用性', () => {
      const { isStorageAvailable } = useThemePersistence()

      expect(isStorageAvailable()).toBe(true)

      // 模拟存储不可用
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage not available')
      })

      expect(isStorageAvailable()).toBe(false)
    })
  })

  describe('错误处理', () => {
    it('应该处理保存错误', () => {
      const { saveThemePreference } = useThemePersistence()

      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const result = saveThemePreference('dark')

      expect(result).toBe(false)
    })

    it('应该处理清除错误', () => {
      const { clearThemePreference } = useThemePersistence()

      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const result = clearThemePreference()

      expect(result).toBe(false)
    })
  })
})

describe('useThemeAnimation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.documentElement.className = ''
  })

  describe('动画控制', () => {
    it('应该执行主题切换动画', async () => {
      const { animateThemeChange } = useThemeAnimation()

      // Mock setTimeout
      vi.useFakeTimers()

      const animationPromise = animateThemeChange()

      // 检查动画类是否添加
      expect(document.documentElement.classList.contains('theme-switching')).toBe(true)

      // 快进时间
      vi.advanceTimersByTime(300)
      await animationPromise

      // 检查动画类是否移除
      expect(document.documentElement.classList.contains('theme-switching')).toBe(false)

      vi.useRealTimers()
    })

    it('应该对指定元素执行动画', async () => {
      const { animateThemeChange } = useThemeAnimation()

      const element = document.createElement('div')
      document.body.appendChild(element)

      vi.useFakeTimers()

      const animationPromise = animateThemeChange(element)

      expect(element.classList.contains('theme-switching')).toBe(true)

      vi.advanceTimersByTime(300)
      await animationPromise

      expect(element.classList.contains('theme-switching')).toBe(false)

      vi.useRealTimers()
      document.body.removeChild(element)
    })

    it('应该禁用过渡动画', () => {
      const { disableTransitions } = useThemeAnimation()

      // Mock requestAnimationFrame
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        cb(0)
        return 0
      })

      disableTransitions()

      expect(document.documentElement.classList.contains('theme-transition-disabled')).toBe(false)

      rafSpy.mockRestore()
    })

    it('应该启用过渡动画', () => {
      const { enableTransitions } = useThemeAnimation()

      enableTransitions()

      expect(document.documentElement.classList.contains('theme-transition')).toBe(true)
    })
  })
})