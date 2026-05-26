# 前端开发入口

scope: cli-only

Kooboo CLI 前端资源是普通 HTML、CSS、JS，通过 CLI 同步为 Kooboo 站点资源。创建或修改页面前，**必须先完成 SSR / Local 路线判断**。

## 路线判断（强制）

| 判断项 | SSR 适宜 | Local 适宜 |
| --- | --- | --- |
| 需要 SEO | 是 | 否 |
| 公开访问 | 是 | 否 |
| 内容型站点 | 是 | 否 |
| 后台管理 | 否 | 是 |
| 仪表盘 / 数据分析 | 否 | 是 |
| 大量客户端交互 | 否 | 是 |
| 复杂组件（图表、拖拽等） | 否 | 是 |
| 任意前端框架 | 否 | 是 |

**决策原则（SSR 优先）：** 默认走 SSR，除非同时满足：不需要 SEO、非公开或后台类页面、且有大量客户端交互或复杂组件。

若项目已有 `.kooboo-ai/specs/frontend.md`，以其声明的路线为准；与本表冲突时，**项目 spec 优先**。

## 路线文档

| 路线 | 必读 |
| --- | --- |
| SSR | `references/frontend/ssr/overview.md` |
| Local | `references/frontend/local/overview.md` + `.kooboo-ai/specs/frontend.md` |

## 通用资源概念

无论哪条路线，都需理解 Kooboo 前端资源模型。详见 `references/cli/resource-map.md`。

- **Layout** — `src/layout/`，页面骨架与 placeholder
- **Page** — `src/page/`，路由页面，需 `<!-- @k-url ... -->`
- **View** — `src/view/`，可复用 HTML 片段
- **Script** — `src/js/`，前端 JS
- **Style** — `src/css/`，前端 CSS

## 禁止默认使用

- `<k-data>` — CLI 本地开发默认不用；SSR 取数见 `ssr/overview.md`
- Kooboo AI Chat 的 `create_page` 等函数 — 直接编辑本地 HTML 文件

## Preflight

前端文件修改完成后，交付前必须跑 Preflight（`preflight/index.md`），至少扫描本轮修改的 Page / Layout / View / Script / Style。
