/**
 * 缓存服务
 */

import type { CacheItem, CacheOptions } from '@/types'

export class CacheService {
  private static cache = new Map<string, CacheItem>()
  private static maxSize = 100
  private static defaultTTL = 5 * 60 * 1000 // 5 minutes

  /**
   * 设置缓存项
   */
  static set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || this.defaultTTL
    const expiry = Date.now() + ttl

    const item: CacheItem<T> = {
      key,
      data,
      timestamp: Date.now(),
      expiry,
    }

    // 如果缓存已满，删除最旧的项目
    if (this.cache.size >= (options.maxSize || this.maxSize)) {
      this.evictOldest()
    }

    this.cache.set(key, item)
  }

  /**
   * 获取缓存项
   */
  static get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    // 检查是否过期
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  /**
   * 删除缓存项
   */
  static delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * 清空缓存
   */
  static clear(): void {
    this.cache.clear()
  }

  /**
   * 检查缓存项是否存在
   */
  static has(key: string): boolean {
    const item = this.cache.get(key)
    
    if (!item) {
      return false
    }

    // 检查是否过期
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * 获取所有缓存键
   */
  static keys(): string[] {
    // 清理过期项目
    this.cleanExpired()
    return Array.from(this.cache.keys())
  }

  /**
   * 获取缓存大小
   */
  static size(): number {
    this.cleanExpired()
    return this.cache.size
  }

  /**
   * 获取缓存统计信息
   */
  static getStats() {
    this.cleanExpired()
    
    const items = Array.from(this.cache.values())
    const now = Date.now()
    
    return {
      totalItems: items.length,
      totalSize: this.cache.size,
      oldestItem: items.reduce((oldest, item) => 
        !oldest || item.timestamp < oldest.timestamp ? item : oldest, null as CacheItem | null
      ),
      newestItem: items.reduce((newest, item) => 
        !newest || item.timestamp > newest.timestamp ? item : newest, null as CacheItem | null
      ),
      expiredItems: items.filter(item => now > item.expiry).length,
    }
  }

  /**
   * 清理过期项目
   */
  private static cleanExpired(): void {
    const now = Date.now()
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 删除最旧的项目
   */
  private static evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTimestamp = Date.now()

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * 设置缓存配置
   */
  static configure(options: { maxSize?: number; defaultTTL?: number }): void {
    if (options.maxSize !== undefined) {
      this.maxSize = options.maxSize
    }
    if (options.defaultTTL !== undefined) {
      this.defaultTTL = options.defaultTTL
    }
  }

  /**
   * 获取或设置缓存（如果不存在则执行函数）
   */
  static async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = this.get<T>(key)
    
    if (cached !== null) {
      return cached
    }

    const data = await factory()
    this.set(key, data, options)
    return data
  }

  /**
   * 批量设置缓存
   */
  static setBatch<T>(items: Array<{ key: string; data: T }>, options: CacheOptions = {}): void {
    items.forEach(({ key, data }) => {
      this.set(key, data, options)
    })
  }

  /**
   * 批量获取缓存
   */
  static getBatch<T>(keys: string[]): Record<string, T | null> {
    const result: Record<string, T | null> = {}
    
    keys.forEach(key => {
      result[key] = this.get<T>(key)
    })

    return result
  }

  /**
   * 批量删除缓存
   */
  static deleteBatch(keys: string[]): number {
    let deletedCount = 0
    
    keys.forEach(key => {
      if (this.delete(key)) {
        deletedCount++
      }
    })

    return deletedCount
  }
}