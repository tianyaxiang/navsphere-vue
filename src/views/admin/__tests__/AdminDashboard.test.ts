/**
 * AdminDashboard 组件测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AdminDashboard from '../AdminDashboard.vue'

// Mock stores
vi.mock('@/stores', () => ({
  useAuthStore: () => ({
    user: {
      login: 'testuser',
      name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
      id: 123,
      public_repos: 10,
      followers: 5,
    },
    isAuthenticated: true,
    isLoading: false,
    error: null,
    accessToken: 'test-token',
    isRepositoryOwner: () => true,
    refreshUserInfo: vi.fn(),
  }),
  useAppStore: () => ({
    isInitialized: true,
    isLoading: false,
    error: null,
    lastSyncTime: new Date(),
    isReady: true,
    initializeApp: vi.fn(),
    refreshAppData: vi.fn(),
    exportAppData: vi.fn().mockResolvedValue({}),
  }),
  useNavigationStore: () => ({
    totalCategories: 5,
    totalItems: 25,
    enabledCategories: [1, 2, 3, 4, 5],
    enabledItems: 20,
    loading: false,
    error: null,
    lastUpdated: new Date(),
    loadNavigationData: vi.fn(),
    refreshData: vi.fn(),
  }),
  useSiteStore: () => ({
    siteTitle: 'Test NavSphere',
    siteLogo: '/favicon.ico',
    loading: false,
    error: null,
    lastUpdated: new Date(),
    loadSiteConfig: vi.fn(),
    refreshConfig: vi.fn(),
  }),
}))

// Mock components
vi.mock('@/components/ui', () => ({
  Card: { template: '<div class="card"><slot /></div>' },
  Button: { template: '<button><slot /></button>' },
  Badge: { template: '<span class="badge"><slot /></span>' },
}))

vi.mock('@/components/SystemStatus.vue', () => ({
  default: { template: '<div class="system-status">System Status</div>' },
}))

// Mock composables
vi.mock('@/composables/useNotification', () => ({
  notification: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

describe('AdminDashboard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders dashboard title correctly', () => {
    const wrapper = mount(AdminDashboard)
    
    expect(wrapper.find('h2').text()).toContain('管理控制台')
  })

  it('displays statistics cards', () => {
    const wrapper = mount(AdminDashboard)
    
    // Should show navigation categories count
    expect(wrapper.text()).toContain('导航分类')
    expect(wrapper.text()).toContain('5')
    
    // Should show navigation items count
    expect(wrapper.text()).toContain('导航项目')
    expect(wrapper.text()).toContain('25')
    
    // Should show system status
    expect(wrapper.text()).toContain('系统状态')
  })

  it('displays user information', () => {
    const wrapper = mount(AdminDashboard)
    
    expect(wrapper.text()).toContain('Test User')
    expect(wrapper.text()).toContain('testuser')
    expect(wrapper.text()).toContain('管理员')
  })

  it('shows quick action buttons', () => {
    const wrapper = mount(AdminDashboard)
    
    expect(wrapper.text()).toContain('管理导航')
    expect(wrapper.text()).toContain('站点设置')
    expect(wrapper.text()).toContain('导出数据')
  })

  it('displays system health score', () => {
    const wrapper = mount(AdminDashboard)
    
    // Should show 100% health score when no errors
    expect(wrapper.text()).toContain('100%')
    expect(wrapper.text()).toContain('系统健康')
  })

  it('shows activity log', () => {
    const wrapper = mount(AdminDashboard)
    
    expect(wrapper.text()).toContain('最近活动')
    expect(wrapper.text()).toContain('用户登录')
  })

  it('displays performance monitoring', () => {
    const wrapper = mount(AdminDashboard)
    
    expect(wrapper.text()).toContain('性能监控')
    expect(wrapper.text()).toContain('数据加载时间')
    expect(wrapper.text()).toContain('缓存使用率')
    expect(wrapper.text()).toContain('API 响应时间')
  })
})