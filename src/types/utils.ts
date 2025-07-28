/**
 * 工具类型定义
 */

// 通用工具类型
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type Required<T, K extends keyof T> = T & Required<Pick<T, K>>
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

// 函数类型
export type AsyncFunction<T = any, R = any> = (...args: T[]) => Promise<R>
export type SyncFunction<T = any, R = any> = (...args: T[]) => R
export type EventHandler<T = any> = (event: T) => void
export type ErrorHandler = (error: Error) => void

// 状态类型
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'
export type RequestState<T = any> = {
  data: T | null
  loading: boolean
  error: string | null
  lastUpdated: number | null
}

// 分页类型
export interface PaginationParams {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// 排序类型
export interface SortOption {
  key: string
  label: string
  order: 'asc' | 'desc'
}

export type SortDirection = 'asc' | 'desc'

// 过滤类型
export interface FilterOption {
  key: string
  label: string
  value: any
  type: 'text' | 'select' | 'date' | 'boolean' | 'number'
}

export interface FilterState {
  [key: string]: any
}

// 表格类型
export interface TableColumn<T = any> {
  key: keyof T
  title: string
  width?: number | string
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, record: T, index: number) => any
  align?: 'left' | 'center' | 'right'
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[]
  data: T[]
  loading?: boolean
  pagination?: PaginationInfo
  sortable?: boolean
  filterable?: boolean
  selectable?: boolean
  expandable?: boolean
}

// 表单类型
export interface FormRule {
  required?: boolean
  message?: string
  pattern?: RegExp
  min?: number
  max?: number
  validator?: (value: any) => boolean | string | Promise<boolean | string>
}

export interface FormItem {
  name: string
  label: string
  type: 'input' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'switch' | 'upload'
  placeholder?: string
  options?: Array<{ label: string; value: any }>
  rules?: FormRule[]
  disabled?: boolean
  hidden?: boolean
  span?: number
}

// 菜单类型
export interface MenuItem {
  key: string
  label: string
  icon?: string
  path?: string
  children?: MenuItem[]
  disabled?: boolean
  hidden?: boolean
  badge?: string | number
  meta?: Record<string, any>
}

// 面包屑类型
export interface BreadcrumbItem {
  label: string
  path?: string
  icon?: string
}

// 标签页类型
export interface TabItem {
  key: string
  label: string
  icon?: string
  closable?: boolean
  disabled?: boolean
  content?: any
}

// 模态框类型
export interface ModalProps {
  visible: boolean
  title?: string
  width?: number | string
  closable?: boolean
  maskClosable?: boolean
  keyboard?: boolean
  centered?: boolean
  destroyOnClose?: boolean
  onOk?: () => void | Promise<void>
  onCancel?: () => void
}

// 抽屉类型
export interface DrawerProps {
  visible: boolean
  title?: string
  width?: number | string
  placement?: 'left' | 'right' | 'top' | 'bottom'
  closable?: boolean
  maskClosable?: boolean
  keyboard?: boolean
  destroyOnClose?: boolean
  onClose?: () => void
}

// 上传类型
export interface UploadFile {
  uid: string
  name: string
  status: 'uploading' | 'done' | 'error' | 'removed'
  url?: string
  thumbUrl?: string
  size?: number
  type?: string
  percent?: number
  error?: any
  response?: any
}

export interface UploadProps {
  action?: string
  accept?: string
  multiple?: boolean
  maxCount?: number
  maxSize?: number
  beforeUpload?: (file: File) => boolean | Promise<boolean>
  onChange?: (info: { file: UploadFile; fileList: UploadFile[] }) => void
  onPreview?: (file: UploadFile) => void
  onRemove?: (file: UploadFile) => boolean | Promise<boolean>
}

// 树形结构类型
export interface TreeNode<T = any> {
  key: string
  title: string
  children?: TreeNode<T>[]
  disabled?: boolean
  selectable?: boolean
  checkable?: boolean
  icon?: string
  data?: T
}

export interface TreeProps<T = any> {
  data: TreeNode<T>[]
  checkable?: boolean
  selectable?: boolean
  multiple?: boolean
  expandedKeys?: string[]
  selectedKeys?: string[]
  checkedKeys?: string[]
  onExpand?: (expandedKeys: string[]) => void
  onSelect?: (selectedKeys: string[], info: any) => void
  onCheck?: (checkedKeys: string[], info: any) => void
}

// 时间相关类型
export type DateFormat = 'YYYY-MM-DD' | 'YYYY-MM-DD HH:mm:ss' | 'MM-DD' | 'HH:mm:ss'
export type TimeUnit = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second'

// 颜色类型
export type ColorFormat = 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla'
export interface ColorValue {
  hex: string
  rgb: { r: number; g: number; b: number }
  hsl: { h: number; s: number; l: number }
  alpha: number
}

// 图标类型
export type IconType = 'outline' | 'filled' | 'two-tone'
export interface IconProps {
  name: string
  type?: IconType
  size?: number | string
  color?: string
  spin?: boolean
  rotate?: number
}

// 动画类型
export type AnimationType = 'fade' | 'slide' | 'zoom' | 'bounce' | 'flip' | 'rotate'
export interface AnimationProps {
  type: AnimationType
  duration?: number
  delay?: number
  easing?: string
  loop?: boolean
  direction?: 'normal' | 'reverse' | 'alternate'
}

// 响应式类型
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export interface ResponsiveValue<T> {
  xs?: T
  sm?: T
  md?: T
  lg?: T
  xl?: T
  '2xl'?: T
}

// 主题类型
export interface ThemeToken {
  colors: Record<string, string>
  spacing: Record<string, string>
  fontSize: Record<string, string>
  fontWeight: Record<string, number>
  borderRadius: Record<string, string>
  boxShadow: Record<string, string>
  zIndex: Record<string, number>
}

// 配置类型
export interface AppConfig {
  name: string
  version: string
  description?: string
  author?: string
  homepage?: string
  repository?: string
  license?: string
  keywords?: string[]
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}