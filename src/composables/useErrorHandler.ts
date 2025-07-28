/**
 * 错误处理组合式函数
 */

import { ref, readonly } from 'vue'
import type { AppError, ErrorCodes } from '@/types'
import { useAppStore } from '@/stores'
import { notification } from './useNotification'
import { errorHandler as globalErrorHandler } from '@/services/errorHandler'

export function useErrorHandler() {
  const appStore = useAppStore()
  const errors = ref<AppError[]>([])

  /**
   * 处理错误
   */
  const handleError = (error: Error | AppError, context?: string) => {
    // 使用全局错误处理服务
    const appError = globalErrorHandler.handleError(error, {
      context,
      showNotification: true,
      logToConsole: true,
    })

    // 添加到本地错误列表
    errors.value.push(appError)

    // 限制错误列表长度
    if (errors.value.length > 50) {
      errors.value = errors.value.slice(-50)
    }

    // 调用全局错误处理
    appStore.handleGlobalError(error, context)

    return appError
  }

  /**
   * 创建错误
   */
  const createError = (
    code: string,
    message: string,
    details?: any
  ): AppError => {
    return {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * 处理异步操作错误
   */
  const handleAsync = async <T>(
    operation: () => Promise<T>,
    context?: string,
    options: {
      showNotification?: boolean
      retryable?: boolean
      fallback?: T
    } = {}
  ): Promise<T | null> => {
    try {
      return await operation()
    } catch (error: any) {
      const appError = handleError(error, context)

      if (options.showNotification !== false) {
        notification.error('操作失败', appError.message)
      }

      if (options.fallback !== undefined) {
        return options.fallback
      }

      return null
    }
  }

  /**
   * 重试操作
   */
  const retry = async <T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 1000,
    context?: string
  ): Promise<T> => {
    return globalErrorHandler.withRetry(
      operation,
      {
        maxRetries,
        delay,
        backoff: true,
      },
      {
        context,
        showNotification: true,
      }
    )
  }

  /**
   * 处理网络错误
   */
  const handleNetworkError = (error: Error, networkInfo?: any) => {
    return globalErrorHandler.handleNetworkError(error, networkInfo, {
      showNotification: true,
      logToConsole: true,
    })
  }

  /**
   * 处理认证错误
   */
  const handleAuthError = (error: Error) => {
    return globalErrorHandler.handleAuthError(error, {
      showNotification: true,
      logToConsole: true,
    })
  }

  /**
   * 处理数据验证错误
   */
  const handleValidationError = (validationErrors: Array<{ field: string; message: string; code?: string }>) => {
    return globalErrorHandler.handleValidationError(validationErrors, {
      showNotification: true,
      logToConsole: true,
    })
  }

  /**
   * 清除错误
   */
  const clearErrors = () => {
    errors.value = []
  }

  /**
   * 清除特定错误
   */
  const clearError = (index: number) => {
    if (index >= 0 && index < errors.value.length) {
      errors.value.splice(index, 1)
    }
  }

  /**
   * 获取错误统计
   */
  const getErrorStats = () => {
    const errorCounts: Record<string, number> = {}
    
    errors.value.forEach(error => {
      errorCounts[error.code] = (errorCounts[error.code] || 0) + 1
    })

    return {
      total: errors.value.length,
      byCode: errorCounts,
      recent: errors.value.slice(-10),
      oldest: errors.value[0],
      newest: errors.value[errors.value.length - 1],
    }
  }

  /**
   * 导出错误日志
   */
  const exportErrorLog = () => {
    return {
      errors: errors.value,
      stats: getErrorStats(),
      exportedAt: new Date().toISOString(),
    }
  }

  /**
   * 检查是否有特定类型的错误
   */
  const hasErrorType = (code: string) => {
    return errors.value.some(error => error.code === code)
  }

  /**
   * 获取最近的错误
   */
  const getRecentErrors = (count = 10) => {
    return errors.value.slice(-count)
  }

  return {
    errors: readonly(errors),
    handleError,
    createError,
    handleAsync,
    retry,
    handleNetworkError,
    handleAuthError,
    handleValidationError,
    clearErrors,
    clearError,
    getErrorStats,
    exportErrorLog,
    hasErrorType,
    getRecentErrors,
  }
}

// 全局错误处理实例
export const globalErrorHandler = useErrorHandler()