<template>
  <div class="space-y-8">
    <!-- 搜索结果 -->
    <div v-if="searchQuery && searchResults.length > 0" class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">
          搜索结果 "{{ searchQuery }}"
        </h2>
        <Button variant="outline" size="sm" @click="clearSearch">
          <XIcon class="h-4 w-4 mr-1" />
          清除搜索
        </Button>
      </div>

      <div class="space-y-6">
        <div
          v-for="result in searchResults"
          :key="result.category.id"
          class="space-y-3"
        >
          <div class="flex items-center space-x-2">
            <span v-if="result.category.icon" class="text-lg">
              {{ result.category.icon }}
            </span>
            <h3 class="text-lg font-medium">{{ result.category.title }}</h3>
            <Badge variant="outline">{{ result.items.length }} 项</Badge>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <NavigationCard
              v-for="item in result.items"
              :key="item.id"
              :item="item"
              :show-admin-actions="showAdminActions"
              @edit="$emit('edit-item', $event)"
              @toggle-enabled="$emit('toggle-item-enabled', $event)"
              @delete="$emit('delete-item', $event)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 无搜索结果 -->
    <div
      v-else-if="searchQuery && searchResults.length === 0"
      class="text-center py-12"
    >
      <SearchIcon class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 class="text-lg font-medium mb-2">没有找到相关结果</h3>
      <p class="text-muted-foreground mb-4">
        尝试使用不同的关键词或检查拼写
      </p>
      <Button variant="outline" @click="clearSearch">
        清除搜索
      </Button>
    </div>

    <!-- 正常分类显示 -->
    <div v-else class="space-y-8">
      <div
        v-for="category in enabledCategories"
        :key="category.id"
        :id="category.id"
        class="scroll-mt-20"
      >
        <!-- 分类标题 -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center space-x-3">
            <span v-if="category.icon" class="text-2xl">
              {{ category.icon }}
            </span>
            <div>
              <h2 class="text-xl font-semibold">{{ category.title }}</h2>
              <p v-if="category.description" class="text-sm text-muted-foreground mt-1">
                {{ category.description }}
              </p>
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <Badge variant="outline">
              {{ getCategoryItemCount(category) }} 项
            </Badge>
            
            <!-- 管理按钮 -->
            <Menu v-if="showAdminActions && authStore.isAuthenticated" as="div" class="relative">
              <MenuButton
                class="p-2 rounded-md hover:bg-accent transition-colors"
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
                <MenuItems class="absolute right-0 mt-1 w-40 origin-top-right bg-popover rounded-md shadow-lg ring-1 ring-black/5 focus:outline-none z-10">
                  <div class="py-1">
                    <MenuItem v-slot="{ active }">
                      <button
                        :class="cn(
                          'group flex w-full items-center px-3 py-2 text-sm',
                          active ? 'bg-accent text-accent-foreground' : 'text-foreground'
                        )"
                        @click="$emit('add-item', category)"
                      >
                        <PlusIcon class="mr-2 h-4 w-4" />
                        添加项目
                      </button>
                    </MenuItem>
                    
                    <MenuItem v-slot="{ active }">
                      <button
                        :class="cn(
                          'group flex w-full items-center px-3 py-2 text-sm',
                          active ? 'bg-accent text-accent-foreground' : 'text-foreground'
                        )"
                        @click="$emit('edit-category', category)"
                      >
                        <EditIcon class="mr-2 h-4 w-4" />
                        编辑分类
                      </button>
                    </MenuItem>
                  </div>
                </MenuItems>
              </transition>
            </Menu>
          </div>
        </div>

        <!-- 子分类 -->
        <div v-if="category.subCategories && category.subCategories.length > 0" class="space-y-8">
          <div
            v-for="subCategory in category.subCategories.filter(sub => sub.enabled)"
            :key="subCategory.id"
            :id="subCategory.id"
            class="space-y-4"
          >
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium text-muted-foreground">
                {{ subCategory.title }}
              </h3>
              <Badge variant="secondary" class="text-xs">
                {{ subCategory.items.filter(item => item.enabled).length }} 项
              </Badge>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <NavigationCard
                v-for="item in subCategory.items.filter(item => item.enabled)"
                :key="item.id"
                :item="item"
                :show-admin-actions="showAdminActions"
                @edit="$emit('edit-item', $event)"
                @toggle-enabled="$emit('toggle-item-enabled', $event)"
                @delete="$emit('delete-item', $event)"
              />
            </div>
          </div>
        </div>

        <!-- 主分类项目 -->
        <div v-if="category.items && category.items.length > 0">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <NavigationCard
              v-for="item in category.items.filter(item => item.enabled)"
              :key="item.id"
              :item="item"
              :show-admin-actions="showAdminActions"
              @edit="$emit('edit-item', $event)"
              @toggle-enabled="$emit('toggle-item-enabled', $event)"
              @delete="$emit('delete-item', $event)"
            />
          </div>
        </div>

        <!-- 空分类提示 -->
        <div
          v-if="getCategoryItemCount(category) === 0"
          class="text-center py-12 border-2 border-dashed border-muted rounded-lg"
        >
          <FolderIcon class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 class="text-lg font-medium mb-2">此分类暂无项目</h3>
          <p class="text-muted-foreground mb-4">
            {{ showAdminActions ? '点击上方按钮添加第一个项目' : '管理员正在添加内容' }}
          </p>
          <Button
            v-if="showAdminActions && authStore.isAuthenticated"
            variant="outline"
            @click="$emit('add-item', category)"
          >
            <PlusIcon class="h-4 w-4 mr-1" />
            添加项目
          </Button>
        </div>
      </div>
    </div>

    <!-- 无数据状态 -->
    <div
      v-if="!searchQuery && enabledCategories.length === 0"
      class="text-center py-16"
    >
      <DatabaseIcon class="h-16 w-16 text-muted-foreground mx-auto mb-6" />
      <h2 class="text-2xl font-semibold mb-4">暂无导航数据</h2>
      <p class="text-muted-foreground mb-6 max-w-md mx-auto">
        {{ showAdminActions ? '开始创建您的第一个导航分类和项目' : '管理员正在配置导航内容，请稍后查看' }}
      </p>
      <Button
        v-if="showAdminActions && authStore.isAuthenticated"
        @click="$emit('add-category')"
      >
        <PlusIcon class="h-4 w-4 mr-1" />
        创建分类
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import {
  XIcon,
  SearchIcon,
  MoreVerticalIcon,
  PlusIcon,
  EditIcon,
  FolderIcon,
  DatabaseIcon,
} from 'lucide-vue-next'
import { Button, Badge } from '@/components/ui'
import NavigationCard from './NavigationCard.vue'
import { useAuthStore } from '@/stores'
import type { NavigationCategory, NavigationSubItem, SearchResult } from '@/types'
import { cn } from '@/utils'

interface Props {
  navigationData: NavigationCategory[]
  searchQuery?: string
  searchResults?: SearchResult[]
  showAdminActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  searchQuery: '',
  searchResults: () => [],
  showAdminActions: false,
})

const emit = defineEmits<{
  'clear-search': []
  'add-category': []
  'edit-category': [category: NavigationCategory]
  'add-item': [category: NavigationCategory]
  'edit-item': [item: NavigationSubItem]
  'toggle-item-enabled': [item: NavigationSubItem]
  'delete-item': [item: NavigationSubItem]
}>()

const authStore = useAuthStore()

// 计算属性
const enabledCategories = computed(() =>
  props.navigationData.filter(cat => cat.enabled)
)

// 方法
const getCategoryItemCount = (category: NavigationCategory) => {
  let count = category.items.filter(item => item.enabled).length
  
  if (category.subCategories) {
    count += category.subCategories.reduce((subTotal, sub) => {
      if (!sub.enabled) return subTotal
      return subTotal + sub.items.filter(item => item.enabled).length
    }, 0)
  }
  
  return count
}

const clearSearch = () => {
  emit('clear-search')
}
</script>