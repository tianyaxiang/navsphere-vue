<template>
  <div
    :class="cn(
      'shrink-0 bg-border',
      orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
      className
    )"
    :role="decorative ? 'none' : 'separator'"
    :aria-orientation="decorative ? undefined : orientation"
  />
</template>

<script setup lang="ts">
import { cn } from '@/utils'

interface Props {
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
  className?: string
}

withDefaults(defineProps<Props>(), {
  orientation: 'horizontal',
  decorative: true,
})
</script>