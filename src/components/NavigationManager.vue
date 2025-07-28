<template>
  <div class="space-y-6">
    <!-- 页面标题和操作按钮 -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-bold text-foreground">导航管理</h2>
        <p class="text-muted-foreground mt-1">
          管理导航分类和网站项目
        </p>
      </div>
      <div class="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          @click="refreshData"
          :disabled="navigationStore.loading"
        >
          <RefreshCwIcon :class="cn('h-4 w-4 mr-2', navigationStore.loading && 'animate-spin')" />
          刷新
        </Button>
        <Button
          @click="openCategoryDialog()"
          size="sm"
        >
          <PlusIcon class="h-4 w-4 mr-2" />
          添加分类
        </Button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="grid gap-4 md:grid-cols-4">
      <Card class="p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">总分类</p>
            <p class="text-2xl font-bold">{{ navigationStore.totalCategories }}</p>
          </div>
          <FolderIcon class="h-8 w-8 text-blue-500" />
        </div>
      </Card>
      <Card class="p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">总项目</p>
            <p class="text-2xl font-bold">{{ navigationStore.totalItems }}</p>
          </div>
          <LinkIcon class="h-8 w-8 text-green-500" />
        </div>
      </Card>
      <Card class="p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">启用项目</p>
            <p class="text-2xl font-bold">{{ navigationStore.enabledItems }}</p>
          </div>
          <CheckCircleIcon class="h-8 w-8 text-emerald-500" />
        </div>
      </Card>
      <Card class="p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">禁用项目</p>
            <p class="text-2xl font-bold">{{ navigationStore.totalItems - navigationStore.enabledItems }}</p>
          </div>
          <XCircleIcon class="h-8 w-8 text-red-500" />
        </div>
      </Card>
    </div>

    <!-- 分类列表 -->
    <div class="space-y-4">
      <div
        v-for="category in navigationStore.categories"
        :key="category.id"
        class="border rounded-lg p-4 space-y-4"
      >
        <!-- 分类头部 -->
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="text-2xl">{{ category.icon || '📁' }}</div>
            <div>
              <h3 class="text-lg font-semibold">{{ category.title }}</h3>
              <p class="text-sm text-muted-foreground">
                {{ category.description || '暂无描述' }}
              </p>
            </div>
            <Badge :variant="category.enabled ? 'default' : 'secondary'">
              {{ category.enabled ? '启用' : '禁用' }}
            </Badge>
          </div>
          <div class="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              @click="toggleCategoryEnabled(category.id)"
              :disabled="navigationStore.loading"
            >
              {{ category.enabled ? '禁用' : '启用' }}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              @click="openItemDialog(category.id)"
            >
              <PlusIcon class="h-4 w-4 mr-1" />
              添加项目
            </Button>
            <Button
              variant="ghost"
              size="sm"
              @click="openCategoryDialog(category)"
            >
              <EditIcon class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              @click="deleteCategoryConfirm(category)"
            >
              <TrashIcon class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <!-- 项目列表 -->
        <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="item in category.items"
            :key="item.id"
            class="border rounded-md p-3 hover:bg-muted/50 transition-colors"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-start space-x-2 flex-1 min-w-0">
                <img
                  :src="item.icon"
                  :alt="item.title"
                  class="w-5 h-5 rounded flex-shrink-0 mt-0.5"
                  @error="handleIconError"
                />
                <div class="flex-1 min-w-0">
                  <h4 class="font-medium text-sm truncate">{{ item.title }}</h4>
                  <p class="text-xs text-muted-foreground line-clamp-2">
                    {{ item.description }}
                  </p>
                  <a
                    :href="item.href"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-xs text-blue-500 hover:underline truncate block"
                  >
                    {{ item.href }}
                  </a>
                </div>
              </div>
              <div class="flex items-center space-x-1 ml-2">
                <Badge
                  :variant="item.enabled ? 'default' : 'secondary'"
                  class="text-xs"
                >
                  {{ item.enabled ? '启用' : '禁用' }}
                </Badge>
                <Menu>
                  <template #trigger>
                    <Button variant="ghost" size="sm" class="h-6 w-6 p-0">
                      <MoreVerticalIcon class="h-3 w-3" />
                    </Button>
                  </template>
                  <MenuItem @click="toggleItemEnabled(category.id, item.id)">
                    {{ item.enabled ? '禁用' : '启用' }}
                  </MenuItem>
                  <MenuItem @click="openItemDialog(category.id, item)">
                    编辑
                  </MenuItem>
                  <MenuItem @click="deleteItemConfirm(category.id, item)">
                    删除
                  </MenuItem>
                </Menu>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div
          v-if="category.items.length === 0"
          class="text-center py-8 text-muted-foreground"
        >
          <LinkIcon class="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>该分类下暂无项目</p>
          <Button
            variant="ghost"
            size="sm"
            @click="openItemDialog(category.id)"
            class="mt-2"
          >
            添加第一个项目
          </Button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div
      v-if="navigationStore.categories.length === 0 && !navigationStore.loading"
      class="text-center py-12 text-muted-foreground"
    >
      <FolderIcon class="h-12 w-12 mx-auto mb-4 opacity-50" />
      <h3 class="text-lg font-medium mb-2">暂无导航分类</h3>
      <p class="mb-4">开始创建您的第一个导航分类</p>
      <Button @click="openCategoryDialog()">
        <PlusIcon class="h-4 w-4 mr-2" />
        创建分类
      </Button>
    </div>

    <!-- 加载状态 -->
    <LoadingState v-if="navigationStore.loading" />

    <!-- 分类编辑对话框 -->
    <CategoryDialog
      :open="categoryDialogOpen"
      :category="editingCategory"
      @close="closeCategoryDialog"
      @save="handleCategorySave"
    />

    <!-- 项目编辑对话框 -->
    <ItemDialog
      :open="itemDialogOpen"
      :category-id="editingCategoryId"
      :item="editingItem"
      @close="closeItemDialog"
      @save="handleItemSave"
    />

    <!-- 删除确认对话框 -->
    <Dialog
      :open="deleteDialogOpen"
      :title="deleteDialogTitle"
      :confirm-text="'删除'"
      :confirm-variant="'destructive'"
      @close="closeDeleteDialog"
      @confirm="handleDelete"
    >
      <p>{{ deleteDialogMessage }}</p>
      <p class="text-sm text-muted-foreground mt-2">
        此操作不可撤销，请谨慎操作。
      </p>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  PlusIcon,
  RefreshCwIcon,
  FolderIcon,
  LinkIcon,
  CheckCircleIcon,
  XCircleIcon,
  EditIcon,
  TrashIcon,
  MoreVerticalIcon,
} from 'lucide-vue-next'
import {
  Button,
  Card,
  Badge,
  Menu,
  MenuItem,
  Dialog,
  LoadingState,
} from '@/components/ui'
import CategoryDialog from './NavigationManager/CategoryDialog.vue'
import ItemDialog from './NavigationManager/ItemDialog.vue'
import { useNavigationStore } from '@/stores'
import { notification } from '@/composables/useNotification'
import { cn } from '@/utils'
import type { NavigationCategory, NavigationSubItem } from '@/types'

