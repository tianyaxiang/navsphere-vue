<template>
  <div :class="containerClasses">
    <div :class="spinnerClasses">
      <div class="animate-spin rounded-full border-2 border-current border-t-transparent" />
    </div>
    <span v-if="text" :class="textClasses">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/utils'

interface Props {
  size?: 'sm' | 'default' | 'lg'
  text?: string
  centered?: boolean
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'default',
  centered: false,
})

const containerClasses = computed(() => {
  return cn(
    'flex items-center gap-2',
    props.centered && 'justify-center',
    props.className
  )
})

const spinnerClasses = computed(() => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
  }
  
  return cn(
    'text-primary',
    sizeClasses[props.size]
  )
})

const textClasses = computed(() => {
  const sizeClasses = {
    sm: 'text-sm',
    default: 'text-base',
    lg: 'text-lg',
  }
  
  return cn(
    'text-muted-foreground',
    sizeClasses[props.size]
  )
})
</script>