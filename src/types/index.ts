// 导航相关类型定义
export interface NavigationSubItem {
  id: string
  title: string
  titleEn?: string
  description: string
  descriptionEn?: string
  icon: string
  href: string
  enabled: boolean
  createdAt?: string
  updatedAt?: string
  tags?: string[]
  category?: string
}

export interface NavigationSubCategory {
  id: string
  title: string
  titleEn?: string
  description?: string
  icon?: string
  items: NavigationSubItem[]
  enabled: boolean
  order?: number
}

export interface NavigationCategory {
  id: string
  title: string
  titleEn?: string
  icon?: string
  description?: string
  descriptionEn?: string
  items: NavigationSubItem[]
  subCategories?: NavigationSubCategory[]
  enabled: boolean
  order?: number
  parentId?: string
  createdAt?: string
  updatedAt?: string
}

export interface NavigationData {
  navigationItems: NavigationCategory[]
  version?: string
  lastUpdated?: string
}

// 站点配置类型定义
export interface SiteBasicConfig {
  title: string
  titleEn?: string
  description: string
  descriptionEn?: string
  keywords: string
  keywordsEn?: string
  author?: string
  email?: string
  url?: string
}

export interface SiteAppearanceConfig {
  logo: string
  favicon: string
  theme: 'light' | 'dark' | 'system'
  primaryColor?: string
  accentColor?: string
  fontFamily?: string
  customCss?: string
}

export interface SiteSeoConfig {
  enableSeo: boolean
  ogImage?: string
  twitterCard?: string
  googleAnalytics?: string
  baiduAnalytics?: string
}

export interface SiteFeatureConfig {
  enableSearch: boolean
  enableThemeToggle: boolean
  enableI18n: boolean
  enablePwa: boolean
  enableComments: boolean
}

export interface SiteConfig {
  basic: SiteBasicConfig
  appearance: SiteAppearanceConfig
  seo?: SiteSeoConfig
  features?: SiteFeatureConfig
  version?: string
  lastUpdated?: string
}

// 资源相关类型定义
export interface ResourceItem {
  title: string
  description: string
  icon: string
  url: string
}

export interface ResourceSection {
  id: string
  title: string
  items: ResourceItem[]
}

export interface ResourceData {
  resourceSections: ResourceSection[]
}

// GitHub 相关类型定义
export interface GitHubUser {
  id: number
  login: string
  name: string | null
  avatar_url: string
  email: string | null
  bio?: string | null
  blog?: string | null
  location?: string | null
  company?: string | null
  public_repos: number
  followers: number
  following: number
  created_at: string
  updated_at: string
}

export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  html_url: string
  clone_url: string
  default_branch: string
  created_at: string
  updated_at: string
  pushed_at: string
}

export interface GitHubFile {
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  git_url: string
  download_url: string
  type: 'file' | 'dir'
  content?: string
  encoding?: string
}

export interface GitHubCommit {
  sha: string
  message: string
  author: {
    name: string
    email: string
    date: string
  }
  committer: {
    name: string
    email: string
    date: string
  }
}

// API 响应类型定义
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  code?: number
  timestamp?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// 错误类型定义
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp?: string
}

export enum ErrorCodes {
  // 网络错误
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // 认证错误
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  
  // 数据错误
  DATA_LOAD_FAILED = 'DATA_LOAD_FAILED',
  DATA_SAVE_FAILED = 'DATA_SAVE_FAILED',
  DATA_VALIDATION_ERROR = 'DATA_VALIDATION_ERROR',
  
  // GitHub API 错误
  GITHUB_API_ERROR = 'GITHUB_API_ERROR',
  GITHUB_RATE_LIMIT = 'GITHUB_RATE_LIMIT',
  GITHUB_FILE_NOT_FOUND = 'GITHUB_FILE_NOT_FOUND',
  
  // 通用错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
}

