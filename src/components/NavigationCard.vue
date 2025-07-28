<template>
  <Card
    :class="cn(
      'group relative overflow-hidden transition-all duration-200',
      'hover:shadow-md hover:scale-[1.02]',
      'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
      !item.enabled && 'opacity-60',
      className
    )"
    :hover="true"
  >
    <a
      :href="item.href"
      target="_blank"
      rel="noopener noreferrer"
      class="block p-4 focus:outline-none"
      @click="handleClick"
    >
      <div class="flex items-start space-x-3">
        <!-- 图标 -->
        <div class="flex-shrink-0">
          <div class="relative">
            <img
              v-if="item.icon && isValidUrl(item.icon)"
              :src="item.icon"
              :alt="item.title"
              class="h-8 w-8 rounded-md object-cover"
              @error="handleImageError"
              @load="imageLoaded = true"
            />
            <div
              v-else
              class="h-8 w-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-md flex items-center justify-center"
            >
              <span class="text-sm font-semibold text-primary">
                {{ item.title.charAt(0).toUpperCase() }}
              </span>
            </div>
            
            <!-- 加载指示器 -->
            <div
              v-if="item.icon && isValidUrl(item.icon) && !imageLoaded"
              class="absolute inset-0 bg-muted rounded-md animate-pulse"
            />
          </div>
        </div>

        <!-- 内容 -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1">
            <h3 class="font-medium text-foreground truncate group-hover:text-primary transition-colors">
              {{ item.title }}
            </h3>
            
            <!-- 外部链接图标 -->
            <ExternalLinkIcon class="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          
          <p class="text-sm text-muted-foreground line-clamp-2 mb-2">
            {{ item.description }}
          </p>

          <!-- 标签 -->
          <div v-if="item.tags && item.tags.length > 0" class="flex flex-wrap gap-1">
            <Badge
              v-for="tag in item.tags.slice(0, 3)"
              :key="tag"
              variant="secondary"
              class="text-xs px-1.5 py-0.5"
            >
              {{ tag }}
            </Badge>
            <span
              v-if="item.tags.length > 3"
              class="text-xs text-muted-foreground"
            >
              +{{ item.tags.length - 3 }}
            </span>
          </div>
        </div>
      </div>

      <!-- 悬停效果 -->
      <div class="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </a>

    <!-- 管理按钮（仅管理员可见） -->
    <div
      v-if="showAdminActions && authStore.isAuthenticated"
      class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <Menu as="div" class="relative">
        <MenuButton
          class="p-1 rounded-md hover:bg-accent transition-colors"
          @click.stop
        >
          <MoreVerticalIcon class="h-4 w-4" />
        </MenuButton>

        <transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <MenuItems class="absolute right-0 mt-1 w-32 origin-top-right bg-popover rounded-md shadow-lg ring-1 ring-black/5 focus:outline-none z-10">
            <div class="py-1">
              <MenuItem v-slot="{ active }">
                <button
                  :class="cn(
                    'group flex w-full items-center px-3 py-2 text-sm',
                    active ? 'bg-accent text-accent-foreground' : 'text-foreground'
                  )"
                  @click="$emit('edit', item)"
                >
                  <EditIcon class="mr-2 h-4 w-4" />
                  编辑
                </button>
              </MenuItem>
              
              <MenuItem v-slot="{ active }">
                <button
                  :class="cn(
                    'group flex w-full items-center px-3 py-2 text-sm',
                    active ? 'bg-accent text-accent-foreground' : 'text-foreground'
                  )"
                  @click="$emit('toggle-enabled', item)"
                >
                  <EyeIcon v-if="!item.enabled" class="mr-2 h-4 w-4" />
                  <EyeOffIcon v-else class="mr-2 h-4 w-4" />
                  {{ item.enabled ? '禁用' : '启用' }}
                </button>
              </MenuItem>
              
              <MenuItem v-slot="{ active }">
                <button
                  :class="cn(
                    'group flex w-full items-center px-3 py-2 text-sm text-destructive',
                    active ? 'bg-destructive/10' : ''
                  )"
                  @click="$emit('delete', item)"
                >
                  <TrashIcon class="mr-2 h-4 w-4" />
                  删除
                </button>
              </MenuItem>
            </div>
          </MenuItems>
        </transition>
      </Menu>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import {
  ExternalLinkIcon,
  MoreVerticalIcon,
  EditIcon,
  EyeIcon,
  EyeOffIcon,
  TrashIcon,
} from 'lucide-vue-next'
import { Card, Badge } from '@/components/ui'
import { useAuthStore } from '@/stores'
import type { NavigationSubItem } from '@/types'
import { cn, isValidUrl } from '@/utils'

interface Props {
  item: NavigationSubItem
  showAdminActions?: boolean
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  showAdminActions: false,
})

const emit = defineEmits<{
  edit: [item: NavigationSubItem]
  'toggle-enabled': [item: NavigationSubItem]
  delete: [item: NavigationSubItem]
}>()

const authStore = useAuthStore()
const imageLoaded = ref(false)

const handleClick = (event: MouseEvent) => {
  // 如果点击的是管理按钮，不执行跳转
  if ((event.target as HTMLElement).closest('.menu-button')) {
    event.preventDefault()
    return
  }

  // 记录点击统计（如果需要）
  console.log('Navigation item clicked:', props.item.title)
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>