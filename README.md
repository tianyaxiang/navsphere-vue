# NavSphere Vue

现代化导航管理平台 - Vue 3 版本

## 技术栈

- **前端框架**: Vue 3 (Composition API)
- **类型系统**: TypeScript
- **构建工具**: Vite
- **样式框架**: Tailwind CSS
- **状态管理**: Pinia
- **路由管理**: Vue Router
- **UI 组件**: Headless UI Vue
- **图标库**: Lucide Vue
- **数据存储**: GitHub API (Octokit)
- **身份认证**: GitHub OAuth

## 快速开始

### 环境要求

- Node.js 18.0+
- npm/yarn/pnpm

### 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 环境配置

1. 复制环境变量文件：
```bash
cp .env.example .env
```

2. 配置 GitHub OAuth 应用和数据仓库信息

### 开发

```bash
npm run dev
```

### 构建

```bash
npm run build
```

### 预览

```bash
npm run preview
```

## 项目结构

```
src/
├── assets/          # 静态资源
├── components/      # 可复用组件
├── router/          # 路由配置
├── stores/          # Pinia 状态管理
├── types/           # TypeScript 类型定义
├── utils/           # 工具函数
├── services/        # API 服务
└── views/           # 页面组件
```

## 开发指南

### 代码规范

项目使用 ESLint 和 Prettier 进行代码规范检查：

```bash
# 代码检查
npm run lint

# 代码格式化
npm run format

# 类型检查
npm run type-check
```

### 提交规范

请遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

## 部署

项目支持多种部署方式：

- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages

详细部署指南请参考文档。

## 许可证

MIT License