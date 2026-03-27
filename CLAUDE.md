# Skate Life - 开发规范

> 本文件为项目级开发规范，详情见 [README.md](./README.md)

## 基本信息

| 配置项 | 值 |
|--------|-----|
| **技术栈** | HTML5 + Three.js |
| **类型** | 3D 滑板游戏 |
| **平台** | Web (Cloudflare Pages) |
| **构建命令** | (无，需直接打开 index.html) |

## 开发命令

```bash
npm run lint        # 代码检查
npm run lint:fix    # 自动修复
npm run format      # 格式化代码
```

## 目录结构

```
skate-life/
├── index.html      # 主游戏页面
├── test.html       # 测试页面
├── css/            # 样式文件
├── js/             # 游戏脚本
└── images/         # 图片资源
```

## 代码规范

- JavaScript 文件使用 camelCase 或 PascalCase
- 关键逻辑必须加中文注释
- 遵循 ESLint + Prettier 规范

## 游戏说明

- 基于 Three.js 的 3D 游戏
- 使用 Canvas 渲染
- 支持响应式布局

## Git 提交规范

- commit message: `fix/feat/refactor: [模块] [简短描述]`
- 推送到 GitHub 前必须先询问用户

## 截图管理

- 视觉测试截图存放在 `screenshots/visual-testing/` 目录
- 该目录已添加到 `.gitignore`
