# kb-task MCP Server

MCP (Model Context Protocol) Server for kb-task 任务管理系统。

## 功能

这个 MCP Server 提供了以下工具，让 AI 可以直接与你的任务管理系统交互：

- **kb_task_list** - 获取任务列表（支持筛选和分页）
- **kb_task_get** - 获取任务详情
- **kb_task_create** - 创建新任务
- **kb_task_update** - 更新任务信息
- **kb_task_comment** - 向任务添加评论

## 安装

```bash
cd kb-task-mcp
npm install
npm run build
```

## 配置

### 1. 在 Cursor 中配置 MCP Server

创建或编辑 `~/.cursor/mcp.json`（全局配置）或 `.cursor/mcp.json`（项目配置）：

```json
{
  "mcpServers": {
    "kb-task": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/kb-task-mcp/dist/index.js"],
      "env": {
        "KB_TASK_API_URL": "https://ai_task_manage.redev.cn",
        "KB_TASK_API_TOKEN": "${env:KB_TASK_API_TOKEN}",
        "KB_TASK_DEFAULT_PROJECT_ID": "${env:KB_TASK_DEFAULT_PROJECT_ID}"
      }
    }
  }
}
```

**配置说明**：
- `type`: `"stdio"` 表示使用标准输入输出通信（本地命令行服务器）
- `command`: 启动服务器的命令（`node`、`python`、`npx` 等）
- `args`: 传递给命令的参数数组
- `env`: 环境变量，支持变量插值：
  - `${workspaceFolder}`: 项目根目录路径
  - `${env:NAME}`: 从系统环境变量读取

**配置说明**：
- `KB_TASK_API_URL`: API 地址（必填）
- `KB_TASK_API_TOKEN`: API Token（必填）
- `KB_TASK_DEFAULT_PROJECT_ID`: 默认项目 ID（可选，但强烈推荐设置）
  - 设置后，调用 `kb_task_list` 和 `kb_task_create` 时可以不传 `projectId`
  - 如果调用时传了 `projectId`，会优先使用传入的值

### 2. 获取 API Token

1. 打开 kb-task 前端：https://ai_task_manage.redev.cn
2. 登录你的账号
3. 打开浏览器开发者工具（F12）
4. 在 Console 中执行：
   ```javascript
   localStorage.getItem('dev_token')
   ```
5. 复制返回的 token，填入 `KB_TASK_API_TOKEN`

### 3. 配置位置

- **项目配置**：在项目根目录创建 `.cursor/mcp.json`，仅在该项目中可用
- **全局配置**：在用户主目录创建 `~/.cursor/mcp.json`，在所有项目中可用

### 4. 重启 Cursor

配置完成后，重启 Cursor 以加载 MCP Server。

### 5. 验证配置

重启后，可以在 Cursor 中：
1. 打开 Settings（`Cmd+Shift+J` / `Ctrl+Shift+J`）
2. 进入 Features → Model Context Protocol
3. 查看 `kb-task` 服务器是否已加载

如果遇到问题，可以：
1. 打开 Output 面板（`Cmd+Shift+U` / `Ctrl+Shift+U`）
2. 在下拉菜单中选择 "MCP Logs"
3. 查看错误信息

## 使用示例

在 Cursor 中，你可以这样使用：

```
你: "列出所有高优先级的待办任务"

AI 会自动调用 kb_task_list 工具：
- projectId: (自动使用配置的默认项目 ID)
- priority: "high"
- status: "todo"

然后返回任务列表给你。

如果你指定了项目：
你: "列出项目 abc123 中所有高优先级的待办任务"

AI 会使用你指定的项目 ID：
- projectId: "abc123"
- priority: "high"
- status: "todo"
```

```
你: "帮我完成任务 #1001"

AI 会自动：
1. 调用 kb_task_get 获取任务详情
2. 读取任务描述，开始工作
3. 完成后调用 kb_task_update 更新状态为 completed
4. 调用 kb_task_comment 添加完成评论
```

```
你: "根据这个需求创建任务：实现用户登录功能，优先级高"

AI 会自动调用 kb_task_create 工具创建任务：
- projectId: (自动使用配置的默认项目 ID)
- title: "实现用户登录功能"
- priority: "high"
```

## 开发

```bash
# 开发模式（自动重新编译）
npm run dev

# 构建
npm run build

# 运行
npm start
```

## 项目结构

```
kb-task-mcp/
├── src/
│   ├── index.ts          # MCP Server 入口
│   ├── api/
│   │   └── client.ts     # API 客户端
│   └── tools/            # MCP 工具定义
│       ├── task-list.ts
│       ├── task-get.ts
│       ├── task-create.ts
│       ├── task-update.ts
│       └── task-comment.ts
├── dist/                  # 编译输出
├── package.json
├── tsconfig.json
└── README.md
```

## API 端点

MCP Server 调用以下 API 端点：

- `GET /api/task/list` - 获取任务列表
- `GET /api/task/detail` - 获取任务详情
- `POST /api/task/create` - 创建任务
- `PUT /api/task/update` - 更新任务
- `POST /api/task/comment` - 添加评论
- `GET /api/task/comments` - 获取评论列表
- `GET /api/task/activities` - 获取活动历史

## 注意事项

1. **API Token 安全**：不要将 token 提交到版本控制
2. **网络连接**：确保 MCP Server 可以访问你的 API 地址
3. **权限**：MCP Server 使用你提供的 token，拥有该 token 的所有权限

## 故障排除

### MCP Server 无法启动

检查：
1. Node.js 版本 >= 18
2. 已运行 `npm install` 和 `npm run build`
3. 配置文件路径正确

### API 调用失败

检查：
1. `KB_TASK_API_URL` 是否正确
2. `KB_TASK_API_TOKEN` 是否有效
3. 网络连接是否正常

### 查看日志

MCP Server 的日志会输出到 stderr，可以在 Cursor 的开发者工具中查看。
