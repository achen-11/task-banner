# Local 前端概览

scope: cli-only

Local 路线：前端在本地用任意框架开发（Vue、React 等），build 后将产物放入 CLI 要求的 `src/page`、`src/js`、`src/css` 目录，再经 `kb push` 同步。

**本 skill 不规定具体框架或技术栈** — 这些属于项目级 spec，写入站点 `.kooboo-ai/specs/frontend.md`。

若项目尚无该 spec，先按 `references/project/setup-specs.md` 协助用户创建。

## Kooboo 资源概念（必须理解）

即使使用 SPA 或 SSR 框架，最终仍要落到 Kooboo 资源模型：

| 概念 | 说明 |
| --- | --- |
| Layout | 页面外层骨架，含 `<placeholder>` |
| Page | 路由对应的 HTML，需 `<!-- @k-url ... -->` |
| View | 可复用 HTML 片段，用 `<view id="path/to/view">` 引用 |
| Script | `src/js/*.js`，可选 `// @k-url` |
| Style | `src/css/*.css`，可选 `/* @k-url */` |

路径映射见 `references/cli/resource-map.md`。

## 产物契约

build 完成后，至少满足：

1. 页面 HTML 位于 `src/page/`，带 `@k-url` 注释
2. 静态 JS 位于 `src/js/`（扩展名 `.js`）
3. 静态 CSS 位于 `src/css/`（扩展名 `.css`）
4. View 引用使用斜杠 id：`<view id="app/common/header">`

具体源码目录、build 命令、产物映射规则 — **读 `.kooboo-ai/specs/frontend.md`**。

## 与 SSR 混搭

Local 路线的 Page / View 中仍可使用 Kooboo 模板能力，例如：

- `<script env="server">` 注入首屏数据
- `<view>` 组合静态片段
- `k-if` / `k-for` / `{{ }}` 模板绑定

详见 `references/frontend/ssr/overview.md` 中的模板与服务端脚本节。

## 前端请求

若项目有 `src/js/http.js` 或 axios 封装，优先使用。API 路径与响应格式遵循项目 spec 或 `references/backend/api-patterns.md`。

## 同步

```bash
kb push src/page/
kb push src/js/
kb push src/css/
```

窄范围推送优先；大范围改动前确认用户是否需要同步远端。

## 本 skill 不覆盖的内容

以下内容应写在 `.kooboo-ai/specs/frontend.md`，而非本 reference：

- 框架选型（Vue / React / Svelte 等）
- 组件库与设计系统
- 源码目录结构与 build 配置
- ESLint / Prettier 等代码规范
- 状态管理与路由方案
