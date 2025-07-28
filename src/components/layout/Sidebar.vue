<template>
  <aside
    :class="cn(
      'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
      isOpen ? 'translate-x-0' : '-translate-x-full'
    )"
  >
    <div class="flex flex-col h-full">
      <!-- 侧边栏头部 -->
      <div class="flex items-center justify-between p-4 border-b border-border">
        <div class="flex items-center space-x-3">
          <img
            v-if="siteInfo?.appearance?.logo"
            :src="siteInfo.appearance.logo"
            :alt="siteInfo.basic?.title"
            class="h-8 w-8 rounded"
          />
          <div class="flex-1 min-w-0">
            <h1 class="text-lg font-semibold text-foreground truncate">
              {{ siteInfo?.basic?.title || 'NavSphere' }}
            </h1>
          </div>
        </div>
        
        <!-- 移动端关闭按钮 -->
        <Button
          variant="ghost"
          size="icon"
          class="lg:hidden"
          @click="$emit('close')"
        >
          <XIcon class="h-5 w-5" />
        </Button>
      </div>

      <!-- 导航菜单 -->
      <nav class="flex-1 overflow-y-auto p-4">
        <div class="space-y-2">
          <!-- 分类列表 -->
          <div v-for="category in enabledCategories" :key="category.id">
            <button
              :class="cn(
                'w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                selectedCategory === category.id
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )"
              @click="selectCategory(category.id)"
            >
              <span v-if="category.icon" class="mr-3 text-base">
                {{ category.icon }}
              </span>
              <span class="flex-1 text-left truncate">{{ category.title }}</span>
              <span class="ml-2 text-xs bg-muted px-2 py-1 rounded-full">
                {{ getCategoryItemCount(category) }}
              </span>
            </button>

            <!-- 子分类 -->
            <div
              v-if="category.subCategories && selectedCategory === category.id"
              class="ml-6 mt-2 space-y-1"
            >
              <button
                v-for="subCategory in category.subCategories.filter(sub => sub.enabled)"
                :key="subCategory.id"
                :class="cn(
                  'w-full flex items-center px-3 py-1.5 text-sm rounded-md transition-colors',
                  selectedSubCategory === subCategory.id
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )"
                @click="selectSubCategory(subCategory.id)"
              >
                <span class="flex-1 text-left truncate">{{ subCategory.title }}</span>
                <span class="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">
                  {{ subCategory.items.filter(item => item.enabled).length }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <!-- 侧边栏底部 -->
      <div class="p-4 border-t border-border">
        <div class="space-y-3">
          <!-- 搜索按钮 -->
          <Button
            variant="outline"
            size="sm"
            class="w-full justify-start"
            @click="$emit('open-search')"
          >
            <SearchIcon class="mr-2 h-4 w-4" />
            搜索导航
            <kbd class="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
          </Button>

          <!-- 主题切换 -->
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">主题</span>
            <ThemeToggle />
          </div>

          <!-- 统计信息 -->
          <div class="text-xs text-muted-foreground space-y-1">
            <div class="flex justify-between">
              <span>分类:</span>
              <span>{{ enabledCategories.length }}</span>
            </div>
            <div class="flex justify-between">
              <span>项目:</span>
              <span>{{ totalEnabledItems }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { XIcon, SearchIcon } from 'lucide-vue-next'
import { Button, ThemeToggle } from '@/components/ui'
import type { NavigationCategory, SiteConfig } from '@/types'
import { cn } from '@/utils'

interface Props {
  navigationData: NavigationCategory[]
  siteInfo?: SiteConfig | null
  isOpen: boolean
}

const props = defineProps<Props>()

defineEmits<{
  close: []
  'open-search': []
}>()

const selectedCategory = ref<string | null>(null)
const selectedSubCategory = ref<string | null>(null)

// 计算属性
const enabledCategories = computed(() =>
  props.navigationData.filter(cat => cat.enabled)
)

const totalEnabledItems = computed(() => {
  return enabledCategories.value.reduce((total, category) => {
    let count = category.items.filter(item => item.enabled).length
    
    if (category.subCategories) {
      count += category.subCategories.reduce((subTotal, sub) => {
        if (!sub.enabled) return subTotal
        return subTotal + sub.items.filter(item => item.enabled).length
      }, 0)
    }
    
    return total + count
  }, 0)
})

// 方法
const selectCategory = (categoryId: string) => {
  if (selectedCategory.value === categoryId) {
    selectedCategory.value = null
    selectedSubCategory.value = null
  } else {
    selectedCategory.value = categoryId
    selectedSubCategory.value = null
  }
}

const selectSubCategory = (subCategoryId: string) => {
  selectedSubCategory.value = subCategoryId
}

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
</script>