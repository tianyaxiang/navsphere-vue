<template>
  <div class="min-h-screen bg-background">
    <!-- 顶部搜索和过滤栏 -->
    <div class="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="container mx-auto px-4 py-4">
        <div class="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <!-- 搜索框 -->
          <div class="flex-1 max-w-md">
            <SearchBar
              :navigation-data="navigationStore.categories"
              :placeholder="'搜索 ' + navigationStore.totalItems + ' 个导航项目...'"
              @search="handleSearch"
              @select="handleSearchSelect"
            />
          </div>

          <!-- 过滤和排序 -->
          <div class="flex items-center space-x-2">
            <!-- 分类过滤 -->
            <Combobox
              v-model="selectedCategory"
              :options="categoryOptions"
              placeholder="选择分类"
              class="w-40"
              @update:model-value="handleCategoryFilter"
            />

            <!-- 排序选择 -->
            <Menu as="div" class="relative">
              <MenuButton
                class="inline-flex items-center px-3 py-2 text-sm font-medium text-foreground bg-background border border-input rounded-md hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <ArrowUpDownIcon class="h-4 w-4 mr-2" />
                {{ getSortLabel() }}
                <ChevronDownIcon class="h-4 w-4 ml-2" />
              </MenuButton>

              <transition
                enter-active-class="transition duration-100 ease-out"
                enter-from-class="transform scale-95 opacity-0"
                enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-75 ease-in"
                leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0"
              >
                <MenuItems class="absolute right-0 mt-1 w-48 origin-top-right bg-popover rounded-md shadow-lg ring-1 ring-black/5 focus:outline-none z-10">
                  <div class="py-1">
                    <MenuItem
                      v-for="option in sortOptions"
                      :key="option.value"
                      v-slot="{ active }"
                    >
                      <button
                        :class="cn(
                          'group flex w-full items-center px-3 py-2 text-sm',
                          active ? 'bg-accent text-accent-foreground' : 'text-foreground',
                          sortBy === option.value && 'bg-accent/50'
                        )"
                        @click="setSortBy(option.value)"
                      >
                        <component :is="option.icon" class="mr-2 h-4 w-4" />
                        {{ option.label }}
                        <CheckIcon
                          v-if="sortBy === option.value"
                          class="ml-auto h-4 w-4"
                        />
                      </button>
                    </MenuItem>
                  </div>
                </MenuItems>
              </transition>
            </Menu>

            <!-- 视图切换 -->
            <div class="flex items-center border border-input rounded-md">
              <Button
                variant="ghost"
                size="sm"
                :class="cn(
                  'rounded-r-none border-r',
                  viewMode === 'grid' && 'bg-accent text-accent-foreground'
                )"
                @click="viewMode = 'grid'"
              >
                <GridIcon class="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                :class="cn(
                  'rounded-l-none',
                  viewMode === 'list' && 'bg-accent text-accent-foreground'
                )"
                @click="viewMode = 'list'"
              >
                <ListIcon class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <!-- 活动过滤器显示 -->
        <div v-if="hasActiveFilters" class="mt-3 flex items-center space-x-2">
          <span class="text-sm text-muted-foreground">活动过滤器:</span>
          <Badge
            v-if="selectedCategory"
            variant="secondary"
            class="cursor-pointer"
            @click="clearCategoryFilter"
          >
            {{ selectedCategory }}
            <XIcon class="h-3 w-3 ml-1" />
          </Badge>
          <Badge
            v-if="searchQuery"
            variant="secondary"
            class="cursor-pointer"
            @click="clearSearch"
          >
            搜索: {{ searchQuery }}
            <XIcon class="h-3 w-3 ml-1" />
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            @click="clearAllFilters"
            class="text-xs"
          >
            清除所有
          </Button>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="container mx-auto px-4 py-6">
      <!-- 统计信息 -->
      <div class="mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-foreground">
              {{ getPageTitle() }}
            </h1>
            <p class="text-muted-foreground mt-1">
              {{ getPageDescription() }}
            </p>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold text-primary">
              {{ filteredItems.length }}
            </div>
            <div class="text-sm text-muted-foreground">
              {{ searchQuery ? '搜索结果' : '导航项目' }}
            </div>
          </div>
        </div>
      </div>

      <!-- 导航内容 -->
      <div v-if="filteredItems.length > 0">
        <!-- 网格视图 -->
        <div
          v-if="viewMode === 'grid'"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <NavigationCard
            v-for="result in paginatedItems"
            :key="result.item.id"
            :item="result.item"
            class="animate-in fade-in-0 slide-in-from-bottom-4"
            :style="{ animationDelay: `${result.index * 50}ms` }"
          />
        </div>

        <!-- 列表视图 -->
        <div v-else class="space-y-2">
          <div
            v-for="result in paginatedItems"
            :key="result.item.id"
            class="flex items-center p-4 bg-card rounded-lg border hover:shadow-md transition-shadow animate-in fade-in-0 slide-in-from-left-4"
            :style="{ animationDelay: `${result.index * 30}ms` }"
          >
            <!-- 图标 -->
            <div class="flex-shrink-0 mr-4">
              <img
                v-if="result.item.icon && isValidUrl(result.item.icon)"
                :src="result.item.icon"
                :alt="result.item.title"
                class="h-8 w-8 rounded-md object-cover"
                @error="handleImageError"
              />
              <div
                v-else
                class="h-8 w-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-md flex items-center justify-center"
              >
                <span class="text-sm font-semibold text-primary">
                  {{ result.item.title.charAt(0).toUpperCase() }}
                </span>
              </div>
            </div>

            <!-- 内容 -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <h3 class="font-medium text-foreground truncate">
                  {{ result.item.title }}
                </h3>
                <Badge variant="outline" class="ml-2">
                  {{ result.category.title }}
                </Badge>
              </div>
              <p class="text-sm text-muted-foreground truncate mt-1">
                {{ result.item.description }}
              </p>
            </div>

            <!-- 操作按钮 -->
            <div class="flex-shrink-0 ml-4">
              <Button
                variant="ghost"
                size="sm"
                @click="openLink(result.item.href)"
              >
                <ExternalLinkIcon class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="mt-8 flex justify-center">
          <div class="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              <ChevronLeftIcon class="h-4 w-4" />
              上一页
            </Button>
            
            <div class="flex items-center space-x-1">
              <Button
                v-for="page in visiblePages"
                :key="page"
                :variant="page === currentPage ? 'default' : 'outline'"
                size="sm"
                @click="currentPage = page"
              >
                {{ page }}
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              下一页
              <ChevronRightIcon class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="text-center py-16">
        <SearchIcon class="h-16 w-16 text-muted-foreground mx-auto mb-6" />
        <h2 class="text-2xl font-semibold mb-4">
          {{ searchQuery ? '没有找到相关结果' : '暂无导航项目' }}
        </h2>
        <p class="text-muted-foreground mb-6 max-w-md mx-auto">
          {{ searchQuery 
            ? '尝试使用不同的关键词或清除过滤器' 
            : '管理员正在添加导航内容，请稍后查看' 
          }}
        </p>
        <div class="space-x-2">
          <Button v-if="hasActiveFilters" variant="outline" @click="clearAllFilters">
            清除过滤器
          </Button>
          <Button @click="$router.push('/')">
            返回首页
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import {
  ArrowUpDownIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  GridIcon,
  ListIcon,
  XIcon,
  SearchIcon,
  ExternalLinkIcon,
  SortAscIcon,
  SortDescIcon,
  CalendarIcon,
  TagIcon,
} from 'lucide-vue-next'
import { Button, Badge, Combobox } from '@/components/ui'
import SearchBar from '@/components/SearchBar.vue'
import NavigationCard from '@/components/NavigationCard.vue'
import { useNavigationStore, useSiteStore } from '@/stores'
import { cn, isValidUrl } from '@/utils'

