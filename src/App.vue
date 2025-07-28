<template>
  <div 
    id="app" 
    :class="getThemeClasses('min-h-screen bg-background text-foreground transition-colors duration-300')"
    :style="getThemeStyles()"
  >
    <GlobalErrorBoundary>
      <RouterView />
      <NotificationContainer />
      <NetworkStatus 
        :show-details="false"
        :auto-hide="true"
        class="fixed bottom-4 right-4 z-40"
      />
    </GlobalErrorBoundary>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useAppStore } from '@/stores'
import { useTheme } from '@/composables/useTheme'
import NotificationContainer from '@/components/NotificationContainer.vue'
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary.vue'
import { NetworkStatus } from '@/components/ui'

const appStore = useAppStore()
const { getThemeClasses, getThemeStyles, onThemeChange } = useTheme()

// 主题变化监听
const unwatchTheme = onThemeChange((theme, currentTheme) => {
  // 更新页面标题以反映当前主题
  const titleSuffix = currentTheme === 'dark' ? ' (深色)' : ' (浅色)'
  if (document.title && !document.title.includes('(')) {
    document.title += titleSuffix
  }
  
  // 触发自定义事件供其他组件监听
  window.dispatchEvent(new CustomEvent('app-theme-changed', {
    detail: { theme, currentTheme }
  }))
})

onMounted(async () => {
  await appStore.initializeApp()
})

onUnmounted(() => {
  unwatchTheme()
})
</script>