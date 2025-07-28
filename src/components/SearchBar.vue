<template>
  <div class="relative">
    <Combobox
      v-model="selectedItem"
      @update:model-value="handleSelect"
    >
      <div class="relative">
        <ComboboxInput
          :class="cn(
            'w-full h-9 pl-9 pr-4 text-sm bg-background border border-input rounded-md',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            className
          )"
          :placeholder="placeholder"
          :display-value="() => ''"
          @change="query = $event.target.value"
          @focus="showResults = true"
          @keydown="handleKeydown"
        />
        
        <SearchIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        
        <kbd
          v-if="showShortcut"
          class="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs bg-muted px-1.5 py-0.5 rounded"
        >
          ⌘K
        </kbd>
      </div>

      <TransitionRoot
        leave="transition ease-in duration-100"
        leave-from="opacity-100"
        leave-to="opacity-0"
        @after-leave="query = ''"
      >
        <ComboboxOptions
          v-if="showResults && (filteredResults.length > 0 || query)"
          class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-popover py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm"
        >
          <!-- 搜索结果 -->
          <div v-if="filteredResults.length > 0">
            <div
              v-for="(result, index) in filteredResults.slice(0, maxResults)"
              :key="`${result.category.id}-${result.item.id}`"
            >
              <ComboboxOption
                v-slot="{ selected, active }"
                as="template"
                :value="result"
              >
                <li
                  :class="cn(
                    'relative cursor-pointer select-none py-2 pl-3 pr-9',
                    active ? 'bg-accent text-accent-foreground' : 'text-foreground'
                  )"
                >
                  <div class="flex items-center space-x-3">
                    <!-- 图标 -->
                    <div class="flex-shrink-0">
                      <img
                        v-if="result.item.icon && isValidUrl(result.item.icon)"
                        :src="result.item.icon"
                        :alt="result.item.title"
                        class="h-4 w-4 rounded"
                        @error="handleImageError"
                      />
                      <div v-else class="h-4 w-4 bg-muted rounded flex items-center justify-center">
                        <span class="text-xs">{{ result.item.title.charAt(0) }}</span>
                      </div>
                    </div>

                    <!-- 内容 -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center space-x-2">
                        <span
                          :class="cn(
                            'font-medium truncate',
                            selected ? 'font-semibold' : ''
                          )"
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

                    <!-- 选中指示器 -->
                    <span
                      v-if="selected"
                      class="absolute inset-y-0 right-0 flex items-center pr-3 text-accent-foreground"
                    >
                      <CheckIcon class="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                </li>
              </ComboboxOption>
            </div>

            <!-- 更多结果提示 -->
            <div
              v-if="filteredResults.length > maxResults"
              class="px-3 py-2 text-sm text-muted-foreground border-t"
            >
              还有 {{ filteredResults.length - maxResults }} 个结果...
            </div>
          </div>

          <!-- 无结果 -->
          <div
            v-else-if="query"
            class="relative cursor-default select-none py-2 px-3 text-muted-foreground"
          >
            没有找到 "{{ query }}" 的相关结果
          </div>

          <!-- 搜索建议 -->
          <div v-else class="px-3 py-2 text-sm text-muted-foreground">
            输入关键词搜索导航项目...
          </div>
        </ComboboxOptions>
      </TransitionRoot>
    </Combobox>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
  TransitionRoot,
} from '@headlessui/vue'
import { SearchIcon, CheckIcon } from 'lucide-vue-next'
import { Badge } from '@/components/ui'
import { useNavigationStore } from '@/stores'
import type { NavigationCategory } from '@/types'
import { cn, isValidUrl } from '@/utils'

interface SearchResult {
  category: NavigationCategory
  item: any
  score: number
}

interface Props {
  navigationData: NavigationCategory[]
  placeholder?: string
  maxResults?: number
  showShortcut?: boolean
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '搜索导航项目...',
  maxResults: 8,
  showShortcut: true,
})

const emit = defineEmits<{
  search: [query: string]
  select: [item: any]
}>()

const navigationStore = useNavigationStore()

const query = ref('')
const selectedItem = ref<SearchResult | null>(null)
const showResults = ref(false)

// 计算属性
const filteredResults = computed(() => {
  if (!query.value.trim()) return []

  const results = navigationStore.searchItems(query.value)
  return results.map(result => ({
    category: result.category,
    item: result.item,
    score: result.score,
  })).sort((a, b) => b.score - a.score)
})

// 方法
const handleSelect = (result: SearchResult | null) => {
  if (result) {
    emit('select', result.item)
    selectedItem.value = null
    query.value = ''
    showResults.value = false
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    showResults.value = false
    query.value = ''
  }
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

const highlightText = (text: string, searchQuery: string) => {
  if (!searchQuery.trim()) return text
  
  const regex = new RegExp(`(${searchQuery})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">$1</mark>')
}

// 全局快捷键
const handleGlobalKeydown = (event: KeyboardEvent) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    event.preventDefault()
    const input = document.querySelector('input[placeholder*="搜索"]') as HTMLInputElement
    if (input) {
      input.focus()
      showResults.value = true
    }
  }
}

// 点击外部关闭
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.search-container')) {
    showResults.value = false
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
  document.removeEventListener('click', handleClickOutside)
})
</script>