// 搜索相关类型定义
export interface SearchResult {
  category: NavigationCategory
  items: NavigationSubItem[]
  subCategories: Array<{
    category: NavigationSubCategory
    items: NavigationSubItem[]
  }>
  score?: number
}

export interface SearchOptions {
  query: string
  categories?: string[]
  tags?: string[]
  enabled?: boolean
  limit?: number
  offset?: number
}

export interface SearchStats {
  totalResults: number
  searchTime: number
  categories: number
  items: number
}
// 表单相关类型定义
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'url' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file'
  required?: boolean
  placeholder?: string
  options?: Array<{ label: string; value: string }>
  validation?: {
    pattern?: string
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
  }
}

export interface FormData {
  [key: string]: any
}

export interface FormErrors {
  [key: string]: string[]
}

// 主题相关类型定义
export type Theme = 'light' | 'dark' | 'system'

export interface ThemeConfig {
  theme: Theme
  systemTheme: 'light' | 'dark'
  customColors?: {
    primary?: string
    secondary?: string
    accent?: string
    background?: string
    foreground?: string
  }
}

// 国际化类型定义
export type Locale = 'zh-CN' | 'en-US'

export interface I18nMessage {
  [key: string]: string | I18nMessage
}

export interface I18nConfig {
  locale: Locale
  fallbackLocale: Locale
  messages: Record<Locale, I18nMessage>
}

// 统计数据类型定义
export interface NavigationStats {
  totalCategories: number
  totalSubCategories: number
  totalItems: number
  enabledItems: number
  disabledItems: number
  lastUpdated?: string
}

export interface SystemStats {
  navigation: NavigationStats
  storage: {
    used: number
    total: number
    files: number
  }
  performance: {
    loadTime: number
    renderTime: number
    apiCalls: number
  }
}

// 导入导出类型定义
export interface ExportOptions {
  format: 'json' | 'csv' | 'xml' | 'html'
  includeDisabled?: boolean
  includeMetadata?: boolean
  categories?: string[]
}

export interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: Array<{
    line: number
    message: string
    data?: any
  }>
}

// 缓存类型定义
export interface CacheItem<T = any> {
  key: string
  data: T
  timestamp: number
  expiry: number
}

export interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number
  strategy?: 'lru' | 'fifo'
}

// 事件类型定义
export interface AppEvent {
  type: string
  payload?: any
  timestamp: number
  source?: string
}

export type EventHandler<T = any> = (event: AppEvent & { payload: T }) => void

// 插件类型定义
export interface Plugin {
  name: string
  version: string
  description?: string
  author?: string
  enabled: boolean
  config?: Record<string, any>
  hooks?: {
    beforeInit?: () => void
    afterInit?: () => void
    beforeDestroy?: () => void
    afterDestroy?: () => void
  }
}

// 备份类型定义
export interface BackupData {
  version: string
  timestamp: string
  navigation: NavigationData
  site: SiteConfig
  resources?: ResourceData
  metadata?: {
    source: string
    user?: string
    description?: string
  }
}

export interface BackupOptions {
  includeResources?: boolean
  includeMetadata?: boolean
  compress?: boolean
  encrypt?: boolean
}

// 权限类型定义
export interface Permission {
  resource: string
  action: 'read' | 'write' | 'delete' | 'admin'
  granted: boolean
}

export interface UserRole {
  id: string
  name: string
  permissions: Permission[]
  description?: string
}

export interface AuthUser extends GitHubUser {
  role?: UserRole
  permissions?: Permission[]
  lastLogin?: string
  settings?: Record<string, any>
}

// 通知类型定义
export interface NotificationOptions {
  duration?: number
  closable?: boolean
  persistent?: boolean
  actions?: Array<{
    label: string
    action: () => void
  }>
}
// 导出其他类型定义文件
export * from './api'
export * from './utils'
export * from './constants'

// 导出验证相关类型
export type { ValidationResult, ValidationRules } from './api'