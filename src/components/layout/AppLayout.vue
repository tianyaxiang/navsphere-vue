<template>
  <div class="min-h-screen bg-background">
    <!-- 主布局容器 -->
    <div class="flex h-screen overflow-hidden">
      <!-- 侧边栏 -->
      <Sidebar
        :navigation-data="navigationStore.categories"
        :site-info="siteStore.config"
        :is-open="sidebarOpen"
        @close="sidebarOpen = false"
      />

      <!-- 主内容区域 -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- 顶部导航栏 -->
        <Header
          :site-info="siteStore.config"
          @toggle-sidebar="sidebarOpen = !sidebarOpen"
        />

        <!-- 页面内容 -->
        <main class="flex-1 overflow-y-auto">
          <div class="container mx-auto px-4 py-6">
            <ErrorBoundary>
              <slot />
            </ErrorBoundary>
          </div>
        </main>

        <!-- 页脚 -->
        <Footer :site-info="siteStore.config" />
      </div>
    </div>

    <!-- 移动端遮罩层 -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
      @click="sidebarOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useNavigationStore, useSiteStore } from '@/stores'
import { ErrorBoundary } from '@/components/ui'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'
import Footer from './Footer.vue'

const navigationStore = useNavigationStore()
const siteStore = useSiteStore()

const sidebarOpen = ref(false)

// 响应式处理
const handleResize = () => {
  if (window.innerWidth >= 1024) {
    sidebarOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>