<template>
  <TransitionRoot appear :show="open" as="template">
    <Dialog as="div" @close="$emit('close')" class="relative z-50">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/25 backdrop-blur-sm" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel
              :class="cn(
                'w-full max-w-md transform overflow-hidden rounded-2xl bg-card p-6 text-left align-middle shadow-xl transition-all',
                className
              )"
            >
              <DialogTitle
                v-if="title"
                as="h3"
                class="text-lg font-medium leading-6 text-foreground mb-4"
              >
                {{ title }}
              </DialogTitle>
              
              <div class="mt-2">
                <slot />
              </div>

              <div v-if="showActions" class="mt-6 flex justify-end space-x-3">
                <Button
                  v-if="showCancel"
                  variant="outline"
                  @click="$emit('cancel')"
                >
                  {{ cancelText }}
                </Button>
                <Button
                  v-if="showConfirm"
                  :variant="confirmVariant"
                  @click="$emit('confirm')"
                  :disabled="confirmDisabled"
                >
                  {{ confirmText }}
                </Button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import Button from './Button.vue'
import { cn } from '@/utils'

interface Props {
  open: boolean
  title?: string
  className?: string
  showActions?: boolean
  showCancel?: boolean
  showConfirm?: boolean
  cancelText?: string
  confirmText?: string
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  confirmDisabled?: boolean
}

withDefaults(defineProps<Props>(), {
  showActions: true,
  showCancel: true,
  showConfirm: true,
  cancelText: '取消',
  confirmText: '确定',
  confirmVariant: 'default',
  confirmDisabled: false,
})

defineEmits<{
  close: []
  cancel: []
  confirm: []
}>()
</script>