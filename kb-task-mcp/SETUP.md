# kb-task MCP Server 配置指南

## ✅ 已完成

1. ✅ 创建 MCP Server 项目结构
2. ✅ 实现 5 个 MCP 工具（list, get, create, update, comment）
3. ✅ 安装依赖并构建项目
4. ✅ 配置 Claude Code (`~/.claude/mcp_config.json`)

## 🔐 认证配置

kb-task API 需要认证才能访问。有两个选项：

### 选项 1：使用开发 Token（推荐，简单）

1. 打开 kb-task 前端：https://ai_task_manage.redev.cn
2. 登录你的账号
3. 打开浏览器开发者工具（F12）
4. 在 Console 中执行：
   ```javascript
   localStorage.getItem('dev_token')
   ```
5. 复制返回的 token
6. 更新 `~/.claude/mcp_config.json`：
   ```json
   {
     "mcpServers": {
       "kb-task": {
         "command": "node",
         "args": ["/Users/achen/Priv/task-banner/kb-task-mcp/dist/index.js"],
         "env": {
           "KB_TASK_API_URL": "https://ai_task_manage.redev.cn",
           "KB_TASK_API_TOKEN": "你的token"
         }
       }
     }
   }
   ```

### 选项 2：扩展 API 支持 Cookie 认证

如果你想使用 Cookie 认证（生产环境方式），需要：

1. 修改 `kb-task-mcp/src/api/client.ts`
2. 在构造函数中添加：
   ```typescript
   this.client = axios.create({
     baseURL,
     withCredentials: true,  // 添加这一行
     // ...
   });
   ```

## 🧪 测试 MCP Server

重启 Claude Code 后，测试以下命令：

```
你: "列出所有任务"
```

如果配置正确，Claude 会自动调用 `kb_task_list` 工具并返回任务列表。

## 🎯 使用示例

### 1. 列出任务

```
你: "列出所有高优先级的待办任务"
```

Claude 会调用：
```typescript
kb_task_list({ priority: "high", status: "todo" })
```

### 2. 查看任务详情

```
你: "查看任务 #123 的详情"
```

Claude 会调用：
```typescript
kb_task_get({ taskId: "123" })
```

### 3. 完成任务

```
你: "帮我完成任务 #123"
```

Claude 会：
1. 调用 `kb_task_get` 获取任务详情
2. 根据任务描述执行开发工作
3. 调用 `kb_task_update` 更新状态为 completed，并添加摘要
4. 可选：调用 `kb_task_comment` 记录实现细节
5. 执行 `.claude-notify.sh` 发送推送通知

### 4. 创建任务

```
你: "创建一个任务：实现用户登录功能，优先级高"
```

Claude 会调用：
```typescript
kb_task_create({
  projectId: "...",  // 需要提供项目 ID
  title: "实现用户登录功能",
  priority: "high",
  status: "todo"
})
```

## 📱 完整工作流演示

```
你: "帮我完成项目中所有高优先级的待办任务，完成后通知我"

Claude:
1. 调用 kb_task_list 获取高优先级待办任务
2. 找到 3 个任务
3. 逐个处理：
   - 读取任务详情
   - 执行开发工作（写代码、运行测试）
   - 更新任务状态、添加摘要
   - 添加评论记录细节
4. 全部完成后调用 .claude-notify.sh

[你的 iPhone 收到 Bark 推送]
"✅ 已完成 3 个高优先级任务"
```

## 🐛 故障排查

### 问题 1：Claude 没有调用 MCP 工具

**解决方案：**
1. 检查 `~/.claude/mcp_config.json` 路径是否正确
2. 重启 Claude Code
3. 检查 MCP Server 日志（通过 `console.error` 输出）

### 问题 2：401 Unauthorized

**解决方案：**
1. 检查 `KB_TASK_API_TOKEN` 是否配置正确
2. Token 可能已过期，重新获取
3. 使用选项 2 改用 Cookie 认证

### 问题 3：找不到任务

**解决方案：**
1. 检查任务 ID 是否正确（使用 displayId 或 _id 都可以）
2. 检查 API URL 是否正确
3. 使用 `kb_task_list` 先列出所有任务

## 📚 MCP 工具列表

| 工具名称 | 描述 | 参数 |
|---------|------|------|
| `kb_task_list` | 获取任务列表 | `projectId`, `status`, `priority`, `assigneeId`, `page`, `size` |
| `kb_task_get` | 获取任务详情 | `taskId` (必填) |
| `kb_task_create` | 创建新任务 | `projectId` (必填), `title` (必填), `content`, `status`, `priority`, `assigneeId`, `tagIds` |
| `kb_task_update` | 更新任务 | `taskId` (必填), `status`, `priority`, `title`, `content`, `summary`, `progress`, `assigneeId` |
| `kb_task_comment` | 添加评论 | `taskId` (必填), `content` (必填), `mentionedUsers` |

## 🚀 下一步

现在你可以：

1. **配置认证**（选项 1 或 2）
2. **重启 Claude Code**
3. **测试第一个命令**："列出所有任务"
4. **体验自动化**："帮我完成任务 #123"

祝你使用愉快！🎉
