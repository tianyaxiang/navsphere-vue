#!/usr/bin/env node

/**
 * 简单的数据验证脚本
 * 用于验证数据文件的基本格式
 */

const fs = require('fs')
const path = require('path')

// 验证 JSON 文件
function validateJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const data = JSON.parse(content)
    return { valid: true, data, error: null }
  } catch (error) {
    return { valid: false, data: null, error: error.message }
  }
}

// 验证导航数据
function validateNavigationData(data) {
  const errors = []
  
  if (!Array.isArray(data)) {
    errors.push('导航数据应为数组格式')
    return { valid: false, errors }
  }

  data.forEach((category, index) => {
    if (!category.id) {
      errors.push(`分类 ${index + 1} 缺少 id 字段`)
    }
    if (!category.title) {
      errors.push(`分类 ${index + 1} 缺少 title 字段`)
    }
    if (!Array.isArray(category.items)) {
      errors.push(`分类 ${index + 1} 的 items 字段应为数组`)
    } else {
      category.items.forEach((item, itemIndex) => {
        if (!item.id) {
          errors.push(`分类 ${index + 1} 的项目 ${itemIndex + 1} 缺少 id 字段`)
        }
        if (!item.title) {
          errors.push(`分类 ${index + 1} 的项目 ${itemIndex + 1} 缺少 title 字段`)
        }
        if (!item.href) {
          errors.push(`分类 ${index + 1} 的项目 ${itemIndex + 1} 缺少 href 字段`)
        }
      })
    }
  })

  return { valid: errors.length === 0, errors }
}

// 验证站点配置
function validateSiteConfig(data) {
  const errors = []
  
  if (!data.basic) {
    errors.push('缺少 basic 配置')
  } else {
    if (!data.basic.title) {
      errors.push('缺少站点标题')
    }
    if (!data.basic.description) {
      errors.push('缺少站点描述')
    }
  }

  if (!data.appearance) {
    errors.push('缺少 appearance 配置')
  } else {
    if (!['light', 'dark', 'system'].includes(data.appearance.theme)) {
      errors.push('主题设置不正确')
    }
  }

  return { valid: errors.length === 0, errors }
}

// 验证资源数据
function validateResourceData(data) {
  const errors = []
  
  if (!Array.isArray(data)) {
    errors.push('资源数据应为数组格式')
    return { valid: false, errors }
  }

  data.forEach((section, index) => {
    if (!section.id) {
      errors.push(`资源分类 ${index + 1} 缺少 id 字段`)
    }
    if (!section.title) {
      errors.push(`资源分类 ${index + 1} 缺少 title 字段`)
    }
    if (!Array.isArray(section.items)) {
      errors.push(`资源分类 ${index + 1} 的 items 字段应为数组`)
    }
  })

  return { valid: errors.length === 0, errors }
}

// 主验证函数
function validateAllFiles() {
  console.log('🚀 开始验证数据文件...\n')

  const files = [
    {
      name: '导航数据',
      path: path.join(__dirname, 'data', 'navigation.json'),
      validator: validateNavigationData
    },
    {
      name: '站点配置',
      path: path.join(__dirname, 'data', 'site.json'),
      validator: validateSiteConfig
    },
    {
      name: '资源数据',
      path: path.join(__dirname, 'data', 'resources.json'),
      validator: validateResourceData
    }
  ]

  let allValid = true

  files.forEach(file => {
    console.log(`📁 验证 ${file.name}...`)
    
    // 检查文件是否存在
    if (!fs.existsSync(file.path)) {
      console.log(`❌ 文件不存在: ${file.path}`)
      allValid = false
      return
    }

    // 验证 JSON 格式
    const jsonResult = validateJsonFile(file.path)
    if (!jsonResult.valid) {
      console.log(`❌ JSON 格式错误: ${jsonResult.error}`)
      allValid = false
      return
    }

    // 验证数据结构
    const dataResult = file.validator(jsonResult.data)
    if (!dataResult.valid) {
      console.log(`❌ 数据验证失败:`)
      dataResult.errors.forEach(error => {
        console.log(`   - ${error}`)
      })
      allValid = false
    } else {
      console.log(`✅ 验证通过`)
    }
    
    console.log('')
  })

  if (allValid) {
    console.log('🎉 所有数据文件验证通过!')
  } else {
    console.log('❌ 部分数据文件验证失败，请检查上述错误')
    process.exit(1)
  }
}

// 运行验证
validateAllFiles()