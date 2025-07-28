<template>
  <Teleport to="body">
    <div
      class="fixed top-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full"
      aria-live="polite"
      aria-label="通知"
    >
      <Toast
        v-for="notification in notifications"
        :key="notification.id"
        :show="notification.show"
        :type="notification.type"
        :title="notification.title"
        :message="notification.message"
        @close="removeNotification(notification.id)"
      />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { notification } from '@/composables/useNotification'
import Toast from './ui/Toast.vue'

const { notifications, removeNotification } = notification
</script>