<template>
  <Dialog :open="open" @close="$emit('close')" class="z-50">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
    
    <div class="fixed inset-0 overflow-y-auto">
      <div class="flex min-h-full items-start justify-center p-4 pt-16">
        <div class="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-card shadow-xl transition-all">
          <!-- 搜索头部 -->
          <div class="border-b border-border p-4">
            <div class="flex items-center space-x-3">
              <SearchIcon class="h-5 w-5 text-muted-foreground" />
              <input
                ref="searchInput"
                v-model="query"
                type="text"
                placeholder="搜索导航项目..."
                class="flex-1 bg-transparent text-lg placeholder:text-muted-foreground focus:outline-none"
                @keydown="handleKeydown"
              />
              <kbd class="text-xs bg-muted px-2 py-1 rounded">ESC</kbd>
            </div>
          </div>

          <!-- 搜索过滤器 -->
          <div v-if="showFilters" class="border-b border-border p-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <!-- 分类过滤 -->
              <div>
                <label class="text-sm font-medium text-foreground mb-2 block">
                  分类
                </label>
                <Combobox
                  v-model="selectedCategory"
                  :options="categoryOptions"
                  placeholder="选择分类"
                />
              </div>

              <!-- 标签过滤 -->
              <div>
                <label class="text-sm font-medium text-foreground mb-2 block">
                  标签
                </label>
                <Combobox
                  v-model="selectedTag"
                  :options="tagOptions"
                  placeholder="选择标签"
                />
              </div>

              <!-- 排序 -->
              <div>
                <label class="text-sm font-medium text-foreground mb-2 block">
                  排序
                </label>
                <Combobox
                  v-model="sortBy"
                  :options="sortOptions"
                  placeholder="排序方式"
                />
              </div>
            </div>
          </div>

          <!-- 搜索结果 -->
          <div class="max-h-96 overflow-y-auto">
            <!-- 搜索建议 -->
            <div v-if="!query && recentSearches.length > 0" class="p-4">
              <h3 class="text-sm font-medium text-foreground mb-3">最近搜索</h3>
              <div class="space-y-1">
                <button
                  v-for="search in recentSearches"
                  :key="search"
                  class="flex items-center w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                  @click="query = search"
                >
                  <ClockIcon class="h-4 w-4 mr-3" />
                  {{ search }}
                </button>
              </div>
            </div>

            <!-- 热门搜索 -->
            <div v-if="!query && popularSearches.length > 0" class="p-4 border-t border-border">
              <h3 class="text-sm font-medium text-foreground mb-3">热门搜索</h3>
              <div class="flex flex-wrap gap-2">
                <Badge
                  v-for="search in popularSearches"
                  :key="search"
                  variant="secondary"
                  class="cursor-pointer hover:bg-accent"
                  @click="query = search"
                >
                  {{ search }}
                </Badge>
              </div>
            </div>

            <!-- 搜索结果 -->
            <div v-if="query && filteredResults.length > 0" class="p-2">
              <div
                v-for="(result, index) in filteredResults.slice(0, maxResults)"
                :key="`${result.category.id}-${result.item.id}`"
                :class="cn(
                  'flex items-center p-3 rounded-md cursor-pointer transition-colors',
                  index === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                )"
                @click="selectResult(result)"
                @mouseenter="selectedIndex = index"
              >
                <!-- 图标 -->
                <div class="flex-shrink-0 mr-3">
                  <img
                    v-if="result.item.icon && isValidUrl(result.item.icon)"
                    :src="result.item.icon"
                    :alt="result.item.title"
                    class="h-6 w-6 rounded"
                    @error="handleImageError"
                  />
                  <div v-else class="h-6 w-6 bg-muted rounded flex items-center justify-center">
                    <span class="text-xs font-medium">
                      {{ result.item.title.charAt(0) }}
                    </span>
                  </div>
                </div>

                <!-- 内容 -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2">
                    <span
                      class="font-medium truncate"
                      v-html="highlightText(result.item.title, query)"
                    />
                    <Badge variant="outline" class="text-xs">
                      {{ result.category.title }}
                    </Badge>
                  </div>
                  <p
                    v-if="result.item.description"
                    class="text-sm text-muted-foreground truncate mt-0.5"
                    v-html="highlightText(result.item.description, query)"
                  />
                </div>

                <!-- 快捷键提示 -->
                <div class="flex-shrink-0 ml-3">
                  <kbd v-if="index === selectedIndex" class="text-xs bg-muted px-1.5 py-0.5 rounded">
                    ↵
                  </kbd>
                </div>
              </div>

              <!-- 更多结果提示 -->
              <div
                v-if="filteredResults.length > maxResults"
                class="px-3 py-2 text-sm text-muted-foreground border-t border-border mt-2"
              >
                还有 {{ filteredResults.length - maxResults }} 个结果...
                <Button variant="link" size="sm" class="ml-2" @click="viewAllResults">
                  查看全部
                </Button>
              </div>
            </div>

            <!-- 无结果 -->
            <div
              v-else-if="query && filteredResults.length === 0"
              class="p-8 text-center"
            >
              <SearchXIcon class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 class="text-lg font-medium mb-2">没有找到相关结果</h3>
              <p class="text-muted-foreground mb-4">
                尝试使用不同的关键词或调整过滤条件
              </p>
              <Button variant="outline" size="sm" @click="clearFilters">
                清除过滤器
              </Button>
            </div>

            <!-- 空状态 -->
            <div v-if="!query && recentSearches.length === 0 && popularSearches.length === 0" class="p-8 text-center">
              <SearchIcon class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 class="text-lg font-medium mb-2">开始搜索</h3>
              <p class="text-muted-foreground">
                输入关键词搜索 {{ navigationStore.totalItems }} 个导航项目
              </p>
            </div>
          </div>

          <!-- 搜索底部 -->
          <div class="border-t border-border p-4">
            <div class="flex items-center justify-between text-sm text-muted-foreground">
              <div class="flex items-center space-x-4">
                <button
                  class="flex items-center space-x-1 hover:text-foreground transition-colors"
                  @click="showFilters = !showFilters"
                >
                  <FilterIcon class="h-4 w-4" />
                  <span>{{ showFilters ? '隐藏' : '显示' }}过滤器</span>
                </button>
                <span>{{ filteredResults.length }} 个结果</span>
              </div>
              
              <div class="flex items-center space-x-2">
                <kbd class="bg-muted px-1.5 py-0.5 rounded text-xs">↑↓</kbd>
                <span>导航</span>
                <kbd class="bg-muted px-1.5 py-0.5 rounded text-xs">↵</kbd>
                <span>选择</span>
                <kbd class="bg-muted px-1.5 py-0.5 rounded text-xs">ESC</kbd>
                <span>关闭</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  SearchIcon,
  SearchXIcon,
  ClockIcon,
  FilterIcon,
} from 'lucide-vue-next'
import { Dialog, Button, Badge, Combobox } from '@/components/ui'
import { useNavigationStore } from '@/stores'
import { cn, isValidUrl } from '@/utils'

