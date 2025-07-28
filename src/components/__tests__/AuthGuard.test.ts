import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import AuthGuard from '../AuthGuard.vue'
import { useAuthStore } from '@/stores/auth'

// Mock the auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn()
}))

// Mock UI components
vi.mock('@/components/ui', () => ({
  Button: { template: '<button><slot /></button>' },
  LoadingSpinner: { template: '<div>Loading...</div>' },
  Alert: { template: '<div><slot /></div>' }
}))

// Mock icons
vi.mock('lucide-vue-next', () => ({
  ShieldXIcon: { template: '<div>ShieldX</div>' },
  ShieldAlertIcon: { template: '<div>ShieldAlert</div>' },
  GithubIcon: { template: '<div>Github</div>' }
}))

describe('AuthGuard', () => {
  let mockAuthStore: any
  let router: any

  beforeEach(() => {
    setActivePinia(createPinia())
    
    // Create mock auth store
    mockAuthStore = {
      isAuthenticated: false,
      isLoading: false,
      error: null,
      user: null,
      initializeAuth: vi.fn(),
      login: vi.fn(),
      clearError: vi.fn(),
      hasPermission: vi.fn()
    }
    
    vi.mocked(useAuthStore).mockReturnValue(mockAuthStore)

    // Create router
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/login', component: { template: '<div>Login</div>' } }
      ]
    })
  })

  it('shows loading state when initializing auth', async () => {
    mockAuthStore.initializeAuth.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    const wrapper = mount(AuthGuard, {
      global: {
        plugins: [router],
        stubs: {
          LoadingSpinner: { template: '<div>Loading...</div>' }
        }
      }
    })

    expect(wrapper.text()).toContain('正在验证身份')
  })

  it('shows login form when not authenticated', async () => {
    mockAuthStore.initializeAuth.mockResolvedValue(false)
    
    const wrapper = mount(AuthGuard, {
      global: {
        plugins: [router],
        stubs: {
          Button: { template: '<button><slot /></button>' },
          Alert: { template: '<div><slot /></div>' },
          GithubIcon: { template: '<div>Github</div>' }
        }
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('需要登录')
    expect(wrapper.text()).toContain('使用 GitHub 登录')
  })

  it('shows content when authenticated', async () => {
    mockAuthStore.isAuthenticated = true
    mockAuthStore.initializeAuth.mockResolvedValue(true)
    
    const wrapper = mount(AuthGuard, {
      slots: {
        default: '<div>Protected Content</div>'
      },
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('Protected Content')
  })

  it('shows permission denied when lacking required permission', async () => {
    mockAuthStore.isAuthenticated = true
    mockAuthStore.hasPermission.mockReturnValue(false)
    mockAuthStore.initializeAuth.mockResolvedValue(true)
    
    const wrapper = mount(AuthGuard, {
      props: {
        requirePermission: 'admin'
      },
      global: {
        plugins: [router],
        stubs: {
          Button: { template: '<button><slot /></button>' },
          ShieldAlertIcon: { template: '<div>ShieldAlert</div>' }
        }
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('权限不足')
  })
})