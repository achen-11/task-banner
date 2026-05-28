# MCP 客户端 Logo（SVG）

上传到 Kooboo 站点后，前端通过 `/media/mcp-clients/{id}.svg` 加载（与 `VITE_MCP_CLIENT_ICON_BASE` 一致时可改）。

## 文件清单

| 文件 | `X-TaskBanner-Client` | 来源说明 |
|------|------------------------|----------|
| `ai.svg` | `ai`（默认） | 项目内置通用 AI 标 |
| `cursor.svg` | `cursor` | [Cursor 官方 brand](https://cursor.com/brand) `cursor.com/brand/icon.svg` |
| `claude.svg` | `claude` | Simple Icons / Anthropic 标识（橙 `#D97757`） |
| `deepseek.svg` | `deepseek` | Simple Icons / DeepSeek（蓝 `#0066FF`） |
| `codex.svg` | `codex` | Simple Icons / OpenAI（Codex 无独立官方标，沿用 OpenAI 图形） |

## 上传步骤（Kooboo 后台）

1. 进入站点 **媒体库**，新建文件夹 `mcp-clients`（或保持扁平，文件名与上表一致）。
2. 将本目录下 5 个 `.svg` 全部上传。
3. 确认浏览器可访问，例如：`https://你的站点/media/mcp-clients/cursor.svg`。
4. 若实际 URL 前缀不是 `/media/mcp-clients`，在构建前设置环境变量：
   - `VITE_MCP_CLIENT_ICON_BASE=/你的前缀`

## 本地开发

同批文件已复制到 `frontend/public/mcp-clients/`，`pnpm dev` 时走 `/mcp-clients/*.svg`。

## 商标

Logo 归各品牌方所有；仅用于标识 MCP 调用来源，请遵守各产品品牌使用规范。
