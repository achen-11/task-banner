# MCP 客户端 Logo（SVG）

**请使用项目根目录 `images/mcp-clients/`**（Kooboo CLI 媒体库同步），不要手动后台上传。

```bash
# 修改 SVG 后同步到远程站点
kb push images/mcp-clients/
# 或推送单个
kb push images/mcp-clients/cursor.svg
```

前端访问路径：`/images/mcp-clients/{id}.svg`（与 `X-TaskBanner-Client` 的 id 一致）。

## 文件与 header 值

| 文件 | `X-TaskBanner-Client` | 说明 |
|------|------------------------|------|
| `ai.svg` | `ai`（默认） | 通用 AI 标 |
| `cursor.svg` | `cursor` | Cursor 官方 brand icon |
| `claude.svg` | `claude` | Anthropic / Claude |
| `deepseek.svg` | `deepseek` | DeepSeek |
| `codex.svg` | `codex` | OpenAI 图形（Codex） |

本目录为说明与备份；**以 `images/mcp-clients/` 为同步源**（与 `assets` 内容保持一致即可）。

## 商标

Logo 归各品牌方所有；仅用于标识 MCP 调用来源。
