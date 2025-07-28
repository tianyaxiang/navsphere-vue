import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import UserInfo from '../UserInfo.vue'
import { useAuthStore } from '@/stores/auth'
import type { GitHubUser } from '@/types'

// Mock the auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn()
}))

// Mock UI components
vi.mock('@/components/ui', () => ({
  Button: { template: '<button><slot /></button>' }
}))

// Mock icons
vi.mock('lucide-vue-next', () => ({
  BadgeCheckIcon: { template: '<div>BadgeCheck</div>' },
  BuildingIcon: { template: '<div>Building</div>' },
  MapPinIcon: { template: '<div>MapPin</div>' },
  GitBranchIcon: { template: '<div>GitBranch</div>' },
  UsersIcon: { template: '<div>Users</div>' },
  ExternalLinkIcon: { template: '<div>ExternalLink</div>' },
  RefreshCwIcon: { template: '<div>RefreshCw</div>' }
}))

describe('UserInfo', () => {
  let mockAuthStore: any
  const mockUser: GitHubUser = {
    id: 1,
    login: 'testuser',
    name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
    email: 'test@example.com',
    bio: 'Test bio',
    blog: 'https://example.com',
    location: 'Test City',
    company: 'Test Company',
    public_repos: 10,
    followers: 5,
    following: 3,
    created_at: '2020-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    html_url: 'https://github.com/testuser'
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    
    mockAuthStore = {
      user: mockUser,
      isAuthenticated: true,
      isRepositoryOwner: vi.fn().mockReturnValue(false),
      refreshUserInfo: vi.fn()
    }
    
    vi.mocked(useAuthStore).mockReturnValue(mockAuthStore)
  })

  it('renders user avatar and name', () => {
    const wrapper = mount(UserInfo, {
      global: {
        stubs: {
          BadgeCheckIcon: { template: '<div>BadgeCheck</div>' }
        }
      }
    })

    const img = wrapper.find('img')
    expect(img.attributes('src')).toBe(mockUser.avatar_url)
    expect(img.attributes('alt')).toBe(mockUser.name)
    expect(wrapper.text()).toContain(mockUser.name)
  })

  it('shows username when showDetails is true', () => {
    const wrapper = mount(UserInfo, {
      props: {
        showDetails: true
      }
    })

    expect(wrapper.text()).toContain(`@${mockUser.login}`)
  })

  it('shows email when showEmail is true', () => {
    const wrapper = mount(UserInfo, {
      props: {
        showDetails: true,
        showEmail: true
      }
    })

    expect(wrapper.text()).toContain(mockUser.email)
  })

  it('shows company when showCompany is true', () => {
    const wrapper = mount(UserInfo, {
      props: {
        showDetails: true,
        showCompany: true
      },
      global: {
        stubs: {
          BuildingIcon: { template: '<div>Building</div>' }
        }
      }
    })

    expect(wrapper.text()).toContain(mockUser.company)
  })

  it('shows location when showLocation is true', () => {
    const wrapper = mount(UserInfo, {
      props: {
        showDetails: true,
        showLocation: true
      },
      global: {
        stubs: {
          MapPinIcon: { template: '<div>MapPin</div>' }
        }
      }
    })

    expect(wrapper.text()).toContain(mockUser.location)
  })

  it('shows stats when showStats is true', () => {
    const wrapper = mount(UserInfo, {
      props: {
        showDetails: true,
        showStats: true
      },
      global: {
        stubs: {
          GitBranchIcon: { template: '<div>GitBranch</div>' },
          UsersIcon: { template: '<div>Users</div>' }
        }
      }
    })

    expect(wrapper.text()).toContain(mockUser.public_repos.toString())
    expect(wrapper.text()).toContain(mockUser.followers.toString())
  })

  it('uses provided user prop instead of auth store user', () => {
    const customUser: GitHubUser = {
      ...mockUser,
      name: 'Custom User',
      login: 'customuser'
    }

    const wrapper = mount(UserInfo, {
      props: {
        user: customUser
      }
    })

    expect(wrapper.text()).toContain('Custom User')
    expect(wrapper.text()).not.toContain('Test User')
  })

  it('handles avatar error by setting default avatar', async () => {
    const wrapper = mount(UserInfo)
    const img = wrapper.find('img')
    
    await img.trigger('error')
    
    expect(wrapper.emitted('avatarError')).toBeTruthy()
  })

  it('shows verification badge for repository owner', () => {
    mockAuthStore.isRepositoryOwner.mockReturnValue(true)
    
    const wrapper = mount(UserInfo, {
      global: {
        stubs: {
          BadgeCheckIcon: { template: '<div>BadgeCheck</div>' }
        }
      }
    })

    expect(wrapper.findComponent({ name: 'BadgeCheckIcon' }).exists()).toBe(true)
  })
})