const navigationStore = useNavigationStore()

// 对话框状态
const categoryDialogOpen = ref(false)
const itemDialogOpen = ref(false)
const deleteDialogOpen = ref(false)

// 编辑状态
const editingCategory = ref<NavigationCategory | null>(null)
const editingCategoryId = ref<string>('')
const editingItem = ref<NavigationSubItem | null>(null)

// 删除状态
const deleteDialogTitle = ref('')
const deleteDialogMessage = ref('')
const deleteAction = ref<(() => Promise<void>) | null>(null)

// 方法
const refreshData = async () => {
  await navigationStore.refreshData()
}

const openCategoryDialog = (category?: NavigationCategory) => {
  editingCategory.value = category || null
  categoryDialogOpen.value = true
}

const closeCategoryDialog = () => {
  categoryDialogOpen.value = false
  editingCategory.value = null
}

const openItemDialog = (categoryId: string, item?: NavigationSubItem) => {
  editingCategoryId.value = categoryId
  editingItem.value = item || null
  itemDialogOpen.value = true
}

const closeItemDialog = () => {
  itemDialogOpen.value = false
  editingCategoryId.value = ''
  editingItem.value = null
}

const handleCategorySave = async (categoryData: Partial<NavigationCategory>) => {
  try {
    if (editingCategory.value) {
      // 更新分类
      await navigationStore.updateCategory(editingCategory.value.id, categoryData)
      notification.success('更新成功', '分类已更新')
    } else {
      // 添加分类
      const newCategory: NavigationCategory = {
        id: `category_${Date.now()}`,
        title: categoryData.title!,
        description: categoryData.description,
        icon: categoryData.icon,
        items: [],
        enabled: categoryData.enabled ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await navigationStore.addCategory(newCategory)
      notification.success('添加成功', '分类已添加')
    }
    closeCategoryDialog()
  } catch (error: any) {
    notification.error('操作失败', error.message)
  }
}

const handleItemSave = async (itemData: Partial<NavigationSubItem>) => {
  try {
    if (editingItem.value) {
      // 更新项目
      await navigationStore.updateItem(
        editingCategoryId.value,
        editingItem.value.id,
        itemData
      )
      notification.success('更新成功', '项目已更新')
    } else {
      // 添加项目
      const newItem: NavigationSubItem = {
        id: `item_${Date.now()}`,
        title: itemData.title!,
        description: itemData.description!,
        icon: itemData.icon!,
        href: itemData.href!,
        enabled: itemData.enabled ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await navigationStore.addItem(editingCategoryId.value, newItem)
      notification.success('添加成功', '项目已添加')
    }
    closeItemDialog()
  } catch (error: any) {
    notification.error('操作失败', error.message)
  }
}

const toggleCategoryEnabled = async (categoryId: string) => {
  try {
    await navigationStore.toggleCategoryEnabled(categoryId)
    notification.success('操作成功', '分类状态已更新')
  } catch (error: any) {
    notification.error('操作失败', error.message)
  }
}

const toggleItemEnabled = async (categoryId: string, itemId: string) => {
  try {
    await navigationStore.toggleItemEnabled(categoryId, itemId)
    notification.success('操作成功', '项目状态已更新')
  } catch (error: any) {
    notification.error('操作失败', error.message)
  }
}

const deleteCategoryConfirm = (category: NavigationCategory) => {
  deleteDialogTitle.value = '删除分类'
  deleteDialogMessage.value = `确定要删除分类"${category.title}"吗？这将同时删除该分类下的所有项目。`
  deleteAction.value = () => navigationStore.deleteCategory(category.id)
  deleteDialogOpen.value = true
}

const deleteItemConfirm = (categoryId: string, item: NavigationSubItem) => {
  deleteDialogTitle.value = '删除项目'
  deleteDialogMessage.value = `确定要删除项目"${item.title}"吗？`
  deleteAction.value = () => navigationStore.deleteItem(categoryId, item.id)
  deleteDialogOpen.value = true
}

const closeDeleteDialog = () => {
  deleteDialogOpen.value = false
  deleteDialogTitle.value = ''
  deleteDialogMessage.value = ''
  deleteAction.value = null
}

const handleDelete = async () => {
  if (deleteAction.value) {
    try {
      await deleteAction.value()
      notification.success('删除成功', '项目已删除')
      closeDeleteDialog()
    } catch (error: any) {
      notification.error('删除失败', error.message)
    }
  }
}

const handleIconError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/favicon.ico' // 使用默认图标
}

onMounted(async () => {
  if (navigationStore.categories.length === 0) {
    await navigationStore.loadNavigationData()
  }
})
</script>