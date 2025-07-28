/**
 * 全局错误处理服务
 */

import { ref, readonly } from 'vue'
import type { AppError, ErrorCodes } from '@/types'
import { notification } from '@/composables/useNotification'
import { ERROR_MESSAGES } from '@/types/constants'

interface ErrorHandlerOptions {
  showNotification?: boolean
  logToConsole?: boolean
  reportToService?: boolean
  context?: string
}

interface RetryOptions {
  maxRetries?: number
  delay?: number
  backoff?: boolean
  onRetry?: (attempt: number, error: Error) => void
}

interface NetworkErrorInfo {
  url?: string
  method?: string
  status?: number
  statusText?: string
  timestamp: number
}

class ErrorHandlerService {
  private errors = ref<AppError[]>([])
  private networkErrors = ref<NetworkErrorInfo[]>([])
  private retryQueue = new Map<string, RetryOptions>()

  /**
   * 处理错误
   */
  handleError(
    error: Error | AppError,
    options: ErrorHandlerOptions = {}
  ): AppError {
    const {
      showNotification = true,
      logToConsole = true,
      reportToService = false,
      context,
    } = options

    let appError: AppError

    // 转换为 AppError 格式
    if ('code' in error) {
      appError = error as AppError
    } else {
      appError = this.createAppError(error, context)
    }

    // 添加到错误列表
    this.addError(appError)

    // 控制台日志
    if (logToConsole) {
      console.error(`[ErrorHandler]${context ? ` [${context}]` : ''}:`, appError)
    }

    // 显示通知
    if (showNotification) {
      this.showErrorNotification(appError)
    }

    // 报告到服务
    if (reportToService) {
      this.reportError(appError)
    }

    return appError
  }

  /**
   * 处理网络错误
   */
  handleNetworkError(
    error: Error,
    networkInfo?: Partial<NetworkErrorInfo>,
    options: ErrorHandlerOptions = {}
  ): AppError {
    const networkError: NetworkErrorInfo = {
      timestamp: Date.now(),
      ...networkInfo,
    }

    this.networkErrors.value.push(networkError)

    // 限制网络错误记录数量
    if (this.networkErrors.value.length > 100) {
      this.networkErrors.value = this.networkErrors.value.slice(-100)
    }

    const appError = this.createAppError(error, 'Network')
    appError.code = 'NETWORK_ERROR'
    appError.details = { ...appError.details, networkInfo: networkError }

    return this.handleError(appError, {
      ...options,
      showNotification: options.showNotification !== false,
    })
  }

  /**
   * 处理认证错误
   */
  handleAuthError(error: Error, options: ErrorHandlerOptions = {}): AppError {
    const appError = this.createAppError(error, 'Authentication')
    appError.code = 'AUTH_ERROR'

    // 认证错误需要特殊处理
    this.handleError(appError, {
      ...options,
      showNotification: true,
    })

    // 触发登出流程
    this.triggerLogout()

    return appError
  }

  /**
   * 处理验证错误
   */
  handleValidationError(
    errors: Array<{ field: string; message: string; code?: string }>,
    options: ErrorHandlerOptions = {}
  ): AppError {
    const appError: AppError = {
      code: 'VALIDATION_ERROR',
      message: `数据验证失败: ${errors.length} 个错误`,
      details: { validationErrors: errors },
      timestamp: new Date().toISOString(),
    }

    return this.handleError(appError, {
      ...options,
      showNotification: options.showNotification !== false,
    })
  }

