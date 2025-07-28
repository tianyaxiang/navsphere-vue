<template>
  <Menu as="div" class="relative inline-block text-left">
    <div>
      <MenuButton class="flex items-center space-x-2 rounded-full p-1 hover:bg-accent transition-colors">
        <img
          :src="authStore.user?.avatar_url"
          :alt="authStore.user?.name || authStore.user?.login"
          class="h-8 w-8 rounded-full"
        />
        <span class="hidden sm:block text-sm font-medium text-foreground">
          {{ authStore.user?.name || authStore.user?.login }}
        </span>
        <ChevronDownIcon class="h-4 w-4 text-muted-foreground" />
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
      <MenuItems class="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-border rounded-md bg-popover shadow-lg ring-1 ring-black/5 focus:outline-none z-50">
        <!-- 用户信息 -->
        <div class="px-4 py-3">
          <UserInfo
            :show-details="true"
            :show-email="true"
            avatar-size="lg"
            text-size="sm"
          />
        </div>

        <!-- 菜单项 -->
        <div class="py-1">
          <MenuItem v-slot="{ active }">
            <a
              :href="authStore.user?.html_url"
              target="_blank"
              rel="noopener noreferrer"
              :class="cn(
                'group flex items-center px-4 py-2 text-sm transition-colors',
                active ? 'bg-accent text-accent-foreground' : 'text-foreground'
              )"
            >
              <GithubIcon class="mr-3 h-4 w-4" />
              查看 GitHub 资料
              <ExternalLinkIcon class="ml-auto h-3 w-3" />
            </a>
          </MenuItem>

          <MenuItem v-slot="{ active }">
            <button
              :class="cn(
                'group flex w-full items-center px-4 py-2 text-sm transition-colors',
                active ? 'bg-accent text-accent-foreground' : 'text-foreground'
              )"
              @click="refreshUserInfo"
              :disabled="authStore.isLoading"
            >
              <RefreshCwIcon :class="cn('mr-3 h-4 w-4', authStore.isLoading && 'animate-spin')" />
              刷新用户信息
            </button>
          </MenuItem>
        </div>

        <!-- 登出 -->
        <div class="py-1">
          <MenuItem v-slot="{ active }">
            <button
              :class="cn(
                'group flex w-full items-center px-4 py-2 text-sm transition-colors text-destructive',
                active ? 'bg-destructive/10' : ''
              )"
              @click="handleLogout"
              :disabled="authStore.isLoading"
            >
              <LogOutIcon class="mr-3 h-4 w-4" />
              登出
            </button>
          </MenuItem>
        </div>
      </MenuItems>
    </transition>
  </Menu>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import {
  ChevronDownIcon,
  GithubIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
  LogOutIcon,
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import UserInfo from '@/components/UserInfo.vue'
import { cn } from '@/utils'

const router = useRouter()
const authStore = useAuthStore()

const refreshUserInfo = async () => {
  try {
    await authStore.refreshUserInfo()
  } catch (error) {
    // 错误已在 store 中处理
  }
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/')
}
</script>