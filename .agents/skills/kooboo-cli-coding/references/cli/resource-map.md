# 资源映射

scope: cli-only

当前 Kooboo CLI 项目使用小写资源目录。若旧模板文档和 CLI 实现冲突，以 CLI 实现和当前项目目录为准。

## 站点资源

| 本地路径 | Kooboo 资源 | 说明 |
| --- | --- | --- |
| `src/api/**/*.ts` 或 `.js` | API | 必须有 `// @k-url ...` 注释。 |
| `src/code/**/*.ts` 或 `.js` | CodeBlock | Services、models、utils、integrations 等。 |
| `src/pagescript/**/*.ts` 或 `.js` | PageScript | 页面级可复用脚本。 |
| `src/page/**/*.html` | Page | 必须有 `<!-- @k-url ... -->` 注释。 |
| `src/layout/**/*.html` | Layout | 布局 HTML。 |
| `src/view/**/*.html` | View | 可复用视图组件。 |
| `src/js/**/*.js` | Script | 前端 JS。可选 `// @k-url ...` 指定 URL。 |
| `src/css/**/*.css` | Style | 前端 CSS。可选 `/* @k-url ... */` 指定 URL。 |
| `src/job/**/*.ts` | Job | 定时任务。 |
| `images/**` | Images | 媒体库文件，位于项目根目录。 |
| `content-file/**` | File | 站点内容文件，位于项目根目录。 |
| `mcp-tools/*.ts` | MCP Tool | 站点 MCP 工具，位于项目根目录；详见 `mcp-tools.md`。 |
| `src/module/**` | Module | 模块资源。 |

## 命名规则

API、CodeBlock、PageScript、Layout、Page、View 在同步时，会把本地嵌套路径转换成 Kooboo 点路径名称：

- `src/code/services/auth.ts` -> `services.auth`
- `src/view/app/common/header.html` -> `app.common.header`
- `<view id="app/common/header"></view>` 会转换成 Kooboo view id `app.common.header`

Script 和 Style 保留文件路径名：

- `src/js/http.js` -> script name `http.js`
- `src/css/app.main.css` -> style name `app.main.css`

Job 使用斜杠路径名：

- `src/job/order/sync.ts` -> `order/sync`

Images 和 content-file 会保留文件夹与文件名。

## MCP Tools

MCP Tool 与 `images/`、`content-file/` 一样位于**项目根目录**，不在 `src/` 下：

- `mcp-tools/weather.ts` → 远端 MCP 工具 `weather`
- 只支持一层：`mcp-tools/<tool-name>.ts`，不支持子目录
- 文件内 `meta.name` 必须与文件名（不含 `.ts`）一致
- 不需要 `@k-url`；元数据由 `export const meta` 提供

详细格式与同步命令见 `references/cli/mcp-tools.md`。

## 模块资源

模块路径以 `src/module/<moduleName>/...` 开头。

常见模块资源目录：

- `api`
- `code`
- `backend`
- `file`
- `img`
- `js`
- `css`
- `root`
- `view`

本地代码可以用 `module/<moduleName>` 导入模块，CLI 会在同步时转换成 Kooboo 可识别的路径。
