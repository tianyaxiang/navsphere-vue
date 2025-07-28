<template>
  <div :class="cardClasses">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/utils'

interface Props {
  hover?: boolean
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  hover: false,
})

const cardClasses = computed(() => {
  return cn(
    'rounded-lg border bg-card text-card-foreground shadow-sm',
    props.hover && 'hover:shadow-md transition-shadow cursor-pointer',
    props.className
  )
})
</script>

<script lang="ts">
// Card sub-components
export const Header = {
  name: 'CardHeader',
  template: `
    <div class="flex flex-col space-y-1.5 p-6">
      <slot />
    </div>
  `
}

export const Title = {
  name: 'CardTitle',
  template: `
    <h3 class="text-2xl font-semibold leading-none tracking-tight">
      <slot />
    </h3>
  `
}

export const Description = {
  name: 'CardDescription',
  template: `
    <p class="text-sm text-muted-foreground">
      <slot />
    </p>
  `
}

export const Content = {
  name: 'CardContent',
  template: `
    <div class="p-6 pt-0">
      <slot />
    </div>
  `
}

export const Footer = {
  name: 'CardFooter',
  template: `
    <div class="flex items-center p-6 pt-0">
      <slot />
    </div>
  `
}
</script>