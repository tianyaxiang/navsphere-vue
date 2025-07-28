<template>
  <MenuItem v-slot="{ active, disabled }">
    <button
      :class="cn(
        'group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors',
        active ? 'bg-accent text-accent-foreground' : 'text-foreground',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )"
      :disabled="disabled"
      @click="$emit('click')"
    >
      <component
        v-if="icon"
        :is="icon"
        class="mr-2 h-4 w-4"
        aria-hidden="true"
      />
      <slot />
      <kbd
        v-if="shortcut"
        class="ml-auto text-xs tracking-widest text-muted-foreground"
      >
        {{ shortcut }}
      </kbd>
    </button>
  </MenuItem>
</template>

<script setup lang="ts">
import { MenuItem } from '@headlessui/vue'
import { cn } from '@/utils'
import type { Component } from 'vue'

interface Props {
  icon?: Component
  shortcut?: string
  disabled?: boolean
  className?: string
}

defineProps<Props>()

defineEmits<{
  click: []
}>()
</script>