  /**
   * 带重试的异步操作
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    retryOptions: RetryOptions = {},
    errorOptions: ErrorHandlerOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      delay = 1000,
      backoff = true,
      onRetry,
    } = retryOptions

    let lastError: Error
    let currentDelay = delay

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error: any) {
        lastError = error

        if (attempt < maxRetries) {
          // 调用重试回调
          if (onRetry) {
            onRetry(attempt, error)
          }

          // 等待后重试
          await this.delay(currentDelay)

          // 指数退避
          if (backoff) {
            currentDelay *= 2
          }
        }
      }
    }

    // 所有重试都失败了
    const appError = this.handleError(lastError!, {
      ...errorOptions,
      context: `${errorOptions.context || 'Retry'} (${maxRetries} attempts)`,
    })

    throw appError
  }

  /**
   * 网络请求重试
   */
  async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retryOptions: RetryOptions = {}
  ): Promise<Response> {
    return this.withRetry(
      async () => {
        const response = await fetch(url, options)
        
        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
          this.handleNetworkError(error, {
            url,
            method: options.method || 'GET',
            status: response.status,
            statusText: response.statusText,
          })
          throw error
        }

        return response
      },
      {
        maxRetries: 3,
        delay: 1000,
        backoff: true,
        ...retryOptions,
        onRetry: (attempt, error) => {
          console.warn(`网络请求重试 ${attempt}/${retryOptions.maxRetries || 3}: ${url}`, error.message)
          retryOptions.onRetry?.(attempt, error)
        },
      },
      {
        context: 'Network Request',
        showNotification: false, // 网络重试时不显示通知
      }
    )
  }

  /**
   * 创建 AppError
   */
  private createAppError(error: Error, context?: string): AppError {
    return {
      code: this.getErrorCode(error),
      message: error.message || ERROR_MESSAGES.UNKNOWN_ERROR,
      details: {
        stack: error.stack,
        name: error.name,
        context,
      },
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * 获取错误代码
   */
  private getErrorCode(error: Error): string {
    if (error.message.includes('fetch')) return 'NETWORK_ERROR'
    if (error.message.includes('401') || error.message.includes('Unauthorized')) return 'AUTH_ERROR'
    if (error.message.includes('403') || error.message.includes('Forbidden')) return 'PERMISSION_DENIED'
    if (error.message.includes('404') || error.message.includes('Not Found')) return 'NOT_FOUND'
    if (error.message.includes('timeout')) return 'TIMEOUT_ERROR'
    return 'UNKNOWN_ERROR'
  }

  /**
   * 添加错误到列表
   */
  private addError(error: AppError) {
    this.errors.value.push(error)

    // 限制错误列表长度
    if (this.errors.value.length > 100) {
      this.errors.value = this.errors.value.slice(-100)
    }
  }

  /**
   * 显示错误通知
   */
  private showErrorNotification(error: AppError) {
    const title = this.getErrorTitle(error.code)
    const message = error.message

    switch (error.code) {
      case 'NETWORK_ERROR':
        notification.error(title, message, { duration: 5000 })
        break
      case 'AUTH_ERROR':
        notification.error(title, message, { duration: 0 }) // 不自动关闭
        break
      case 'VALIDATION_ERROR':
        notification.warning(title, message, { duration: 6000 })
        break
      default:
        notification.error(title, message)
    }
  }

  /**
   * 获取错误标题
   */
  private getErrorTitle(code: string): string {
    const titles: Record<string, string> = {
      NETWORK_ERROR: '网络错误',
      AUTH_ERROR: '认证错误',
      VALIDATION_ERROR: '验证错误',
      PERMISSION_DENIED: '权限不足',
      NOT_FOUND: '资源不存在',
      TIMEOUT_ERROR: '请求超时',
      UNKNOWN_ERROR: '未知错误',
    }

    return titles[code] || '错误'
  }

  /**
   * 报告错误到服务
   */
  private async reportError(error: AppError) {
    try {
      // 这里可以实现错误报告逻辑
      // 例如发送到错误监控服务
      console.log('报告错误:', error)
    } catch (reportError) {
      console.error('报告错误失败:', reportError)
    }
  }

  /**
   * 触发登出
   */
  private triggerLogout() {
    // 这里可以触发登出逻辑
    // 通过事件系统或直接调用 auth store
    window.dispatchEvent(new CustomEvent('auth:logout'))
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 清除错误
   */
  clearErrors() {
    this.errors.value = []
  }

  /**
   * 清除网络错误
   */
  clearNetworkErrors() {
    this.networkErrors.value = []
  }

  /**
   * 获取错误统计
   */
  getErrorStats() {
    const errorCounts: Record<string, number> = {}
    
    this.errors.value.forEach(error => {
      errorCounts[error.code] = (errorCounts[error.code] || 0) + 1
    })

    return {
      total: this.errors.value.length,
      byCode: errorCounts,
      networkErrors: this.networkErrors.value.length,
      recent: this.errors.value.slice(-10),
    }
  }

  /**
   * 导出错误日志
   */
  exportErrorLog() {
    return {
      errors: this.errors.value,
      networkErrors: this.networkErrors.value,
      stats: this.getErrorStats(),
      exportedAt: new Date().toISOString(),
    }
  }

  /**
   * 获取只读的错误列表
   */
  get errorList() {
    return readonly(this.errors)
  }

  /**
   * 获取只读的网络错误列表
   */
  get networkErrorList() {
    return readonly(this.networkErrors)
  }
}

// 创建全局实例
export const errorHandler = new ErrorHandlerService()

// 导出类型
export type { ErrorHandlerOptions, RetryOptions, NetworkErrorInfo }