/**
 * NavigationManager 组件测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import NavigationManager from '../NavigationManager.vue'
import { useNavigationStore } from '@/stores'

// Mock 依赖
vi.mock('@/composables/useNotification', () => ({
  notification: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('@/utils', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' ')),
}))

// Mock UI 组件
vi.mock('@/components/ui', () => ({
  Button: { template: '<button><slot /></button>' },
  Card: { template: '<div class="card"><slot /></div>' },
  Badge: { template: '<span class="badge"><slot /></span>' },
  Menu: { template: '<div class="menu"><slot /></div>' },
  MenuItem: { template: '<div class="menu-item" @click="$emit(\'click\')"><slot /></div>' },
  Dialog: { 
    template: '<div v-if="open" class="dialog"><slot /></div>',
    props: ['open', 'title', 'confirmText', 'confirmVariant'],
    emits: ['close', 'confirm']
  },
  LoadingState: { template: '<div class="loading">Loading...</div>' },
}))

// Mock 子组件
vi.mock('../NavigationManager/CategoryDialog.vue', () => ({
  default: {
    template: '<div class="category-dialog"></div>',
    props: ['open', 'category'],
    emits: ['close', 'save']
  }
}))

vi.mock('../NavigationManager/ItemDialog.vue', () => ({
  default: {
    template: '<div class="item-dialog"></div>',
    props: ['open', 'categoryId', 'item'],
    emits: ['close', 'save']
  }
}))

describe('NavigationManager', () => {
  let pinia: ReturnType<typeof createPinia>
  let navigationStore: ReturnType<typeof useNavigationStore>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    navigationStore = useNavigationStore()
    
    // Mock store 数据
    navigationStore.categories = [
      {
        id: 'test-category',
        title: '测试分类',
        description: '测试分类描述',
        icon: '📁',
        items: [
          {
            id: 'test-item',
            title: '测试项目',
            description: '测试项目描述',
            icon: 'https://example.com/icon.png',
            href: 'https://example.com',
            enabled: true,
          }
        ],
        enabled: true,
      }
    ]
  })

  it('应该正确渲染组件', () => {
    const wrapper = mount(NavigationManager, {
      global: {
        plugins: [pinia],
        stubs: {
          'lucide-vue-next': true,
        }
      }
    })

    expect(wrapper.find('h2').text()).toBe('导航管理')
    expect(wrapper.text()).toContain('管理导航分类和网站项目')
  })

  it('应该显示统计信息', () => {
    const wrapper = mount(NavigationManager, {
      global: {
        plugins: [pinia],
        stubs: {
          'lucide-vue-next': true,
        }
      }
    })

    // 检查统计卡片
    const cards = wrapper.findAll('.card')
    expect(cards.length).toBeGreaterThanOrEqual(4)
  })

  it('应该显示分类列表', () => {
    const wrapper = mount(NavigationManager, {
      global: {
        plugins: [pinia],
        stubs: {
          'lucide-vue-next': true,
        }
      }
    })

    expect(wrapper.text()).toContain('测试分类')
    expect(wrapper.text()).toContain('测试分类描述')
  })

  it('应该显示项目列表', () => {
    const wrapper = mount(NavigationManager, {
      global: {
        plugins: [pinia],
        stubs: {
          'lucide-vue-next': true,
        }
      }
    })

    expect(wrapper.text()).toContain('测试项目')
    expect(wrapper.text()).toContain('测试项目描述')
  })

  it('应该处理添加分类按钮点击', async () => {
    const wrapper = mount(NavigationManager, {
      global: {
        plugins: [pinia],
        stubs: {
          'lucide-vue-next': true,
        }
      }
    })

    const addButton = wrapper.find('button')
    await addButton.trigger('click')

    // 检查对话框是否打开
    expect(wrapper.vm.categoryDialogOpen).toBe(true)
  })

  it('应该在没有分类时显示空状态', () => {
    navigationStore.categories = []
    
    const wrapper = mount(NavigationManager, {
      global: {
        plugins: [pinia],
        stubs: {
          'lucide-vue-next': true,
        }
      }
    })

    expect(wrapper.text()).toContain('暂无导航分类')
    expect(wrapper.text()).toContain('开始创建您的第一个导航分类')
  })

  it('应该在加载时显示加载状态', () => {
    navigationStore.loading = true
    
    const wrapper = mount(NavigationManager, {
      global: {
        plugins: [pinia],
        stubs: {
          'lucide-vue-next': true,
        }
      }
    })

    expect(wrapper.find('.loading').exists()).toBe(true)
  })
})