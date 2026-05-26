# Final Preflight — 交付前检查

Preflight 是 Kooboo CLI 编码任务的**强制交付闸门**。AI 在创建或修改代码后、最终回复用户之前，必须执行 Preflight。

## 什么时候执行

以下情况在最终回复前都必须执行：

- 创建或修改 Page / Layout / View / Script / Style
- 创建或修改 API / CodeBlock / PageScript
- Bug 修复或返工

若存在任何 `BLOCKER`，**不要宣称任务已完成**。必须先修复，或明确报告无法修复的阻塞原因。

## 如何执行

在**站点项目根目录**运行（非 skill repo 本身）：

```bash
node /path/to/kooboo-cli-coding/scripts/preflight-scan.js \
  --root . \
  --artifacts '[
    {"path":"src/page/home.html","type":"Page"},
    {"path":"src/api/v1/auth.ts","type":"Api"},
    {"path":"mcp-tools/weather.ts","type":"McpTool"}
  ]'
```

`artifacts` 只需列出**本轮创建或修改**的文件。扫描器读取本地文件内容，不依赖 Kooboo 运行时。

### 参数字段

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `path` | 是 | 相对 `--root` 的文件路径 |
| `type` | 是 | `Page` / `Layout` / `View` / `Style` / `Script` / `Api` / `CodeBlock` / `McpTool` |
| `layoutId` | 否 | Page 绑定的 layout id，用于校验 layout/placeholder 声明 |

## 结果解读

| 级别 | 含义 |
| --- | --- |
| `BLOCKER` | 必须修复后才能交付 |
| `WARN` | 建议修复；用户明确要求快速交付时可说明遗留项 |

## 规则索引

规则文件位于 `preflight/rules/`：

| 文件 | 适用范围 |
| --- | --- |
| `common.yaml` | 通用规则 |
| `page.yaml` | Page / Layout / View |
| `api.yaml` | API / CodeBlock |
| `mcp-tool.yaml` | MCP Tool（`mcp-tools/*.ts`） |

## 脚本状态

`scripts/preflight-scan.js` 正在本地重构，不依赖 Kooboo AI Chat 运行时。当前为骨架实现；规则与扫描逻辑将逐步完善。

## AI 执行要求

1. 修改代码后，构造本轮 artifacts 列表
2. 运行 preflight-scan.js
3. 若有 BLOCKER，修复后重新扫描
4. 全部 BLOCKER 清零后，才可向用户宣称完成