interface Props {
  open: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  select: [item: any]
}>()

const router = useRouter()
const navigationStore = useNavigationStore()

const searchInput = ref<HTMLInputElement>()
const query = ref('')
const selectedIndex = ref(0)
const selectedCategory = ref<string | null>(null)
const selectedTag = ref<string | null>(null)
const sortBy = ref('relevance')
const showFilters = ref(false)
const maxResults = ref(8)

// 本地存储的搜索历史
const recentSearches = ref<string[]>([])
const popularSearches = ref(['GitHub', 'Vue', 'React', 'TypeScript', 'Tailwind'])

// 计算属性
const categoryOptions = computed(() => [
  { label: '所有分类', value: null },
  ...navigationStore.enabledCategories.map(cat => ({
    label: cat.title,
    value: cat.id,
  }))
])

const tagOptions = computed(() => {
  const tags = new Set<string>()
  navigationStore.enabledCategories.forEach(category => {
    category.items.forEach(item => {
      item.tags?.forEach(tag => tags.add(tag))
    })
    category.subCategories?.forEach(sub => {
      sub.items.forEach(item => {
        item.tags?.forEach(tag => tags.add(tag))
      })
    })
  })
  
  return [
    { label: '所有标签', value: null },
    ...Array.from(tags).map(tag => ({ label: tag, value: tag }))
  ]
})

const sortOptions = computed(() => [
  { label: '相关性', value: 'relevance' },
  { label: '标题', value: 'title' },
  { label: '分类', value: 'category' },
  { label: '最近更新', value: 'updated' },
])

const filteredResults = computed(() => {
  if (!query.value) return []

  let results = navigationStore.searchItems(query.value)

  // 分类过滤
  if (selectedCategory.value) {
    results = results.filter(result => result.category.id === selectedCategory.value)
  }

  // 标签过滤
  if (selectedTag.value) {
    results = results.filter(result => 
      result.item.tags?.includes(selectedTag.value)
    )
  }

  // 排序
  if (sortBy.value !== 'relevance') {
    results.sort((a, b) => {
      switch (sortBy.value) {
        case 'title':
          return a.item.title.localeCompare(b.item.title)
        case 'category':
          return a.category.title.localeCompare(b.category.title)
        case 'updated':
          return new Date(b.item.updatedAt || 0).getTime() - new Date(a.item.updatedAt || 0).getTime()
        default:
          return 0
      }
    })
  }

  return results
})

// 方法
const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, filteredResults.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
      break
    case 'Enter':
      event.preventDefault()
      if (filteredResults.value[selectedIndex.value]) {
        selectResult(filteredResults.value[selectedIndex.value])
      }
      break
    case 'Escape':
      emit('close')
      break
  }
}

const selectResult = (result: any) => {
  // 添加到搜索历史
  if (query.value && !recentSearches.value.includes(query.value)) {
    recentSearches.value.unshift(query.value)
    recentSearches.value = recentSearches.value.slice(0, 5)
    localStorage.setItem('search_history', JSON.stringify(recentSearches.value))
  }

  emit('select', result.item)
  emit('close')
}

const viewAllResults = () => {
  router.push({
    path: '/navigation',
    query: {
      q: query.value,
      category: selectedCategory.value,
      tag: selectedTag.value,
    }
  })
  emit('close')
}

const clearFilters = () => {
  selectedCategory.value = null
  selectedTag.value = null
  sortBy.value = 'relevance'
}

const highlightText = (text: string, searchQuery: string) => {
  if (!searchQuery.trim()) return text
  
  const regex = new RegExp(`(${searchQuery})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">$1</mark>')
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

// 监听器
watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    searchInput.value?.focus()
    selectedIndex.value = 0
  } else {
    query.value = ''
    selectedIndex.value = 0
    showFilters.value = false
  }
})

watch(query, () => {
  selectedIndex.value = 0
})

// 生命周期
onMounted(() => {
  // 加载搜索历史
  const saved = localStorage.getItem('search_history')
  if (saved) {
    try {
      recentSearches.value = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to parse search history:', e)
    }
  }
})
</script>