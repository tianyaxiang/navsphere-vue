<template>
  <div :class="containerClasses">
    <div v-if="type === 'spinner'" class="flex flex-col items-center space-y-4">
      <LoadingSpinner :size="size" />
      <p v-if="message" class="text-muted-foreground">{{ message }}</p>
    </div>
    
    <div v-else-if="type === 'skeleton'" class="space-y-4">
      <div v-for="i in skeletonLines" :key="i" class="animate-pulse">
        <div class="h-4 bg-muted rounded" :style="{ width: getSkeletonWidth(i) }" />
      </div>
    </div>
    
    <div v-else-if="type === 'dots'" class="flex items-center space-x-1">
      <div
        v-for="i in 3"
        :key="i"
        class="w-2 h-2 bg-primary rounded-full animate-bounce"
        :style="{ animationDelay: `${(i - 1) * 0.1}s` }"
      />
      <span v-if="message" class="ml-3 text-muted-foreground">{{ message }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/utils'
import LoadingSpinner from './LoadingSpinner.vue'

interface Props {
  type?: 'spinner' | 'skeleton' | 'dots'
  size?: 'sm' | 'default' | 'lg'
  message?: string
  skeletonLines?: number
  centered?: boolean
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'spinner',
  size: 'default',
  skeletonLines: 3,
  centered: true,
})

const containerClasses = computed(() => {
  return cn(
    'w-full',
    props.centered && 'flex items-center justify-center min-h-[200px]',
    props.className
  )
})

const getSkeletonWidth = (index: number): string => {
  const widths = ['100%', '80%', '60%', '90%', '70%']
  return widths[(index - 1) % widths.length]
}
</script>