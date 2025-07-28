# 数据文件说明

本目录包含 NavSphere Vue 应用的数据文件，用于配置导航内容、站点设置和资源信息。

## 文件结构

```
data/
├── navigation.json    # 导航数据
├── site.json         # 站点配置
├── resources.json    # 资源数据
└── README.md         # 本说明文件
```

## 文件说明

### navigation.json - 导航数据

包含所有导航分类和网站项目的数据。

**结构说明：**
- `id`: 唯一标识符
- `title`: 中文标题
- `titleEn`: 英文标题（可选）
- `icon`: 图标（emoji 或 URL）
- `description`: 中文描述
- `descriptionEn`: 英文描述（可选）
- `enabled`: 是否启用
- `order`: 排序顺序
- `items`: 包含的网站项目数组
- `subCategories`: 子分类数组（可选）

**网站项目结构：**
- `id`: 唯一标识符
- `title`: 网站标题
- `description`: 网站描述
- `icon`: 网站图标 URL
- `href`: 网站链接
- `enabled`: 是否启用
- `tags`: 标签数组（可选）
- `category`: 所属分类

### site.json - 站点配置

包含站点的基本信息、外观设置、SEO 配置和功能开关。

**配置项说明：**

#### basic - 基本配置
- `title`: 站点标题
- `description`: 站点描述
- `keywords`: 关键词
- `author`: 作者
- `email`: 联系邮箱
- `url`: 站点 URL

#### appearance - 外观配置
- `logo`: Logo 图片路径
- `favicon`: 网站图标路径
- `theme`: 主题设置（light/dark/system）
- `primaryColor`: 主色调
- `accentColor`: 强调色
- `fontFamily`: 字体设置

#### seo - SEO 配置
- `enableSeo`: 是否启用 SEO
- `ogImage`: Open Graph 图片
- `twitterCard`: Twitter 卡片类型
- `googleAnalytics`: Google Analytics ID
- `baiduAnalytics`: 百度统计 ID

#### features - 功能配置
- `enableSearch`: 启用搜索功能
- `enableThemeToggle`: 启用主题切换
- `enableI18n`: 启用国际化
- `enablePwa`: 启用 PWA
- `enableComments`: 启用评论功能

### resources.json - 资源数据

包含额外的资源分类和项目，用于扩展导航内容。

**结构说明：**
- `id`: 资源分类唯一标识符
- `title`: 分类标题
- `items`: 资源项目数组
  - `title`: 资源标题
  - `description`: 资源描述
  - `icon`: 资源图标 URL
  - `url`: 资源链接

## 数据验证

### 自动验证

项目包含数据验证功能，会在以下情况自动验证数据格式：
- 应用启动时
- 数据加载时
- 数据更新时

### 手动验证

可以使用以下命令手动验证数据文件：

```bash
# 验证所有数据文件
node validate-data.cjs

# 或者在应用中访问 /data-test 页面进行可视化测试
```

### 验证规则

#### 导航数据验证
- 必须是数组格式
- 每个分类必须包含 `id` 和 `title`
- 每个网站项目必须包含 `id`、`title`、`description`、`icon`、`href`
- URL 必须是有效的 HTTP/HTTPS 链接
- ID 不能重复

#### 站点配置验证
- 必须包含 `basic` 和 `appearance` 配置
- `basic.title` 和 `basic.description` 不能为空
- `appearance.theme` 必须是 'light'、'dark' 或 'system'
- 邮箱格式必须正确（如果提供）
- URL 格式必须正确（如果提供）

#### 资源数据验证
- 必须是数组格式
- 每个资源分类必须包含 `id`、`title` 和 `items`
- 每个资源项目必须包含 `title`、`description` 和 `url`
- URL 必须是有效的 HTTP/HTTPS 链接

## 数据更新

### 本地开发

在开发环境中，可以直接编辑这些 JSON 文件，应用会自动加载更新的数据。

### 生产环境

在生产环境中，数据通过 GitHub API 进行管理：
1. 管理员登录后台
2. 通过管理界面编辑数据
3. 数据自动同步到 GitHub 仓库
4. 应用从 GitHub 加载最新数据

## 最佳实践

### 数据组织
- 保持分类结构清晰，避免过深的嵌套
- 使用有意义的 ID 和标题
- 为每个项目提供准确的描述
- 定期检查链接的有效性

### 性能优化
- 控制单个分类下的项目数量（建议不超过 50 个）
- 优化图标 URL，使用 CDN 或本地资源
- 合理使用标签，避免过多标签

### 维护建议
- 定期备份数据文件
- 在更新前先验证数据格式
- 保持数据的一致性和准确性
- 记录重要的数据变更

## 故障排除

### 常见问题

1. **JSON 格式错误**
   - 检查是否有多余的逗号
   - 确保所有字符串都用双引号包围
   - 验证括号和大括号是否匹配

2. **数据验证失败**
   - 检查必填字段是否完整
   - 验证 URL 格式是否正确
   - 确保 ID 没有重复

3. **数据加载失败**
   - 检查文件路径是否正确
   - 确保文件权限设置正确
   - 验证网络连接（生产环境）

### 调试工具

- 使用 `/data-test` 页面进行可视化测试
- 运行 `node validate-data.cjs` 进行命令行验证
- 查看浏览器控制台的错误信息
- 使用开发者工具检查网络请求

## 版本历史

- v1.0.0: 初始版本，包含基本的导航数据、站点配置和资源数据结构