<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        数据文件测试
      </h1>

      <!-- 测试控制面板 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          测试控制面板
        </h2>
        <div class="flex flex-wrap gap-4">
          <button
            @click="runAllTests"
            :disabled="testing"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {{ testing ? '测试中...' : '运行所有测试' }}
          </button>
          <button
            @click="testNavigation"
            :disabled="testing"
            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            测试导航数据
          </button>
          <button
            @click="testSiteConfig"
            :disabled="testing"
            class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            测试站点配置
          </button>
          <button
            @click="testResources"
            :disabled="testing"
            class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
          >
            测试资源数据
          </button>
          <button
            @click="clearResults"
            class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            清除结果
          </button>
        </div>
      </div>

      <!-- 测试结果 -->
      <div v-if="testResults.length > 0" class="space-y-6">
        <div
          v-for="(result, index) in testResults"
          :key="index"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ result.title }}
            </h3>
            <span
              :class="[
                'px-3 py-1 rounded-full text-sm font-medium',
                result.success
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              ]"
            >
              {{ result.success ? '✅ 成功' : '❌ 失败' }}
            </span>
          </div>
          
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
            执行时间: {{ result.timestamp }}
          </div>

          <pre
            class="bg-gray-100 dark:bg-gray-900 rounded-md p-4 text-sm overflow-x-auto"
            v-html="result.output"
          ></pre>

          <div v-if="result.data" class="mt-4">
            <h4 class="text-md font-medium text-gray-900 dark:text-white mb-2">
              数据预览:
            </h4>
            <pre
              class="bg-gray-50 dark:bg-gray-700 rounded-md p-4 text-xs overflow-x-auto max-h-64"
            >{{ JSON.stringify(result.data, null, 2) }}</pre>
          </div>
        </div>
      </div>

      <!-- 数据统计 -->
      <div v-if="stats" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-8">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          数据统计
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="text-center">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
              导航数据
            </h3>
            <div class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div>分类: {{ stats.navigation.categories }}</div>
              <div>项目: {{ stats.navigation.items }}</div>
              <div>子分类: {{ stats.navigation.subCategories }}</div>
            </div>
          </div>
          <div class="text-center">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
              站点配置
            </h3>
            <div class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div>基本配置: {{ stats.site.hasBasicConfig ? '✅' : '❌' }}</div>
              <div>外观配置: {{ stats.site.hasAppearanceConfig ? '✅' : '❌' }}</div>
              <div>SEO 配置: {{ stats.site.hasSeoConfig ? '✅' : '❌' }}</div>
              <div>功能配置: {{ stats.site.hasFeaturesConfig ? '✅' : '❌' }}</div>
            </div>
          </div>
          <div class="text-center">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
              资源数据
            </h3>
            <div class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div>分类: {{ stats.resources.sections }}</div>
              <div>项目: {{ stats.resources.items }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { LocalDataService } from '@/services/localData'
import { DataValidator } from '@/utils/dataValidator'

interface TestResult {
  title: string
  success: boolean
  output: string
  timestamp: string
  data?: any
}

const testing = ref(false)
const testResults = ref<TestResult[]>([])
const stats = ref<any>(null)

// 运行所有测试
const runAllTests = async () => {
  testing.value = true
  testResults.value = []

  try {
    // 检查文件存在性
    await addTestResult('文件存在性检查', async () => {
      const existence = await DataValidator.checkFilesExistence()
      const output = [
        `导航数据文件: ${existence.navigation ? '✅ 存在' : '❌ 不存在'}`,
        `站点配置文件: ${existence.site ? '✅ 存在' : '❌ 不存在'}`,
        `资源数据文件: ${existence.resources ? '✅ 存在' : '❌ 不存在'}`,
        `总体状态: ${existence.all ? '✅ 所有文件存在' : '❌ 部分文件缺失'}`
      ].join('\n')
      
      return { success: existence.all, output, data: existence }
    })

    // 验证数据格式
    await addTestResult('数据格式验证', async () => {
      const validation = await DataValidator.validateAllFiles()
      const output = [
        `导航数据验证: ${validation.navigation.valid ? '✅ 通过' : '❌ 失败'}`,
        `站点配置验证: ${validation.site.valid ? '✅ 通过' : '❌ 失败'}`,
        `资源数据验证: ${validation.resources.valid ? '✅ 通过' : '❌ 失败'}`,
        `总体验证: ${validation.overall.valid ? '✅ 通过' : '❌ 失败'}`,
        '',
        '错误详情:',
        ...validation.overall.errors.map(e => `- [${e.field}] ${e.message}`)
      ].join('\n')
      
      return { success: validation.overall.valid, output, data: validation }
    })

    // 测试数据加载
    await addTestResult('数据加载测试', async () => {
      const results = []
      let allSuccess = true

      try {
        const navigationData = await LocalDataService.getNavigationData()
        results.push(`导航数据加载: ✅ 成功 (${navigationData.length} 个分类)`)
      } catch (error) {
        results.push(`导航数据加载: ❌ 失败 - ${error}`)
        allSuccess = false
      }

      try {
        const siteConfig = await LocalDataService.getSiteConfig()
        results.push(`站点配置加载: ✅ 成功 (标题: ${siteConfig.basic.title})`)
      } catch (error) {
        results.push(`站点配置加载: ❌ 失败 - ${error}`)
        allSuccess = false
      }

      try {
        const resourceData = await LocalDataService.getResourceData()
        results.push(`资源数据加载: ✅ 成功 (${resourceData.length} 个分类)`)
      } catch (error) {
        results.push(`资源数据加载: ❌ 失败 - ${error}`)
        allSuccess = false
      }

      return { success: allSuccess, output: results.join('\n') }
    })

    // 获取统计信息
    stats.value = await DataValidator.getDataFileStats()

  } finally {
    testing.value = false
  }
}

// 测试导航数据
const testNavigation = async () => {
  testing.value = true
  await addTestResult('导航数据测试', async () => {
    const validation = await DataValidator.validateNavigationFile('/data/navigation.json')
    const data = await LocalDataService.getNavigationData()
    
    const output = [
      `验证结果: ${validation.valid ? '✅ 通过' : '❌ 失败'}`,
      `数据加载: ✅ 成功`,
      `分类数量: ${data.length}`,
      `总项目数: ${data.reduce((sum, cat) => sum + cat.items.length + (cat.subCategories?.reduce((subSum, sub) => subSum + sub.items.length, 0) || 0), 0)}`,
      '',
      '错误详情:',
      ...validation.errors.map(e => `- [${e.field}] ${e.message}`)
    ].join('\n')
    
    return { success: validation.valid, output, data }
  })
  testing.value = false
}

// 测试站点配置
const testSiteConfig = async () => {
  testing.value = true
  await addTestResult('站点配置测试', async () => {
    const validation = await DataValidator.validateSiteConfigFile('/data/site.json')
    const data = await LocalDataService.getSiteConfig()
    
    const output = [
      `验证结果: ${validation.valid ? '✅ 通过' : '❌ 失败'}`,
      `数据加载: ✅ 成功`,
      `站点标题: ${data.basic.title}`,
      `站点描述: ${data.basic.description}`,
      `主题设置: ${data.appearance.theme}`,
      '',
      '错误详情:',
      ...validation.errors.map(e => `- [${e.field}] ${e.message}`)
    ].join('\n')
    
    return { success: validation.valid, output, data }
  })
  testing.value = false
}

// 测试资源数据
const testResources = async () => {
  testing.value = true
  await addTestResult('资源数据测试', async () => {
    const validation = await DataValidator.validateResourceFile('/data/resources.json')
    const data = await LocalDataService.getResourceData()
    
    const output = [
      `验证结果: ${validation.valid ? '✅ 通过' : '❌ 失败'}`,
      `数据加载: ✅ 成功`,
      `分类数量: ${data.length}`,
      `总项目数: ${data.reduce((sum, section) => sum + section.items.length, 0)}`,
      '',
      '错误详情:',
      ...validation.errors.map(e => `- [${e.field}] ${e.message}`)
    ].join('\n')
    
    return { success: validation.valid, output, data }
  })
  testing.value = false
}

// 添加测试结果
const addTestResult = async (title: string, testFn: () => Promise<{ success: boolean; output: string; data?: any }>) => {
  try {
    const result = await testFn()
    testResults.value.push({
      title,
      success: result.success,
      output: result.output,
      timestamp: new Date().toLocaleString(),
      data: result.data
    })
  } catch (error) {
    testResults.value.push({
      title,
      success: false,
      output: `测试执行失败: ${error}`,
      timestamp: new Date().toLocaleString()
    })
  }
}

// 清除结果
const clearResults = () => {
  testResults.value = []
  stats.value = null
}

// 页面加载时获取统计信息
onMounted(async () => {
  try {
    stats.value = await DataValidator.getDataFileStats()
  } catch (error) {
    console.error('获取统计信息失败:', error)
  }
})
</script>