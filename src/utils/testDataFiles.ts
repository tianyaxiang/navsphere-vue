/**
 * 数据文件测试工具
 * 用于验证数据文件的格式和完整性
 */

import { LocalDataService } from '@/services/localData'
import { DataValidator } from './dataValidator'

/**
 * 测试所有数据文件
 */
export async function testAllDataFiles(): Promise<void> {
  console.log('🚀 开始测试数据文件...')
  console.log('')

  try {
    // 1. 检查文件存在性
    console.log('📁 检查文件存在性...')
    const existence = await DataValidator.checkFilesExistence()
    console.log('导航数据文件:', existence.navigation ? '✅ 存在' : '❌ 不存在')
    console.log('站点配置文件:', existence.site ? '✅ 存在' : '❌ 不存在')
    console.log('资源数据文件:', existence.resources ? '✅ 存在' : '❌ 不存在')
    console.log('')

    if (!existence.all) {
      console.log('❌ 部分数据文件不存在，请检查 /data 目录')
      return
    }

    // 2. 验证数据格式
    console.log('🔍 验证数据格式...')
    const validation = await DataValidator.validateAllFiles()
    
    console.log('导航数据验证:', validation.navigation.valid ? '✅ 通过' : '❌ 失败')
    if (!validation.navigation.valid) {
      validation.navigation.errors.forEach(error => {
        console.log(`  - [${error.field}] ${error.message}`)
      })
    }

    console.log('站点配置验证:', validation.site.valid ? '✅ 通过' : '❌ 失败')
    if (!validation.site.valid) {
      validation.site.errors.forEach(error => {
        console.log(`  - [${error.field}] ${error.message}`)
      })
    }

    console.log('资源数据验证:', validation.resources.valid ? '✅ 通过' : '❌ 失败')
    if (!validation.resources.valid) {
      validation.resources.errors.forEach(error => {
        console.log(`  - [${error.field}] ${error.message}`)
      })
    }

    console.log('总体验证:', validation.overall.valid ? '✅ 通过' : '❌ 失败')
    console.log('')

    // 3. 测试数据加载
    console.log('📊 测试数据加载...')
    try {
      const navigationData = await LocalDataService.getNavigationData()
      console.log(`导航数据加载: ✅ 成功 (${navigationData.length} 个分类)`)

      const siteConfig = await LocalDataService.getSiteConfig()
      console.log(`站点配置加载: ✅ 成功 (标题: ${siteConfig.basic.title})`)

      const resourceData = await LocalDataService.getResourceData()
      console.log(`资源数据加载: ✅ 成功 (${resourceData.length} 个分类)`)
    } catch (error) {
      console.log('❌ 数据加载失败:', error)
    }
    console.log('')

    // 4. 获取统计信息
    console.log('📈 数据统计信息...')
    const stats = await DataValidator.getDataFileStats()
    console.log('导航数据:')
    console.log(`  - 分类数量: ${stats.navigation.categories}`)
    console.log(`  - 项目数量: ${stats.navigation.items}`)
    console.log(`  - 子分类数量: ${stats.navigation.subCategories}`)
    
    console.log('站点配置:')
    console.log(`  - 基本配置: ${stats.site.hasBasicConfig ? '✅' : '❌'}`)
    console.log(`  - 外观配置: ${stats.site.hasAppearanceConfig ? '✅' : '❌'}`)
    console.log(`  - SEO 配置: ${stats.site.hasSeoConfig ? '✅' : '❌'}`)
    console.log(`  - 功能配置: ${stats.site.hasFeaturesConfig ? '✅' : '❌'}`)
    
    console.log('资源数据:')
    console.log(`  - 分类数量: ${stats.resources.sections}`)
    console.log(`  - 项目数量: ${stats.resources.items}`)
    console.log('')

    // 5. 生成验证报告
    if (!validation.overall.valid) {
      console.log('📋 验证报告:')
      const report = DataValidator.generateValidationReport(validation)
      console.log(report)
    }

    console.log('✅ 数据文件测试完成!')
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
  }
}

/**
 * 测试单个数据文件
 */
export async function testSingleDataFile(type: 'navigation' | 'site' | 'resources'): Promise<void> {
  console.log(`🔍 测试 ${type} 数据文件...`)

  try {
    let validation
    let filePath

    switch (type) {
      case 'navigation':
        filePath = '/data/navigation.json'
        validation = await DataValidator.validateNavigationFile(filePath)
        break
      case 'site':
        filePath = '/data/site.json'
        validation = await DataValidator.validateSiteConfigFile(filePath)
        break
      case 'resources':
        filePath = '/data/resources.json'
        validation = await DataValidator.validateResourceFile(filePath)
        break
    }

    console.log(`文件路径: ${filePath}`)
    console.log(`验证结果: ${validation.valid ? '✅ 通过' : '❌ 失败'}`)

    if (!validation.valid) {
      console.log('错误详情:')
      validation.errors.forEach((error, index) => {
        console.log(`${index + 1}. [${error.field}] ${error.message} (${error.code || 'UNKNOWN'})`)
      })
    }
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 如果直接运行此文件，执行测试
if (typeof window !== 'undefined' && (window as any).__TEST_DATA_FILES__) {
  testAllDataFiles()
}