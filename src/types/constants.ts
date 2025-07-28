/**
 * 常量定义
 */

// 应用常量
export const APP_NAME = 'NavSphere Vue'
export const APP_VERSION = '1.0.0'
export const APP_DESCRIPTION = '现代化导航管理平台'

// 存储键名
export const STORAGE_KEYS = {
  THEME: 'navsphere_theme',
  LOCALE: 'navsphere_locale',
  ACCESS_TOKEN: 'github_access_token',
  USER_INFO: 'user_info',
  NAVIGATION_CACHE: 'navigation_cache',
  SITE_CONFIG_CACHE: 'site_config_cache',
  SEARCH_HISTORY: 'search_history',
  PREFERENCES: 'user_preferences',
} as const

// API 端点
export const API_ENDPOINTS = {
  GITHUB_API: 'https://api.github.com',
  GITHUB_OAUTH: 'https://github.com/login/oauth',
  GITHUB_TOKEN: 'https://github.com/login/oauth/access_token',
} as const

// GitHub OAuth 配置
export const GITHUB_OAUTH_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_GITHUB_CLIENT_ID,
  REDIRECT_URI: `${import.meta.env.VITE_APP_URL}/auth/callback`,
  SCOPE: 'repo,user:email',
} as const

// 文件路径
export const DATA_FILES = {
  NAVIGATION: 'navigation.json',
  SITE_CONFIG: 'site.json',
  RESOURCES: 'resources.json',
} as const

// 默认配置
export const DEFAULT_SITE_CONFIG = {
  basic: {
    title: 'NavSphere Vue',
    description: '现代化导航管理平台',
    keywords: '导航,书签,管理,Vue',
  },
  appearance: {
    logo: '/favicon.ico',
    favicon: '/favicon.ico',
    theme: 'system' as const,
  },
} as const

// 主题配置
export const THEME_CONFIG = {
  THEMES: ['light', 'dark', 'system'] as const,
  DEFAULT_THEME: 'system' as const,
  STORAGE_KEY: STORAGE_KEYS.THEME,
} as const

// 国际化配置
export const I18N_CONFIG = {
  LOCALES: ['zh-CN', 'en-US'] as const,
  DEFAULT_LOCALE: 'zh-CN' as const,
  FALLBACK_LOCALE: 'zh-CN' as const,
  STORAGE_KEY: STORAGE_KEYS.LOCALE,
} as const

// 分页配置
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const

// 搜索配置
export const SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 2,
  MAX_QUERY_LENGTH: 100,
  DEBOUNCE_DELAY: 300,
  MAX_RESULTS: 50,
  MAX_HISTORY: 10,
} as const

// 缓存配置
export const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  MAX_SIZE: 100,
  STRATEGY: 'lru' as const,
} as const

// 上传配置
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  MAX_FILES: 10,
} as const

// 验证规则
export const VALIDATION_RULES = {
  URL_PATTERN: /^https?:\/\/.+/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MIN_PASSWORD_LENGTH: 8,
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
} as const

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  AUTH_REQUIRED: '请先登录',
  AUTH_EXPIRED: '登录已过期，请重新登录',
  DATA_LOAD_FAILED: '数据加载失败',
  DATA_SAVE_FAILED: '数据保存失败',
  VALIDATION_ERROR: '数据验证失败',
  GITHUB_API_ERROR: 'GitHub API 调用失败',
  GITHUB_RATE_LIMIT: 'GitHub API 调用频率超限',
  FILE_NOT_FOUND: '文件未找到',
  PERMISSION_DENIED: '权限不足',
  UNKNOWN_ERROR: '未知错误',
} as const

// 成功消息
export const SUCCESS_MESSAGES = {
  DATA_SAVED: '数据保存成功',
  DATA_DELETED: '数据删除成功',
  LOGIN_SUCCESS: '登录成功',
  LOGOUT_SUCCESS: '退出成功',
  IMPORT_SUCCESS: '导入成功',
  EXPORT_SUCCESS: '导出成功',
  BACKUP_CREATED: '备份创建成功',
  BACKUP_RESTORED: '备份恢复成功',
} as const

// 动画配置
export const ANIMATION_CONFIG = {
  DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  EASING: {
    EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
    EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
    EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const

// 响应式断点
export const BREAKPOINTS = {
  XS: 0,
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const

// 图标配置
export const ICON_CONFIG = {
  DEFAULT_SIZE: 20,
  SIZES: {
    XS: 12,
    SM: 16,
    MD: 20,
    LG: 24,
    XL: 32,
  },
} as const

// 通知配置
export const NOTIFICATION_CONFIG = {
  DURATION: 4000,
  MAX_COUNT: 5,
  PLACEMENT: 'top-right' as const,
} as const

// 表格配置
export const TABLE_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  ROW_HEIGHT: 48,
  HEADER_HEIGHT: 56,
} as const

// 表单配置
export const FORM_CONFIG = {
  LABEL_WIDTH: 120,
  INPUT_HEIGHT: 40,
  TEXTAREA_ROWS: 4,
  DEBOUNCE_DELAY: 300,
} as const

// 颜色配置
export const COLOR_CONFIG = {
  PRIMARY: '#3b82f6',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#6b7280',
} as const

// 路由配置
export const ROUTE_CONFIG = {
  HOME: '/',
  ADMIN: '/admin',
  LOGIN: '/login',
  NOT_FOUND: '/404',
} as const

// 权限配置
export const PERMISSION_CONFIG = {
  ADMIN: 'admin',
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
} as const