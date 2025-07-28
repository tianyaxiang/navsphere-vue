<template>
  <Switch
    v-model="enabled"
    :class="cn(
      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
      enabled ? 'bg-primary' : 'bg-muted',
      disabled && 'opacity-50 cursor-not-allowed',
      className
    )"
    :disabled="disabled"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <span class="sr-only">{{ label }}</span>
    <span
      :class="cn(
        'inline-block h-4 w-4 transform rounded-full bg-background transition-transform',
        enabled ? 'translate-x-6' : 'translate-x-1'
      )"
    />
  </Switch>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Switch } from '@headlessui/vue'
import { cn } from '@/utils'

interface Props {
  modelValue?: boolean
  label?: string
  disabled?: boolean
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  disabled: false,
})

defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const enabled = ref(props.modelValue)

watch(() => props.modelValue, (newValue) => {
  enabled.value = newValue
})
</script>