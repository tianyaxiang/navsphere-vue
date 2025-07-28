/**
 * API 服务接口类型定义
 */

import type {
  NavigationCategory,
  NavigationSubItem,
  SiteConfig,
  ResourceSection,
  GitHubUser,
  GitHubRepository,
  GitHubFile,
  GitHubCommit,
  SearchResult,
  SearchOptions,
  ApiResponse,
  BackupData,
  BackupOptions,
  ImportResult,
  ExportOptions,
  NavigationStats,
  SystemStats,
} from './index'

// GitHub OAuth 认证服务接口
export interface GitHubAuthService {
  // 认证相关
  login(): Promise<void>
  logout(): Promise<void>
  refreshToken(): Promise<string>
  
  // Token 管理
  getAccessToken(): string | null
  setAccessToken(token: string): void
  clearAccessToken(): void
  
  // 用户信息
  getUserInfo(): Promise<GitHubUser>
  checkAuthStatus(): Promise<boolean>
}

// GitHub API 服务接口
export interface GitHubApiService {
  // 认证
  authenticate(token: string): void
  
  // 仓库操作
  getRepository(owner: string, repo: string): Promise<GitHubRepository>
  listRepositories(): Promise<GitHubRepository[]>
  
  // 文件操作
  getFileContent(path: string): Promise<string>
  getFile(path: string): Promise<GitHubFile>
  createFile(path: string, content: string, message: string): Promise<GitHubCommit>
  updateFile(path: string, content: string, message: string, sha: string): Promise<GitHubCommit>
  deleteFile(path: string, message: string, sha: string): Promise<GitHubCommit>
  
  // 目录操作
  listFiles(path?: string): Promise<GitHubFile[]>
  
  // 提交历史
  getCommits(path?: string, limit?: number): Promise<GitHubCommit[]>
  getCommit(sha: string): Promise<GitHubCommit>
}

// 数据服务接口
export interface DataService {
  // 导航数据
  getNavigationData(): Promise<NavigationCategory[]>
  updateNavigationData(data: NavigationCategory[]): Promise<void>
  addNavigationCategory(category: NavigationCategory): Promise<void>
  updateNavigationCategory(id: string, category: Partial<NavigationCategory>): Promise<void>
  deleteNavigationCategory(id: string): Promise<void>
  
  // 导航项目
  addNavigationItem(categoryId: string, item: NavigationSubItem): Promise<void>
  updateNavigationItem(categoryId: string, itemId: string, item: Partial<NavigationSubItem>): Promise<void>
  deleteNavigationItem(categoryId: string, itemId: string): Promise<void>
  
  // 站点配置
  getSiteConfig(): Promise<SiteConfig>
  updateSiteConfig(config: SiteConfig): Promise<void>
  updateSiteBasicConfig(config: Partial<SiteConfig['basic']>): Promise<void>
  updateSiteAppearanceConfig(config: Partial<SiteConfig['appearance']>): Promise<void>
  
  // 资源数据
  getResourceData(): Promise<ResourceSection[]>
  updateResourceData(data: ResourceSection[]): Promise<void>
  
  // 统计数据
  getNavigationStats(): Promise<NavigationStats>
  getSystemStats(): Promise<SystemStats>
}

// 搜索服务接口
export interface SearchService {
  search(options: SearchOptions): Promise<SearchResult[]>
  searchCategories(query: string): Promise<NavigationCategory[]>
  searchItems(query: string): Promise<NavigationSubItem[]>
  highlightText(text: string, query: string): string
  getSearchSuggestions(query: string): Promise<string[]>
}

// 缓存服务接口
export interface CacheService {
  get<T>(key: string): T | null
  set<T>(key: string, value: T, ttl?: number): void
  delete(key: string): void
  clear(): void
  has(key: string): boolean
  keys(): string[]
  size(): number
}

// 存储服务接口
export interface StorageService {
  // 本地存储
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  clear(): void
  
  // 对象存储
  getObject<T>(key: string): T | null
  setObject<T>(key: string, value: T): void
  
  // 会话存储
  getSessionItem(key: string): string | null
  setSessionItem(key: string, value: string): void
  removeSessionItem(key: string): void
  clearSession(): void
}

// 备份服务接口
export interface BackupService {
  // 创建备份
  createBackup(options?: BackupOptions): Promise<BackupData>
  
  // 恢复备份
  restoreBackup(backup: BackupData): Promise<void>
  
  // 导出数据
  exportData(options: ExportOptions): Promise<string>
  
  // 导入数据
  importData(data: string, format: 'json' | 'csv'): Promise<ImportResult>
  
  // 备份历史
  listBackups(): Promise<Array<{ id: string; timestamp: string; size: number }>>
  deleteBackup(id: string): Promise<void>
}

// 通知服务接口
export interface NotificationService {
  // 显示通知
  success(message: string, options?: NotificationOptions): void
  error(message: string, options?: NotificationOptions): void
  warning(message: string, options?: NotificationOptions): void
  info(message: string, options?: NotificationOptions): void
  
  // 管理通知
  clear(): void
  clearById(id: string): void
}

export interface NotificationOptions {
  duration?: number
  closable?: boolean
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  action?: {
    label: string
    handler: () => void
  }
}

// 验证服务接口
export interface ValidationService {
  // 数据验证
  validateNavigationData(data: NavigationCategory[]): ValidationResult
  validateSiteConfig(config: SiteConfig): ValidationResult
  validateNavigationItem(item: NavigationSubItem): ValidationResult
  
  // URL 验证
  validateUrl(url: string): boolean
  validateEmail(email: string): boolean
  
  // 表单验证
  validateForm(data: Record<string, any>, rules: ValidationRules): ValidationResult
}

export interface ValidationResult {
  valid: boolean
  errors: Array<{
    field: string
    message: string
    code?: string
  }>
}

export interface ValidationRules {
  [field: string]: {
    required?: boolean
    type?: 'string' | 'number' | 'email' | 'url' | 'array' | 'object'
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    custom?: (value: any) => boolean | string
  }
}

// 事件服务接口
export interface EventService {
  // 事件监听
  on<T = any>(event: string, handler: (payload: T) => void): () => void
  off(event: string, handler?: Function): void
  
  // 事件触发
  emit<T = any>(event: string, payload?: T): void
  
  // 一次性监听
  once<T = any>(event: string, handler: (payload: T) => void): void
  
  // 清除所有监听器
  clear(): void
}

// 主题服务接口
export interface ThemeService {
  // 主题管理
  getCurrentTheme(): 'light' | 'dark'
  setTheme(theme: 'light' | 'dark' | 'system'): void
  toggleTheme(): void
  
  // 系统主题检测
  getSystemTheme(): 'light' | 'dark'
  watchSystemTheme(callback: (theme: 'light' | 'dark') => void): () => void
  
  // 自定义主题
  setCustomColors(colors: Record<string, string>): void
  resetCustomColors(): void
}