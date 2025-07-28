<template>
  <textarea
    :class="textareaClasses"
    :placeholder="placeholder"
    :disabled="disabled"
    :rows="rows"
    :value="modelValue"
    v-bind="$attrs"
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/utils'

interface Props {
  placeholder?: string
  disabled?: boolean
  rows?: number
  modelValue?: string
  className?: string
  resize?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  rows: 4,
  resize: true,
})

defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaClasses = computed(() => {
  return cn(
    'flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    !props.resize && 'resize-none',
    props.className
  )
})
</script>