const router = useRouter()
const navigationStore = useNavigationStore()
const siteStore = useSiteStore()

// 状态
const searchQuery = ref('')
const selectedCategory = ref<string | null>(null)
const sortBy = ref<'title' | 'category' | 'created' | 'updated'>('title')
const sortOrder = ref<'asc' | 'desc'>('asc')
const viewMode = ref<'grid' | 'list'>('grid')
const currentPage = ref(1)
const itemsPerPage = ref(20)

// 计算属性
const categoryOptions = computed(() => [
  { label: '所有分类', value: null },
  ...navigationStore.enabledCategories.map(cat => ({
    label: cat.title,
    value: cat.id,
  }))
])

const sortOptions = computed(() => [
  { label: '按标题排序', value: 'title', icon: SortAscIcon },
  { label: '按分类排序', value: 'category', icon: TagIcon },
  { label: '按创建时间', value: 'created', icon: CalendarIcon },
  { label: '按更新时间', value: 'updated', icon: CalendarIcon },
])

const allItems = computed(() => {
  const items: Array<{
    item: any
    category: any
    index: number
  }> = []

  navigationStore.enabledCategories.forEach(category => {
    // 主分类项目
    category.items.filter(item => item.enabled).forEach((item, index) => {
      items.push({ item, category, index: items.length })
    })

    // 子分类项目
    category.subCategories?.forEach(subCategory => {
      if (subCategory.enabled) {
        subCategory.items.filter(item => item.enabled).forEach((item, index) => {
          items.push({ item, category, index: items.length })
        })
      }
    })
  })

  return items
})

