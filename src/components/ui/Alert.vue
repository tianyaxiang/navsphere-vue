<template>
  <div :class="alertClasses" role="alert">
    <div class="flex">
      <div class="flex-shrink-0">
        <CheckCircleIcon
          v-if="variant === 'success'"
          class="h-5 w-5"
          aria-hidden="true"
        />
        <XCircleIcon
          v-else-if="variant === 'destructive'"
          class="h-5 w-5"
          aria-hidden="true"
        />
        <AlertTriangleIcon
          v-else-if="variant === 'warning'"
          class="h-5 w-5"
          aria-hidden="true"
        />
        <InfoIcon
          v-else
          class="h-5 w-5"
          aria-hidden="true"
        />
      </div>
      <div class="ml-3 flex-1">
        <h3 v-if="title" class="text-sm font-medium">
          {{ title }}
        </h3>
        <div :class="cn('text-sm', title && 'mt-2')">
          <slot>
            <p v-if="description">{{ description }}</p>
          </slot>
        </div>
      </div>
      <div v-if="closable" class="ml-auto pl-3">
        <div class="-mx-1.5 -my-1.5">
          <button
            type="button"
            class="inline-flex rounded-md p-1.5 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            @click="$emit('close')"
          >
            <span class="sr-only">关闭</span>
            <XIcon class="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  InfoIcon,
  XIcon,
} from 'lucide-vue-next'
import { cn } from '@/utils'

interface Props {
  variant?: 'default' | 'destructive' | 'success' | 'warning'
  title?: string
  description?: string
  closable?: boolean
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  closable: false,
})

defineEmits<{
  close: []
}>()

const alertClasses = computed(() => {
  const baseClasses = 'relative w-full rounded-lg border p-4'
  
  const variantClasses = {
    default: 'bg-background text-foreground border-border',
    destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
    success: 'border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-600 dark:[&>svg]:text-green-400',
    warning: 'border-yellow-500/50 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400',
  }
  
  return cn(
    baseClasses,
    variantClasses[props.variant],
    props.className
  )
})
</script>

<script lang="ts">
// Alert sub-components
export const Title = {
  name: 'AlertTitle',
  template: `
    <h5 class="mb-1 font-medium leading-none tracking-tight">
      <slot />
    </h5>
  `
}

export const Description = {
  name: 'AlertDescription',
  template: `
    <div class="text-sm [&_p]:leading-relaxed">
      <slot />
    </div>
  `
}
</script>