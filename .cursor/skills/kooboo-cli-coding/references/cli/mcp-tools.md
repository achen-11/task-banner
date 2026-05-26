# MCP Tools 同步

scope: cli-only

MCP Tools 是站点级 KScript 工具，供 Kooboo MCP 服务暴露给 AI 客户端调用。CLI 支持在本地 `mcp-tools/` 目录编写工具，并通过 `kb pull` / `kb push` / `kb sync` 与远端站点同步。

## 目录位置

MCP Tool 位于**项目根目录**，与 `images/`、`content-file/` 同级，**不在 `src/` 下**：

```text
my-site/
├── mcp-tools/
│   ├── list_tasks.ts
│   └── create_task.ts
├── src/
├── images/
└── content-file/
```

## 命名与结构约束

| 规则 | 说明 |
| --- | --- |
| 路径 | 只能是 `mcp-tools/<tool-name>.ts` |
| 嵌套 | **不支持**子目录，如 `mcp-tools/group/weather.ts` 会报错 |
| 扩展名 | 必须是 `.ts` |
| 工具名 | `meta.name` 必须与文件名（不含扩展名）一致 |

远端工具名若含 `/` 或路径穿越字符，pull 时会拒绝写入本地。

## 文件格式

每个工具是**单文件 TypeScript**，顶部导出字面量 `meta`，下方是 KScript 函数体：

```ts
export const meta = {
  name: "weather",
  description: "Get weather by location",
  approvalRequired: false,
  tags: ["demo", "utility"],
  inputSchema: {
    type: "object",
    properties: {
      location: { type: "string", description: "City name" }
    },
    required: ["location"],
    additionalProperties: false
  }
} as const;

import helper from "code/shared/helper";

const { location } = k.request.body;
helper(location);
k.response.json({ ok: true, location });
```

### meta 字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `name` | string | 工具名，必须与文件名一致 |
| `description` | string | 工具描述，供 MCP 客户端展示 |
| `approvalRequired` | boolean | 是否在执行前需要用户审批 |
| `tags` | string[] | 标签，用于分组或筛选 |
| `inputSchema` | object | JSON Schema 字面量，描述入参 |

`meta` 必须是**可静态解析的字面量对象**（字符串、布尔、数字、数组、嵌套对象）。不支持运行时表达式、变量引用或 computed property name。

### 函数体

- `meta` 导出块之后的代码即为工具执行逻辑
- 使用 KScript API（`k.request`、`k.response` 等）
- 可通过 `code/*`、`module/*` 等项目 alias 导入 CodeBlock，与 API 文件规则相同
- push 时 CLI 会剥离 `meta`，将函数体按 Kooboo 路径编译后上传

### 入参读取

MCP 调用参数在 `k.request.body` 中。项目内若有统一解析 helper（如 `code/utils/mcpArgs`），优先沿用项目已有写法。

## CLI 命令

### 拉取

```bash
kb pull mcp-tools
kb pull mcp-tools/weather.ts
```

从远端 `/mcp/GetTools` 拉取工具列表，写入 `mcp-tools/<name>.ts`。pull 会将远端函数体反编译为本地可编辑格式，并生成 `export const meta = { ... }` 块。

### 推送

```bash
kb push mcp-tools
kb push mcp-tools/weather.ts
```

聚焦改动时优先推送单个文件。也支持 git 模式：

```bash
kb push --git --staged    # 若 staged 变更含 mcp-tools/
```

### 监听同步

`kb sync`（或项目的 `pnpm dev`）会监听 `mcp-tools/` 目录变更，保存后自动 push 到远端。

## 同步行为

| 操作 | 行为 |
| --- | --- |
| 新增/修改本地文件 | 解析 `meta` + 函数体 → POST `/mcp/PostTool` |
| 删除本地文件 | 按工具名查找远端 id → POST `/mcp/DeleteTools` |
| pull | GET `/mcp/GetTools` → 渲染为本地 `.ts` 文件 |

与 API / CodeBlock 不同，MCP Tool **不需要** `// @k-url` 注释；元数据由 `export const meta` 提供。

## 编写建议

1. **先读项目已有工具** — `rg --files mcp-tools` 或 `ls mcp-tools/`，沿用 import、响应格式、参数解析方式。
2. **name 与文件名一致** — `weather.ts` 内 `meta.name` 必须是 `"weather"`。
3. **inputSchema 写完整** — 字段加 `description`，需要时用 `additionalProperties: false`。
4. **复用 CodeBlock** — 业务逻辑放 `src/code/`，MCP Tool 做薄封装。
5. **窄范围推送** — 改单个工具时 `kb push mcp-tools/<name>.ts`。

## 常见错误

| 现象 | 原因 |
| --- | --- |
| `meta.name must match the file name` | 文件名与 `meta.name` 不一致 |
| `MCP tool must export a top-level const meta object` | 缺少 `export const meta` |
| `mcp-tools only supports direct child files` | 使用了子目录 |
| `mcp-tool must be a ts file` | 扩展名不是 `.ts` |
| push 后远端未更新 | 未执行 push/sync，或 meta 非字面量导致解析失败 |

## 与 API / CodeBlock 的区别

| | API | CodeBlock | MCP Tool |
| --- | --- | --- | --- |
| 路径 | `src/api/` | `src/code/` | `mcp-tools/` |
| URL 注释 | 需要 `@k-url` | 不需要 | 不需要 |
| 元数据 | API 路由 | 无 | `export const meta` |
| 调用方 | HTTP 客户端 | 其他 KScript import | MCP 客户端 |
| 暴露 | REST 端点 | 内部模块 | MCP 工具列表 |

## 参考

- 资源映射总览：`references/cli/resource-map.md`
- CLI 工作流：`references/cli/workflow.md`
- KScript 用法：`references/backend/index.md`
