---
name: kooboo-cli-coding
description: 本地 Kooboo CLI 站点开发。涉及 kb/kooboo-cli、src 资源目录、mcp-tools、KScript API/CodeBlock、SSR 模板或 Local 前端产物、.kooboo-ai 项目 spec 时使用。
---

# Kooboo CLI Coding

用于指导 AI 结合 Kooboo CLI 编写本地 Kooboo 站点。核心原则：以本地资源目录和 CLI 编译规则为准，不要按 Kooboo 后台 AI Chat 的对象 API 凭空猜实现。

## 设计原则

1. **本地文件优先**：读写 `src/` 下的真实文件，通过 `kb push` / `kb sync` 同步远端；不使用 `read_object_text`、`create_page` 等 Kooboo AI Chat 专有方法。
2. **项目 spec 优先**：若站点根目录存在 `.kooboo-ai/`，先读其内容，再读本 skill 的通用约定。
3. **渐进式披露**：先任务分流，再按需读取最小必要 reference；禁止跳过文档直接输出代码。
4. **默认不用 k-data**：CLI 本地开发默认不使用 `<k-data>`；SSR 取数用 `<script env="server">` + KScript。
5. **交付前 Preflight**：创建或修改代码后、最终回复用户前，必须执行 `preflight/index.md` 中的检查流程；存在 `BLOCKER` 时不得宣称完成。
6. **聚焦改动**：优先窄范围 `kb push`；除非用户要求，不要执行 git 操作或长时间全项目构建。

## 起步检查

1. 读 `package.json`、必要时读 `README.md`、`tsconfig.json`，列出 `src/` 资源目录。
2. 若存在 `.kooboo-ai/README.md`，先读它，再按需读 `specs/`、`rules/`。
3. 修改前搜索本项目已有约定：导入路径、响应封装、命名风格、前端路线（SSR / Local）。
4. 默认不要引入 k-data，除非用户或项目 spec 明确要求。

## 任务分流

| 任务类型 | 必读文档 |
| --- | --- |
| 打开陌生 CLI 站点 | `references/project/inspection.md` |
| CLI 命令、同步、推送 | `references/cli/workflow.md` |
| 资源目录与命名 | `references/cli/resource-map.md` |
| MCP Tools 编写与同步 | `references/cli/mcp-tools.md` |
| 前端（先判 SSR / Local） | `references/frontend/index.md` |
| Local 框架与 build（项目级） | `.kooboo-ai/specs/frontend.md` |
| 尚无项目 spec | `references/project/setup-specs.md` |
| API、CodeBlock、KScript | `references/backend/index.md` |
| 业务场景组合 | `references/scenario/index.md` |
| 故障分诊 | `references/debug.md` |
| 交付前检查 | `preflight/index.md` |

## 前端路线（强制判断）

创建或修改页面前，必须先读 `references/frontend/index.md` 并完成 SSR / Local 判断。

- **SSR**：需要 SEO、公开内容页 → `references/frontend/ssr/`
- **Local**：后台、复杂交互、任意前端框架 → `references/frontend/local/` + `.kooboo-ai/specs/frontend.md`

## 与 kooboo-coding 的关系

官方 `kooboo-coding` skill 面向 Kooboo 后台 AI Chat，可参考其 KScript、模板语法、Backend 三层文档，但须遵守以下差异：

| 官方 kooboo-coding | 本 skill（CLI） |
| --- | --- |
| `read_object_text` | 读本地 `src/...` 文件 |
| `create_xxx` 函数 | 写本地文件 + `kb push` |
| `load_skill` | 读本 skill 的 `references/` |
| `<k-data>` | `<script env="server">` 或 API fetch |
| Preflight 调运行时 API | 本地 `scripts/preflight-scan.js` |

## Preflight（强制）

任何创建或修改代码的任务，在最终回复用户前必须执行 Preflight。详见 `preflight/index.md`。

## 安装

**推荐（agent-skills 生态）：**

```bash
npx skills add achen-11/kooboo-cli-coding --skill kooboo-cli-coding
```

**symlink 安装：**

```bash
git clone https://github.com/achen-11/kooboo-cli-coding.git ~/skills/kooboo-cli-coding
ln -sfn ~/skills/kooboo-cli-coding/skills/kooboo-cli-coding ~/.cursor/skills/kooboo-cli-coding
```

也可在仓库根目录运行 `scripts/install-skill.sh --yes` 自动链接到常见 AI 工具目录。

宣传站：https://kooboo_cli_coding.localkooboo.com