const filteredItems = computed(() => {
  let items = allItems.value

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(({ item }) => 
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.tags?.some((tag: string) => tag.toLowerCase().includes(query))
    )
  }

  // 分类过滤
  if (selectedCategory.value) {
    items = items.filter(({ category }) => category.id === selectedCategory.value)
  }

  // 排序
  items.sort((a, b) => {
    let aValue: any, bValue: any

    switch (sortBy.value) {
      case 'title':
        aValue = a.item.title
        bValue = b.item.title
        break
      case 'category':
        aValue = a.category.title
        bValue = b.category.title
        break
      case 'created':
        aValue = new Date(a.item.createdAt || 0)
        bValue = new Date(b.item.createdAt || 0)
        break
      case 'updated':
        aValue = new Date(a.item.updatedAt || 0)
        bValue = new Date(b.item.updatedAt || 0)
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortOrder.value === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })

  return items
})

const totalPages = computed(() => Math.ceil(filteredItems.value.length / itemsPerPage.value))

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredItems.value.slice(start, end)
})

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...', total)
    } else if (current >= total - 3) {
      pages.push(1, '...')
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      pages.push(1, '...')
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push('...', total)
    }
  }
  
  return pages.filter(p => p !== '...' || pages.indexOf(p) === pages.lastIndexOf(p))
})

const hasActiveFilters = computed(() => 
  !!searchQuery.value || !!selectedCategory.value
)

// 方法
const handleSearch = (query: string) => {
  searchQuery.value = query
  currentPage.value = 1
}

const handleSearchSelect = (item: any) => {
  openLink(item.href)
}

const handleCategoryFilter = (categoryId: string | null) => {
  selectedCategory.value = categoryId
  currentPage.value = 1
}

const setSortBy = (sort: string) => {
  if (sortBy.value === sort) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = sort as any
    sortOrder.value = 'asc'
  }
  currentPage.value = 1
}

const getSortLabel = () => {
  const option = sortOptions.value.find(opt => opt.value === sortBy.value)
  const orderText = sortOrder.value === 'asc' ? '升序' : '降序'
  return `${option?.label} (${orderText})`
}

const clearSearch = () => {
  searchQuery.value = ''
  currentPage.value = 1
}

const clearCategoryFilter = () => {
  selectedCategory.value = null
  currentPage.value = 1
}

const clearAllFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = null
  currentPage.value = 1
}

const openLink = (href: string) => {
  window.open(href, '_blank', 'noopener,noreferrer')
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

const getPageTitle = () => {
  if (searchQuery.value) {
    return `搜索结果: ${searchQuery.value}`
  }
  if (selectedCategory.value) {
    const category = navigationStore.getCategoryById(selectedCategory.value)
    return category?.title || '分类导航'
  }
  return '全部导航'
}

const getPageDescription = () => {
  if (searchQuery.value) {
    return `找到 ${filteredItems.value.length} 个相关结果`
  }
  if (selectedCategory.value) {
    const category = navigationStore.getCategoryById(selectedCategory.value)
    return category?.description || '浏览此分类下的所有导航项目'
  }
  return `浏览全部 ${filteredItems.value.length} 个导航项目`
}

// 监听器
watch(() => filteredItems.value.length, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = Math.max(1, totalPages.value)
  }
})

// 生命周期
onMounted(async () => {
  await navigationStore.loadNavigationData()
})
</script>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-in-from-bottom {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slide-in-from-left {
  from { transform: translateX(-10px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.animate-in {
  animation-fill-mode: both;
  animation-duration: 0.3s;
  animation-timing-function: ease-out;
}

.fade-in-0 {
  animation-name: fade-in;
}

.slide-in-from-bottom-4 {
  animation-name: slide-in-from-bottom;
}

.slide-in-from-left-4 {
  animation-name: slide-in-from-left;
}
</style>