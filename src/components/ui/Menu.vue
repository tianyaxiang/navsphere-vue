<template>
  <Menu as="div" class="relative inline-block text-left">
    <div>
      <MenuButton :class="buttonClass">
        <slot name="trigger">
          <Button :variant="buttonVariant" :size="buttonSize">
            {{ buttonText }}
            <ChevronDownIcon class="ml-2 -mr-1 h-4 w-4" aria-hidden="true" />
          </Button>
        </slot>
      </MenuButton>
    </div>

    <transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <MenuItems
        :class="cn(
          'absolute right-0 mt-2 w-56 origin-top-right divide-y divide-border rounded-md bg-popover shadow-lg ring-1 ring-black/5 focus:outline-none z-50',
          menuClass
        )"
      >
        <div class="px-1 py-1">
          <slot />
        </div>
      </MenuItems>
    </transition>
  </Menu>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItems } from '@headlessui/vue'
import { ChevronDownIcon } from 'lucide-vue-next'
import Button from './Button.vue'
import { cn } from '@/utils'

interface Props {
  buttonText?: string
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon'
  buttonClass?: string
  menuClass?: string
}

withDefaults(defineProps<Props>(), {
  buttonText: '选项',
  buttonVariant: 'outline',
  buttonSize: 'default',
})
</script>