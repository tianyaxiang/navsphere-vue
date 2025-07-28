<template>
  <Menu as="div" class="relative inline-block text-left">
    <div>
      <MenuButton
        :class="cn(
          'inline-flex items-center justify-center rounded-md p-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          isTransitioning && 'animate-pulse',
          className
        )"
        :disabled="isTransitioning"
        :title="themeLabel"
      >
        <component
          :is="currentIcon"
          :class="cn(
            'h-5 w-5 transition-transform duration-200',
            isTransitioning && 'scale-110'
          )"
          aria-hidden="true"
        />
        <span class="sr-only">{{ themeLabel }} - 点击切换主题</span>
      </MenuButton>
    </div>

    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <MenuItems class="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-border rounded-lg bg-popover shadow-lg ring-1 ring-black/5 focus:outline-none z-50 theme-fade-in">
        <div class="px-1 py-1">
          <MenuItem
            v-for="option in themeOptions"
            :key="option.value"
            v-slot="{ active }"
          >
            <button
              :class="cn(
                'group flex w-full items-center rounded-md px-3 py-2 text-sm transition-all duration-150',
                active ? 'bg-accent text-accent-foreground' : 'text-foreground',
                theme === option.value && 'bg-accent/50 font-medium',
                isTransitioning && 'opacity-50 cursor-not-allowed'
              )"
              :disabled="isTransitioning"
              @click="handleThemeChange(option.value)"
            >
              <component
                :is="getIconComponent(option.icon)"
                :class="cn(
                  'mr-3 h-4 w-4 transition-colors duration-150',
                  theme === option.value && 'text-primary'
                )"
                aria-hidden="true"
              />
              <div class="flex-1 text-left">
                <div class="font-medium">{{ option.label }}</div>
                <div class="text-xs text-muted-foreground mt-0.5">
                  {{ option.description }}
                </div>
              </div>
              <CheckIcon
                v-if="theme === option.value"
                :class="cn(
                  'ml-2 h-4 w-4 text-primary transition-all duration-150',
                  isTransitioning && 'animate-spin'
                )"
                aria-hidden="true"
              />
            </button>
          </MenuItem>
        </div>
        
        <!-- 系统主题状态指示 -->
        <div v-if="theme === 'system'" class="px-3 py-2 text-xs text-muted-foreground border-t border-border">
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1">
              <div :class="cn(
                'w-2 h-2 rounded-full transition-colors duration-300',
                currentTheme === 'dark' ? 'bg-blue-500' : 'bg-yellow-500'
              )"></div>
              <span>系统当前: {{ currentTheme === 'dark' ? '深色' : '浅色' }}</span>
            </div>
            <div v-if="!supportsSystemTheme()" class="text-orange-500">
              ⚠️ 不支持系统主题检测
            </div>
          </div>
        </div>
      </MenuItems>
    </transition>
  </Menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { SunIcon, MoonIcon, MonitorIcon, CheckIcon } from 'lucide-vue-next'
import { useTheme, useThemeAnimation } from '@/composables/useTheme'
import { cn } from '@/utils'
import type { Theme } from '@/stores/theme'

interface Props {
  className?: string
  showTooltip?: boolean
  variant?: 'default' | 'compact'
}

const props = withDefaults(defineProps<Props>(), {
  showTooltip: true,
  variant: 'default'
})

const {
  theme,
  currentTheme,
  isDark,
  isTransitioning,
  themeIcon,
  themeLabel,
  themeOptions,
  setTheme,
  supportsSystemTheme,
} = useTheme()

const { animateThemeChange } = useThemeAnimation()

// 图标组件映射
const iconComponents = {
  sun: SunIcon,
  moon: MoonIcon,
  monitor: MonitorIcon,
}

const currentIcon = computed(() => {
  return iconComponents[themeIcon.value as keyof typeof iconComponents] || MonitorIcon
})

const getIconComponent = (iconName: string) => {
  return iconComponents[iconName as keyof typeof iconComponents] || MonitorIcon
}

// 处理主题切换
const handleThemeChange = async (newTheme: Theme) => {
  if (theme.value === newTheme || isTransitioning.value) return

  try {
    // 触发动画
    await animateThemeChange()
    
    // 设置新主题
    await setTheme(newTheme)
  } catch (error) {
    console.error('主题切换失败:', error)
  }
}
</script>

<style scoped>
/* 主题切换按钮的特殊动画 */
.theme-toggle-button {
  position: relative;
  overflow: hidden;
}

.theme-toggle-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: radial-gradient(circle, rgba(var(--primary), 0.1) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.3s ease, height 0.3s ease;
  pointer-events: none;
}

.theme-toggle-button:hover::before {
  width: 100px;
  height: 100px;
}

/* 菜单项的悬停效果 */
.theme-menu-item {
  position: relative;
  overflow: hidden;
}

.theme-menu-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(var(--accent), 0.1), transparent);
  transition: left 0.3s ease;
}

.theme-menu-item:hover::before {
  left: 100%;
}
</style>