<template>
  <footer class="border-t bg-background">
    <div class="container mx-auto px-4 py-6">
      <div class="grid gap-8 md:grid-cols-4">
        <!-- 站点信息 -->
        <div class="md:col-span-2">
          <div class="flex items-center space-x-3 mb-4">
            <img
              v-if="siteInfo?.appearance?.logo"
              :src="siteInfo.appearance.logo"
              :alt="siteInfo.basic?.title"
              class="h-8 w-8 rounded"
            />
            <h3 class="text-lg font-semibold">
              {{ siteInfo?.basic?.title || 'NavSphere' }}
            </h3>
          </div>
          <p class="text-sm text-muted-foreground mb-4 max-w-md">
            {{ siteInfo?.basic?.description || '现代化导航管理平台' }}
          </p>
          <div class="flex space-x-4">
            <a
              href="https://github.com/tianyaxiang/NavSphere"
              target="_blank"
              rel="noopener noreferrer"
              class="text-muted-foreground hover:text-foreground transition-colors"
            >
              <GithubIcon class="h-5 w-5" />
            </a>
            <a
              v-if="siteInfo?.basic?.email"
              :href="`mailto:${siteInfo.basic.email}`"
              class="text-muted-foreground hover:text-foreground transition-colors"
            >
              <MailIcon class="h-5 w-5" />
            </a>
          </div>
        </div>

        <!-- 快速链接 -->
        <div>
          <h4 class="font-semibold mb-4">快速链接</h4>
          <ul class="space-y-2 text-sm">
            <li>
              <router-link
                to="/"
                class="text-muted-foreground hover:text-foreground transition-colors"
              >
                首页
              </router-link>
            </li>
            <li v-if="authStore.isAuthenticated">
              <router-link
                to="/admin"
                class="text-muted-foreground hover:text-foreground transition-colors"
              >
                管理后台
              </router-link>
            </li>
            <li v-else>
              <router-link
                to="/login"
                class="text-muted-foreground hover:text-foreground transition-colors"
              >
                登录
              </router-link>
            </li>
            <li>
              <a
                href="https://github.com/tianyaxiang/NavSphere"
                target="_blank"
                rel="noopener noreferrer"
                class="text-muted-foreground hover:text-foreground transition-colors"
              >
                GitHub
              </a>
            </li>
          </ul>
        </div>

        <!-- 统计信息 -->
        <div>
          <h4 class="font-semibold mb-4">统计信息</h4>
          <ul class="space-y-2 text-sm text-muted-foreground">
            <li class="flex justify-between">
              <span>分类数量:</span>
              <span>{{ navigationStore.totalCategories }}</span>
            </li>
            <li class="flex justify-between">
              <span>项目数量:</span>
              <span>{{ navigationStore.totalItems }}</span>
            </li>
            <li class="flex justify-between">
              <span>启用项目:</span>
              <span>{{ navigationStore.enabledItems }}</span>
            </li>
            <li v-if="navigationStore.lastUpdated" class="flex justify-between">
              <span>最后更新:</span>
              <span>{{ formatDate(navigationStore.lastUpdated) }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 底部版权信息 -->
      <div class="mt-8 pt-6 border-t border-border">
        <div class="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div class="text-sm text-muted-foreground">
            © {{ currentYear }} {{ siteInfo?.basic?.title || 'NavSphere' }}.
            <span v-if="siteInfo?.basic?.author">
              由 {{ siteInfo.basic.author }} 创建.
            </span>
            基于 Vue 3 构建.
          </div>
          
          <div class="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>当前主题: {{ currentTheme }}</span>
            <Separator orientation="vertical" class="h-4" />
            <span>版本: v1.0.0</span>
            <Separator orientation="vertical" class="h-4" />
            <button
              @click="scrollToTop"
              class="hover:text-foreground transition-colors"
            >
              回到顶部
            </button>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { GithubIcon, MailIcon } from 'lucide-vue-next'
import { Separator } from '@/components/ui'
import { useAuthStore, useNavigationStore, useThemeStore } from '@/stores'
import type { SiteConfig } from '@/types'

interface Props {
  siteInfo?: SiteConfig | null
}

defineProps<Props>()

const authStore = useAuthStore()
const navigationStore = useNavigationStore()
const themeStore = useThemeStore()

// 计算属性
const currentYear = computed(() => new Date().getFullYear())
const currentTheme = computed(() => {
  const theme = themeStore.currentTheme
  return theme === 'dark' ? '深色' : '浅色'
})

// 方法
const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN')
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}
</script>