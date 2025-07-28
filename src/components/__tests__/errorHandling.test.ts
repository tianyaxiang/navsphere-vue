/**
 * 错误处理功能测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { errorHandler } from '@/services/errorHandler'
import { useRetry } from '@/composables/useRetry'
import ErrorDisplay from '@/components/ui/ErrorDisplay.vue'
import ValidationFeedback from '@/components/ui/ValidationFeedback.vue'
import NetworkStatus from '@/components/ui/NetworkStatus.vue'
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary.vue'
import type { AppError } from '@/types'

// Mock 通知系统
vi.mock('@/composables/useNotification', () => ({
  notification: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

// Mock 路由
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('错误处理服务', () => {
  beforeEach(() => {
    errorHandler.clearErrors()
    errorHandler.clearNetworkErrors()
  })

  describe('基本错误处理', () => {
    it('应该正确处理普通错误', () => {
      const error = new Error('测试错误')
      const appError = errorHandler.handleError(error, {
        context: 'Test',
        showNotification: false,
      })

      expect(appError.code).toBe('UNKNOWN_ERROR')
      expect(appError.message).toBe('测试错误')
      expect(appError.details?.context).toBe('Test')
      expect(appError.timestamp).toBeDefined()
    })

    it('应该正确处理网络错误', () => {
      const error = new Error('网络连接失败')
      const networkInfo = {
        url: 'https://api.example.com',
        method: 'GET',
        status: 0,
        statusText: 'Network Error',
      }

      const appError = errorHandler.handleNetworkError(error, networkInfo, {
        showNotification: false,
      })

      expect(appError.code).toBe('NETWORK_ERROR')
      expect(appError.details?.networkInfo).toEqual(expect.objectContaining(networkInfo))
    })

    it('应该正确处理认证错误', () => {
      const error = new Error('认证失败')
      const appError = errorHandler.handleAuthError(error, {
        showNotification: false,
      })

      expect(appError.code).toBe('AUTH_ERROR')
      expect(appError.message).toBe('认证失败')
    })

    it('应该正确处理验证错误', () => {
      const validationErrors = [
        { field: 'title', message: '标题不能为空', code: 'REQUIRED' },
        { field: 'url', message: 'URL格式不正确', code: 'INVALID_FORMAT' },
      ]

      const appError = errorHandler.handleValidationError(validationErrors, {
        showNotification: false,
      })

      expect(appError.code).toBe('VALIDATION_ERROR')
      expect(appError.details?.validationErrors).toEqual(validationErrors)
    })
  })

  describe('重试机制', () => {
    it('应该在成功前重试指定次数', async () => {
      let attempts = 0
      const operation = vi.fn().mockImplementation(() => {
        attempts++
        if (attempts < 3) {
          throw new Error('模拟失败')
        }
        return '成功'
      })

      const result = await errorHandler.withRetry(operation, {
        maxRetries: 3,
        delay: 10,
        backoff: false,
      }, {
        showNotification: false,
      })

      expect(result).toBe('成功')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('应该在所有重试失败后抛出错误', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('始终失败'))

      await expect(
        errorHandler.withRetry(operation, {
          maxRetries: 2,
          delay: 10,
        }, {
          showNotification: false,
        })
      ).rejects.toThrow()

      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('应该支持指数退避', async () => {
      const delays: number[] = []
      const originalSetTimeout = global.setTimeout

      global.setTimeout = vi.fn().mockImplementation((callback, delay) => {
        delays.push(delay)
        return originalSetTimeout(callback, 0)
      })

      const operation = vi.fn().mockRejectedValue(new Error('失败'))

      try {
        await errorHandler.withRetry(operation, {
          maxRetries: 3,
          delay: 100,
          backoff: true,
        }, {
          showNotification: false,
        })
      } catch (error) {
        // 预期会失败
      }

      expect(delays).toEqual([100, 200])
      global.setTimeout = originalSetTimeout
    })
  })

  describe('网络请求重试', () => {
    it('应该重试失败的网络请求', async () => {
      const mockFetch = vi.fn()
        .mockRejectedValueOnce(new Error('网络错误'))
        .mockResolvedValueOnce(new Response('成功', { status: 200 }))

      global.fetch = mockFetch

      const response = await errorHandler.fetchWithRetry('/test', {}, {
        maxRetries: 2,
        delay: 10,
      })

      expect(response.status).toBe(200)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('应该处理HTTP错误状态', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValue(new Response('Not Found', { status: 404, statusText: 'Not Found' }))

      global.fetch = mockFetch

      await expect(
        errorHandler.fetchWithRetry('/test', {}, {
          maxRetries: 1,
          delay: 10,
        })
      ).rejects.toThrow('HTTP 404: Not Found')
    })
  })

  describe('错误统计', () => {
    it('应该正确统计错误', () => {
      // 添加一些错误
      errorHandler.handleError(new Error('错误1'), { showNotification: false })
      errorHandler.handleError(new Error('错误2'), { showNotification: false })
      errorHandler.handleNetworkError(new Error('网络错误'), {}, { showNotification: false })

      const stats = errorHandler.getErrorStats()

      expect(stats.total).toBe(3)
      expect(stats.networkErrors).toBe(1)
      expect(stats.byCode['UNKNOWN_ERROR']).toBe(2)
      expect(stats.byCode['NETWORK_ERROR']).toBe(1)
    })

    it('应该导出错误日志', () => {
      errorHandler.handleError(new Error('测试错误'), { showNotification: false })

      const log = errorHandler.exportErrorLog()

      expect(log.errors).toHaveLength(1)
      expect(log.stats.total).toBe(1)
      expect(log.exportedAt).toBeDefined()
    })
  })
})

describe('重试组合式函数', () => {
  it('应该正确执行重试操作', async () => {
    const { execute } = useRetry({
      maxAttempts: 3,
      delay: 10,
      backoff: false,
    })

    let attempts = 0
    const operation = vi.fn().mockImplementation(() => {
      attempts++
      if (attempts < 2) {
        throw new Error('失败')
      }
      return '成功'
    })

    const result = await execute(operation)

    expect(result).toBe('成功')
    expect(operation).toHaveBeenCalledTimes(2)
  })

  it('应该提供正确的重试信息', () => {
    const { retryInfo, state } = useRetry({
      maxAttempts: 5,
      delay: 1000,
    })

    expect(retryInfo.value.attemptsLeft).toBe(5)
    expect(retryInfo.value.nextDelay).toBe(1000)
    expect(retryInfo.value.progress).toBe(0)
    expect(state.value.isRetrying).toBe(false)
  })
})

describe('ErrorDisplay 组件', () => {
  it('应该正确渲染错误信息', () => {
    const error: AppError = {
      code: 'NETWORK_ERROR',
      message: '网络连接失败',
      timestamp: new Date().toISOString(),
    }

    const wrapper = mount(ErrorDisplay, {
      props: { error },
    })

    expect(wrapper.text()).toContain('网络连接失败')
    expect(wrapper.text()).toContain('网络连接失败')
  })

  it('应该显示验证错误详情', () => {
    const error: AppError = {
      code: 'VALIDATION_ERROR',
      message: '数据验证失败',
      details: {
        validationErrors: [
          { field: 'title', message: '标题不能为空', code: 'REQUIRED' },
        ],
      },
      timestamp: new Date().toISOString(),
    }

    const wrapper = mount(ErrorDisplay, {
      props: { error },
    })

    expect(wrapper.text()).toContain('验证错误详情')
    expect(wrapper.text()).toContain('标题不能为空')
  })

  it('应该触发重试事件', async () => {
    const error: AppError = {
      code: 'NETWORK_ERROR',
      message: '网络错误',
      timestamp: new Date().toISOString(),
    }

    const wrapper = mount(ErrorDisplay, {
      props: { error, showRetry: true },
    })

    const retryButton = wrapper.find('button')
    await retryButton.trigger('click')

    expect(wrapper.emitted('retry')).toBeTruthy()
  })
})

describe('ValidationFeedback 组件', () => {
  it('应该显示验证错误', () => {
    const errors = [
      { field: 'title', message: '标题不能为空', code: 'REQUIRED' },
      { field: 'url', message: 'URL格式不正确', code: 'INVALID_FORMAT' },
    ]

    const wrapper = mount(ValidationFeedback, {
      props: { errors },
    })

    expect(wrapper.text()).toContain('2 个错误需要修复')
    expect(wrapper.text()).toContain('标题不能为空')
    expect(wrapper.text()).toContain('URL格式不正确')
  })

  it('应该显示验证警告', () => {
    const warnings = [
      { field: 'password', message: '密码强度较弱' },
    ]

    const wrapper = mount(ValidationFeedback, {
      props: { warnings },
    })

    expect(wrapper.text()).toContain('1 个警告')
    expect(wrapper.text()).toContain('密码强度较弱')
  })

  it('应该支持字段标签映射', () => {
    const errors = [
      { field: 'title', message: '不能为空', code: 'REQUIRED' },
    ]

    const fieldLabels = {
      title: '文章标题',
    }

    const wrapper = mount(ValidationFeedback, {
      props: { errors, fieldLabels },
    })

    expect(wrapper.text()).toContain('文章标题')
  })
})

describe('NetworkStatus 组件', () => {
  beforeEach(() => {
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    })
  })

  it('应该显示在线状态', () => {
    const wrapper = mount(NetworkStatus, {
      props: { autoHide: false },
    })

    expect(wrapper.text()).toContain('网络连接正常')
  })

  it('应该响应网络状态变化', async () => {
    const wrapper = mount(NetworkStatus, {
      props: { autoHide: false },
    })

    // 模拟离线
    Object.defineProperty(navigator, 'onLine', {
      value: false,
    })
    window.dispatchEvent(new Event('offline'))

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('网络连接断开')
  })
})

describe('GlobalErrorBoundary 组件', () => {
  it('应该捕获组件错误', () => {
    const ThrowError = {
      template: '<div>{{ throwError() }}</div>',
      methods: {
        throwError() {
          throw new Error('组件错误')
        },
      },
    }

    const wrapper = mount(GlobalErrorBoundary, {
      slots: {
        default: ThrowError,
      },
    })

    // The error boundary should show error state
    expect(wrapper.vm.hasError).toBe(true)
  })

  it('应该在没有错误时渲染子组件', () => {
    const NormalComponent = {
      template: '<div>正常组件</div>',
    }

    const wrapper = mount(GlobalErrorBoundary, {
      slots: {
        default: NormalComponent,
      },
    })

    expect(wrapper.text()).toContain('正常组件')
  })
})