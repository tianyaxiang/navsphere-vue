<template>
  <div class="relative inline-block" @mouseenter="showTooltip" @mouseleave="hideTooltip">
    <slot />
    
    <Teleport to="body">
      <div
        v-if="visible"
        ref="tooltipRef"
        :class="cn(
          'absolute z-50 px-3 py-1.5 text-sm text-popover-foreground bg-popover border border-border rounded-md shadow-md',
          'animate-in fade-in-0 zoom-in-95',
          className
        )"
        :style="tooltipStyle"
        role="tooltip"
      >
        {{ content }}
        <div
          :class="cn(
            'absolute w-2 h-2 bg-popover border-l border-t border-border transform rotate-45',
            arrowClasses
          )"
        />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { cn } from '@/utils'

interface Props {
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  placement: 'top',
  delay: 500,
})

const visible = ref(false)
const tooltipRef = ref<HTMLElement>()
const tooltipStyle = ref({})

let showTimer: NodeJS.Timeout
let hideTimer: NodeJS.Timeout

const arrowClasses = computed(() => {
  const placements = {
    top: '-bottom-1 left-1/2 transform -translate-x-1/2',
    bottom: '-top-1 left-1/2 transform -translate-x-1/2 rotate-180',
    left: '-right-1 top-1/2 transform -translate-y-1/2 -rotate-90',
    right: '-left-1 top-1/2 transform -translate-y-1/2 rotate-90',
  }
  
  return placements[props.placement]
})

const showTooltip = async (event: MouseEvent) => {
  clearTimeout(hideTimer)
  
  showTimer = setTimeout(async () => {
    visible.value = true
    
    await nextTick()
    
    if (tooltipRef.value) {
      const rect = (event.target as HTMLElement).getBoundingClientRect()
      const tooltipRect = tooltipRef.value.getBoundingClientRect()
      
      let top = 0
      let left = 0
      
      switch (props.placement) {
        case 'top':
          top = rect.top - tooltipRect.height - 8
          left = rect.left + rect.width / 2 - tooltipRect.width / 2
          break
        case 'bottom':
          top = rect.bottom + 8
          left = rect.left + rect.width / 2 - tooltipRect.width / 2
          break
        case 'left':
          top = rect.top + rect.height / 2 - tooltipRect.height / 2
          left = rect.left - tooltipRect.width - 8
          break
        case 'right':
          top = rect.top + rect.height / 2 - tooltipRect.height / 2
          left = rect.right + 8
          break
      }
      
      // 确保 tooltip 不会超出视窗
      const padding = 8
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding))
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding))
      
      tooltipStyle.value = {
        top: `${top}px`,
        left: `${left}px`,
      }
    }
  }, props.delay)
}

const hideTooltip = () => {
  clearTimeout(showTimer)
  
  hideTimer = setTimeout(() => {
    visible.value = false
  }, 100)
}
</script>