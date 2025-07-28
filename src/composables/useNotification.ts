/**
 * 通知系统组合式函数
 */

import { ref, readonly } from 'vue'
import type { NotificationOptions } from '@/types'
import { generateId } from '@/utils'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration: number
  closable: boolean
  show: boolean
  timer?: NodeJS.Timeout
}

const notifications = ref<Notification[]>([])

export function useNotification() {
  const addNotification = (
    type: Notification['type'],
    title: string,
    message?: string,
    options: NotificationOptions = {}
  ) => {
    const notification: Notification = {
      id: generateId(),
      type,
      title,
      message,
      duration: options.duration ?? 4000,
      closable: options.closable ?? true,
      show: true,
    }

    notifications.value.push(notification)

    // 自动关闭
    if (notification.duration > 0) {
      notification.timer = setTimeout(() => {
        removeNotification(notification.id)
      }, notification.duration)
    }

    return notification.id
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      const notification = notifications.value[index]
      if (notification.timer) {
        clearTimeout(notification.timer)
      }
      notifications.value.splice(index, 1)
    }
  }

  const clearAll = () => {
    notifications.value.forEach(notification => {
      if (notification.timer) {
        clearTimeout(notification.timer)
      }
    })
    notifications.value = []
  }

  const success = (title: string, message?: string, options?: NotificationOptions) => {
    return addNotification('success', title, message, options)
  }

  const error = (title: string, message?: string, options?: NotificationOptions) => {
    return addNotification('error', title, message, options)
  }

  const warning = (title: string, message?: string, options?: NotificationOptions) => {
    return addNotification('warning', title, message, options)
  }

  const info = (title: string, message?: string, options?: NotificationOptions) => {
    return addNotification('info', title, message, options)
  }

  return {
    notifications: readonly(notifications),
    success,
    error,
    warning,
    info,
    removeNotification,
    clearAll,
  }
}

// 全局通知实例
export const notification = useNotification()