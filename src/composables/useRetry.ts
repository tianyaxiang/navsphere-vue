/**
 * 重试机制组合式函数
 */

import { ref, computed } from 'vue'
import { errorHandler } from '@/services/errorHandler'
import { notification } from './useNotification'

interface RetryConfig {
  maxAttempts?: number
  delay?: number
  backoff?: boolean
  backoffMultiplier?: number
  maxDelay?: number
  retryCondition?: (error: Error) => boolean
  onRetry?: (attempt: number, error: Error) => void
  onSuccess?: (result: any, attempts: number) => void
  onFailure?: (error: Error, attempts: number) => void
}

interface RetryState {
  isRetrying: boolean
  currentAttempt: number
  lastError: Error | null
  totalAttempts: number
  successCount: number
  failureCount: number
}

export function useRetry(config: RetryConfig = {}) {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = true,
    backoffMultiplier = 2,
    maxDelay = 30000,
    retryCondition = () => true,
    onRetry,
    onSuccess,
    onFailure,
  } = config

  const state = ref<RetryState>({
    isRetrying: false,
    currentAttempt: 0,
    lastError: null,
    totalAttempts: 0,
    successCount: 0,
    failureCount: 0,
  })

  const canRetry = computed(() => {
    return state.value.currentAttempt < maxAttempts && 
           !state.value.isRetrying &&
           state.value.lastError &&
           retryCondition(state.value.lastError)
  })

  const retryInfo = computed(() => ({
    attemptsLeft: maxAttempts - state.value.currentAttempt,
    nextDelay: calculateDelay(state.value.currentAttempt),
    progress: state.value.currentAttempt / maxAttempts,
  }))

  const stats = computed(() => ({
    totalAttempts: state.value.totalAttempts,
    successCount: state.value.successCount,
    failureCount: state.value.failureCount,
    successRate: state.value.totalAttempts > 0 
      ? state.value.successCount / state.value.totalAttempts 
      : 0,
  }))

  /**
   * 计算延迟时间
   */
  function calculateDelay(attempt: number): number {
    if (!backoff) return delay

    const calculatedDelay = delay * Math.pow(backoffMultiplier, attempt)
    return Math.min(calculatedDelay, maxDelay)
  }

  /**
   * 执行带重试的操作
   */
  async function execute<T>(operation: () => Promise<T>): Promise<T> {
    state.value.isRetrying = true
    state.value.currentAttempt = 0
    state.value.lastError = null

    let lastError: Error

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      state.value.currentAttempt = attempt
      state.value.totalAttempts++

      try {
        const result = await operation()
        
        // 成功
        state.value.successCount++
        state.value.isRetrying = false
        
        if (onSuccess) {
          onSuccess(result, attempt)
        }

        if (attempt > 1) {
          notification.success('操作成功', `经过 ${attempt} 次尝试后成功完成`)
        }

        return result
      } catch (error: any) {
        lastError = error
        state.value.lastError = error
        state.value.failureCount++

        // 检查是否应该重试
        if (attempt < maxAttempts && retryCondition(error)) {
          const retryDelay = calculateDelay(attempt - 1)
          
          if (onRetry) {
            onRetry(attempt, error)
          }

          console.warn(`操作失败，${retryDelay}ms 后进行第 ${attempt + 1} 次尝试:`, error.message)
          
          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, retryDelay))
        } else {
          break
        }
      }
    }

    // 所有重试都失败了
    state.value.isRetrying = false
    
    if (onFailure) {
      onFailure(lastError!, maxAttempts)
    }

    // 使用全局错误处理器
    const appError = errorHandler.handleError(lastError!, {
      context: `Retry failed after ${maxAttempts} attempts`,
      showNotification: true,
    })

    throw appError
  }

  /**
   * 手动重试上次失败的操作
   */
  async function retry<T>(operation: () => Promise<T>): Promise<T> {
    if (!canRetry.value) {
      throw new Error('Cannot retry: no previous error or max attempts reached')
    }

    // 重置状态并重新执行
    return execute(operation)
  }

  /**
   * 重置状态
   */
  function reset() {
    state.value = {
      isRetrying: false,
      currentAttempt: 0,
      lastError: null,
      totalAttempts: 0,
      successCount: 0,
      failureCount: 0,
    }
  }

  /**
   * 创建网络请求重试函数
   */
  function createNetworkRetry(baseConfig: RetryConfig = {}) {
    const networkConfig: RetryConfig = {
      maxAttempts: 3,
      delay: 1000,
      backoff: true,
      retryCondition: (error: Error) => {
        // 只对网络错误和服务器错误重试
        const message = error.message.toLowerCase()
        return message.includes('network') ||
               message.includes('fetch') ||
               message.includes('timeout') ||
               message.includes('500') ||
               message.includes('502') ||
               message.includes('503') ||
               message.includes('504')
      },
      ...baseConfig,
    }

    return (url: string, options: RequestInit = {}) => {
      return execute(async () => {
        const response = await fetch(url, options)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        return response
      })
    }
  }

  /**
   * 创建 API 调用重试函数
   */
  function createApiRetry<T>(apiCall: () => Promise<T>, config: RetryConfig = {}) {
    const apiConfig: RetryConfig = {
      maxAttempts: 2,
      delay: 500,
      backoff: false,
      retryCondition: (error: Error) => {
        // API 调用通常不需要太多重试
        const message = error.message.toLowerCase()
        return message.includes('network') ||
               message.includes('timeout') ||
               message.includes('500')
      },
      ...config,
    }

    return () => execute(apiCall)
  }

  /**
   * 批量重试操作
   */
  async function executeBatch<T>(
    operations: Array<() => Promise<T>>,
    batchConfig: {
      concurrency?: number
      failFast?: boolean
      retryIndividual?: boolean
    } = {}
  ): Promise<Array<T | Error>> {
    const {
      concurrency = 3,
      failFast = false,
      retryIndividual = true,
    } = batchConfig

    const results: Array<T | Error> = []
    const chunks: Array<Array<() => Promise<T>>> = []

    // 分块处理
    for (let i = 0; i < operations.length; i += concurrency) {
      chunks.push(operations.slice(i, i + concurrency))
    }

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (operation, index) => {
        try {
          if (retryIndividual) {
            return await execute(operation)
          } else {
            return await operation()
          }
        } catch (error: any) {
          if (failFast) {
            throw error
          }
          return error
        }
      })

      const chunkResults = await Promise.all(chunkPromises)
      results.push(...chunkResults)

      // 如果启用了 failFast 且有错误，停止处理
      if (failFast && chunkResults.some(result => result instanceof Error)) {
        break
      }
    }

    return results
  }

  return {
    // 状态
    state: computed(() => state.value),
    canRetry,
    retryInfo,
    stats,

    // 方法
    execute,
    retry,
    reset,
    createNetworkRetry,
    createApiRetry,
    executeBatch,
  }
}

// 预设配置
export const retryPresets = {
  // 网络请求
  network: {
    maxAttempts: 3,
    delay: 1000,
    backoff: true,
    retryCondition: (error: Error) => {
      const message = error.message.toLowerCase()
      return message.includes('network') || 
             message.includes('fetch') || 
             message.includes('timeout')
    },
  },

  // API 调用
  api: {
    maxAttempts: 2,
    delay: 500,
    backoff: false,
    retryCondition: (error: Error) => {
      const message = error.message.toLowerCase()
      return message.includes('500') || 
             message.includes('502') || 
             message.includes('503')
    },
  },

  // 文件操作
  file: {
    maxAttempts: 5,
    delay: 2000,
    backoff: true,
    maxDelay: 10000,
    retryCondition: (error: Error) => {
      const message = error.message.toLowerCase()
      return message.includes('file') || 
             message.includes('read') || 
             message.includes('write')
    },
  },

  // 数据库操作
  database: {
    maxAttempts: 3,
    delay: 1500,
    backoff: true,
    retryCondition: (error: Error) => {
      const message = error.message.toLowerCase()
      return message.includes('connection') || 
             message.includes('timeout') || 
             message.includes('lock')
    },
  },
} as const