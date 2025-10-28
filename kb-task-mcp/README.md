# kb-task MCP Server

MCP (Model Context Protocol) 服务器，用于连接 Claude Code 和 kb-task 任务管理系统。

## 功能

提供以下 MCP 工具：

- `kb_task_list` - 获取任务列表（支持筛选）
- `kb_task_get` - 获取任务详情
- `kb_task_create` - 创建新任务
- `kb_task_update` - 更新任务（状态、摘要等）
- `kb_task_comment` - 添加任务评论

## 安装

```bash
npm install
```

## 构建

```bash
npm run build
```

## 配置

在 `~/.claude/mcp_config.json` 中添加配置：

```json
{
  "mcpServers": {
    "kb-task": {
      "command": "node",
      "args": ["/Users/achen/Priv/task-banner/kb-task-mcp/dist/index.js"],
      "env": {
        "KB_TASK_API_URL": "http://localhost:3000",
        "KB_TASK_API_TOKEN": ""
      }
    }
  }
}
```

## 使用示例

在 Claude Code 中：

```
你: "列出所有高优先级的待办任务"
Claude: [自动调用 kb_task_list 工具]

你: "帮我完成任务 #123"
Claude: [调用 kb_task_get 获取详情，完成后调用 kb_task_update 更新状态]
```

## 开发

监听模式（自动重启）：

```bash
npm run dev
```

## 环境变量

- `KB_TASK_API_URL` - kb-task API 地址（默认: http://localhost:3000）
- `KB_TASK_API_TOKEN` - API 认证令牌（可选）
