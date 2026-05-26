# 后端开发入口

scope: cli-only

Kooboo CLI 后端由 KScript 风格的 TypeScript 组成，主要落在 `src/api/`（API）和 `src/code/`（CodeBlock）。

## 按需加载

| 任务 | 文档 |
| --- | --- |
| API 路由与 handler | `references/backend/api-patterns.md` |
| KScript 模块（request、response、DB 等） | `references/backend/k-script/index.md`（待扩充） |
| MCP Tools（站点 MCP 工具） | `references/cli/mcp-tools.md` |
| 三层架构（API / Service / Data） | 待从官方 Backend 移植 |

## 通用原则

1. **先读项目已有代码** — helper、响应格式、alias 导入风格
2. **`k.xxx` API 先查文档** — 禁止凭其他语言习惯臆造方法名
3. **API 调 Service** — 使用 `import { fn } from "code/services/xxx"`，禁止臆造 `k.req.services` 等不存在 API
4. **每个 API 文件** — 顶部必须有 `// @k-url ...` 注释
5. **编辑后推送** — `kb push src/api/...` 或 `kb push src/code/...`

## 与官方 kooboo-coding 的关系

KScript 模块文档（`k.request`、`k.response`、`k.DB` 等）可从官方 `references/K-Script/` cherry-pick，写入 `references/backend/k-script/`。

Backend 三层规范可从官方 `references/Backend/` 移植；「创建 API」步骤改为写本地 `.ts` 文件。

## Preflight

修改 API 或 CodeBlock 后，交付前扫描对应文件（见 `preflight/index.md`）。
