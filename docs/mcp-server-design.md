# kb-task MCP 服务器自动化方案

> **目标**：实现 Claude Code 与 kb-task 系统的深度集成，让 AI 可以直接读取、处理、更新任务，无需手动复制粘贴。

---

## 📋 目录

1. [什么是 MCP](#什么是-mcp)
2. [能实现什么效果](#能实现什么效果)
3. [技术架构](#技术架构)
4. [实现方案](#实现方案)
5. [使用场景示例](#使用场景示例)
6. [实现步骤](#实现步骤)
7. [代码结构](#代码结构)
8. [API 设计](#api-设计)

---

## 🤔 什么是 MCP

**MCP (Model Context Protocol)** 是 Anthropic 推出的协议，允许 Claude 通过标准接口调用外部工具和服务。

### 核心概念

```
Claude Code (客户端)
       ↓
   MCP 协议
       ↓
kb-task MCP Server (我们要创建的)
       ↓
  kb-task API
       ↓
   SQLite 数据库
```

### 为什么需要 MCP？

**传统方式（现在）：**
```
1. 人工在 kb-task 导出任务 → Markdown/JSON
2. 复制粘贴给 Claude Code
3. Claude 完成任务，生成 task.json
4. 复制粘贴回 kb-task 导入
```

**MCP 方式（自动化）：**
```
1. 用户："处理任务 #123"
2. Claude 自动调用 getTask(123) → 读取任务
3. Claude 完成开发工作
4. Claude 自动调用 updateTask(123, {...}) → 更新任务
5. 发送 Bark 推送通知用户
```

---

## 🎯 能实现什么效果

### 效果 1：语音指令式任务管理

```
用户："帮我完成项目 ABC 中所有高优先级的待办任务"

Claude Code 自动：
1. 调用 listTasks({projectId: "ABC", priority: "high", status: "todo"})
2. 获取到 5 个任务
3. 逐个处理每个任务
4. 完成后自动更新任务状态、添加摘要、记录实现细节
5. 发送推送："已完成 5 个高优先级任务"

你只需要等待推送，然后刷新 kb-task 即可看到结果！
```

### 效果 2：智能任务分析

```
用户："分析一下任务 #456 的技术风险"

Claude Code 自动：
1. getTask(456) 获取任务详情
2. 读取任务描述、相关代码
3. 分析技术难点、潜在风险
4. 自动添加评论到任务：
   "⚠️ 风险分析：
    1. 数据库迁移可能影响现有功能
    2. 建议先在测试环境验证
    3. 预计需要 2-3 小时"
5. 用户在 kb-task 中直接看到评论
```

### 效果 3：批量任务处理

```
用户："把所有标记为 bug 的任务都处理一下"

Claude Code 自动：
1. listTasks({tags: ["bug"], status: "todo"})
2. 获取 10 个 bug 任务
3. 逐个分析代码、定位问题、修复
4. 每个任务完成后：
   - updateTask() 更新状态为 completed
   - addComment() 记录修复方案
   - 生成 Git commit
5. 最终推送："已修复 10 个 bug"
```

### 效果 4：自动任务创建

```
用户："根据这个需求文档创建开发任务"
[上传 PRD.md]

Claude Code 自动：
1. 读取 PRD.md
2. 提取功能点，拆分为子任务
3. 调用 createTask() 批量创建：
   - 任务 1：数据库设计
   - 任务 2：API 接口开发
   - 任务 3：前端页面实现
   - 任务 4：单元测试
4. 自动设置优先级、依赖关系
5. 推送："已创建 4 个任务，已分配优先级"
```

### 效果 5：定时任务报告

```
用户："每天下班前给我发个今日任务总结"

设置定时脚本：
1. 每天 18:00 自动运行
2. listTasks({updatedAt: {$gte: today}})
3. 统计：完成 X 个，新增 Y 个，进行中 Z 个
4. 生成 Markdown 报告
5. 通过 Bark 推送到手机
```

---

## 🏗️ 技术架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        Claude Code                          │
│  (运行在你的终端，你在这里给 AI 下指令)                       │
└───────────────────┬─────────────────────────────────────────┘
                    │ MCP Protocol (JSON-RPC)
                    ↓
┌─────────────────────────────────────────────────────────────┐
│                   kb-task MCP Server                        │
│  (Node.js 进程，监听 stdio 或 HTTP 请求)                     │
│                                                              │
│  提供工具：                                                   │
│  - kb_task_list        获取任务列表                          │
│  - kb_task_get         获取任务详情                          │
│  - kb_task_create      创建新任务                            │
│  - kb_task_update      更新任务                              │
│  - kb_task_comment     添加评论                              │
│  - kb_task_export      导出任务为 Markdown                   │
│  - kb_task_import      批量导入任务                          │
└───────────────────┬─────────────────────────────────────────┘
                    │ HTTP API Calls
                    ↓
┌─────────────────────────────────────────────────────────────┐
│                  kb-task Backend API                        │
│  (Kooboo 服务器，运行在 http://localhost:xxxx)               │
│                                                              │
│  端点：                                                       │
│  - GET  /api/task/list                                      │
│  - GET  /api/task/detail?id=xxx                             │
│  - POST /api/task/create                                    │
│  - PUT  /api/task/update                                    │
│  - POST /api/task/comment                                   │
└───────────────────┬─────────────────────────────────────────┘
                    │ ORM (k_sqlite)
                    ↓
┌─────────────────────────────────────────────────────────────┐
│                     SQLite Database                         │
│  (存储项目、任务、标签、用户等数据)                           │
└─────────────────────────────────────────────────────────────┘
```

### 数据流示例

**场景：用户说 "帮我完成任务 #123"**

```
1. Claude Code 解析用户意图
   ↓
2. 调用 MCP 工具：kb_task_get(taskId: "123")
   ↓
3. MCP Server 收到请求
   ↓
4. 发送 HTTP 请求：GET http://localhost:3000/api/task/detail?id=123
   ↓
5. kb-task API 查询数据库，返回任务详情
   ↓
6. MCP Server 将结果返回给 Claude Code
   ↓
7. Claude Code 读取任务，执行开发工作（修改代码、运行测试等）
   ↓
8. 完成后，调用 MCP 工具：kb_task_update(taskId: "123", status: "completed", summary: "已完成...")
   ↓
9. MCP Server 发送 HTTP 请求：PUT /api/task/update
   ↓
10. kb-task API 更新数据库
   ↓
11. 返回成功，Claude Code 执行通知脚本：.claude-notify.sh
   ↓
12. 用户收到 Bark 推送："任务 #123 已完成"
```

---

## 🛠️ 实现方案

### 方案 A：标准 MCP 服务器（推荐）⭐️⭐️⭐️⭐️⭐️

#### 特点
- 完全遵循 MCP 协议规范
- 可以在 Claude Code 中直接使用
- 支持多个客户端同时连接
- 易于调试和扩展

#### 实现方式
1. 创建独立的 Node.js 项目
2. 实现 MCP Server 协议（使用 @modelcontextprotocol/sdk）
3. 通过 stdio 与 Claude Code 通信
4. 配置到 ~/.claude/mcp_config.json

#### 目录结构
```
kb-task-mcp/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # MCP Server 入口
│   ├── tools/            # 工具函数定义
│   │   ├── task-list.ts
│   │   ├── task-get.ts
│   │   ├── task-create.ts
│   │   ├── task-update.ts
│   │   ├── task-comment.ts
│   │   ├── task-export.ts
│   │   └── task-import.ts
│   ├── api/              # kb-task API 客户端
│   │   └── client.ts
│   └── config.ts         # 配置管理
├── dist/                 # 编译输出
└── README.md
```

---

### 方案 B：内嵌式 MCP 工具（备选）⭐️⭐️⭐️

#### 特点
- 不需要独立进程
- 直接通过 Claude Code 的 bash 命令调用
- 实现简单，快速上手

#### 实现方式
1. 在 kb-task 项目中创建 scripts/ 目录
2. 编写 CLI 工具（使用 commander.js）
3. Claude Code 通过 bash 工具调用 CLI

#### 缺点
- 每次调用都要启动新进程（性能较差）
- 无法利用 MCP 的智能提示
- Claude Code 需要手动解析输出

---

## 💻 实现步骤

### 第一步：创建 MCP 服务器项目

```bash
# 1. 创建项目目录
mkdir kb-task-mcp
cd kb-task-mcp

# 2. 初始化 npm 项目
npm init -y

# 3. 安装依赖
npm install @modelcontextprotocol/sdk axios dotenv
npm install -D typescript @types/node tsx

# 4. 配置 TypeScript
npx tsc --init
```

**tsconfig.json 配置：**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

**package.json 配置：**
```json
{
  "name": "kb-task-mcp",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "axios": "^1.6.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

### 第二步：实现 API 客户端

**src/api/client.ts**
```typescript
import axios, { AxiosInstance } from 'axios';

export class KbTaskApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string, apiToken?: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...(apiToken && { 'Authorization': `Bearer ${apiToken}` })
      },
      timeout: 30000
    });
  }

  // 获取任务列表
  async listTasks(filters: {
    projectId?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    tagIds?: string[];
    page?: number;
    size?: number;
  }) {
    const response = await this.client.get('/api/task/list', { params: filters });
    return response.data;
  }

  // 获取任务详情
  async getTask(taskId: string) {
    const response = await this.client.get('/api/task/detail', {
      params: { id: taskId }
    });
    return response.data;
  }

  // 创建任务
  async createTask(data: {
    projectId: string;
    title: string;
    content?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    tagIds?: string[];
    dueDate?: number;
  }) {
    const response = await this.client.post('/api/task/create', data);
    return response.data;
  }

  // 更新任务
  async updateTask(taskId: string, updates: {
    title?: string;
    content?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    tagIds?: string[];
    summary?: string;
    progress?: number;
  }) {
    const response = await this.client.put('/api/task/update', {
      id: taskId,
      ...updates
    });
    return response.data;
  }

  // 添加评论
  async addComment(taskId: string, content: string, mentionedUsers?: string[]) {
    const response = await this.client.post('/api/task/comment', {
      taskId,
      content,
      mentionedUsers
    });
    return response.data;
  }

  // 获取任务活动历史
  async getTaskActivities(taskId: string) {
    const response = await this.client.get('/api/task/activities', {
      params: { taskId }
    });
    return response.data;
  }

  // 获取项目列表（用于查询 projectId）
  async listProjects() {
    const response = await this.client.get('/api/project/list');
    return response.data;
  }
}
```

---

### 第三步：实现 MCP 工具

**src/tools/task-list.ts**
```typescript
import { z } from 'zod';
import { KbTaskApiClient } from '../api/client.js';

export const taskListTool = {
  name: 'kb_task_list',
  description: '获取 kb-task 中的任务列表，支持按项目、状态、优先级等筛选',
  inputSchema: z.object({
    projectId: z.string().optional().describe('项目 ID（可选）'),
    status: z.enum(['todo', 'in_progress', 'completed', 'review']).optional().describe('任务状态'),
    priority: z.enum(['low', 'medium', 'high']).optional().describe('优先级'),
    assigneeId: z.string().optional().describe('指派人 ID'),
    tagIds: z.array(z.string()).optional().describe('标签 ID 列表'),
    page: z.number().default(1).describe('页码'),
    size: z.number().default(20).describe('每页数量')
  }),

  async execute(params: any, apiClient: KbTaskApiClient) {
    const result = await apiClient.listTasks(params);

    // 格式化输出，便于 AI 阅读
    const formatted = result.items.map((task: any) => ({
      id: task._id,
      displayId: task.displayId,
      title: task.title,
      status: task.status,
      priority: task.priority,
      summary: task.summary || '(无摘要)',
      assignee: task.assignee?.name || '未分配',
      createdAt: new Date(task.createdAt).toLocaleString('zh-CN'),
      updatedAt: new Date(task.updatedAt).toLocaleString('zh-CN')
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            total: result.total,
            page: result.page,
            tasks: formatted
          }, null, 2)
        }
      ]
    };
  }
};
```

**src/tools/task-get.ts**
```typescript
import { z } from 'zod';
import { KbTaskApiClient } from '../api/client.js';

export const taskGetTool = {
  name: 'kb_task_get',
  description: '获取指定任务的详细信息，包括完整描述、标签、模块、历史记录等',
  inputSchema: z.object({
    taskId: z.string().describe('任务 ID（_id 或 displayId）')
  }),

  async execute(params: any, apiClient: KbTaskApiClient) {
    const task = await apiClient.getTask(params.taskId);

    // 格式化为 Markdown（类似现有的导出格式）
    const markdown = `
# 任务详情：${task.title}

**任务 ID**: ${task.displayId} (${task._id})
**状态**: ${getStatusLabel(task.status)}
**优先级**: ${getPriorityLabel(task.priority)}
**创建时间**: ${new Date(task.createdAt).toLocaleString('zh-CN')}
**更新时间**: ${new Date(task.updatedAt).toLocaleString('zh-CN')}
${task.assignee ? `**指派人**: ${task.assignee.name}` : ''}
${task.tags?.length ? `**标签**: ${task.tags.map((t: any) => t.name).join(', ')}` : ''}
${task.summary ? `\n**任务摘要**: ${task.summary}\n` : ''}

## 任务描述

${task.content || '(无描述)'}

---

### 元数据（用于更新）
\`\`\`json
{
  "_id": "${task._id}",
  "projectId": "${task.projectId}",
  "status": "${task.status}",
  "priority": "${task.priority}"
}
\`\`\`
    `.trim();

    return {
      content: [
        {
          type: 'text',
          text: markdown
        }
      ]
    };
  }
};

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    'todo': '📝 待办',
    'in_progress': '🔄 进行中',
    'completed': '✅ 已完成',
    'review': '👀 待验收'
  };
  return map[status] || status;
}

function getPriorityLabel(priority: string): string {
  const map: Record<string, string> = {
    'high': '🔴 高',
    'medium': '🟡 中',
    'low': '🟢 低'
  };
  return map[priority] || priority;
}
```

**src/tools/task-update.ts**
```typescript
import { z } from 'zod';
import { KbTaskApiClient } from '../api/client.js';

export const taskUpdateTool = {
  name: 'kb_task_update',
  description: '更新任务的状态、内容、摘要等信息。完成任务后必须调用此工具更新状态！',
  inputSchema: z.object({
    taskId: z.string().describe('任务 ID'),
    status: z.enum(['todo', 'in_progress', 'completed', 'review']).optional().describe('任务状态'),
    priority: z.enum(['low', 'medium', 'high']).optional().describe('优先级'),
    title: z.string().optional().describe('任务标题'),
    content: z.string().optional().describe('任务描述（支持 Markdown）'),
    summary: z.string().max(200).optional().describe('任务摘要（20-50字）'),
    progress: z.number().min(0).max(100).optional().describe('进度百分比'),
    assigneeId: z.string().optional().describe('指派人 ID')
  }),

  async execute(params: any, apiClient: KbTaskApiClient) {
    const { taskId, ...updates } = params;

    const result = await apiClient.updateTask(taskId, updates);

    return {
      content: [
        {
          type: 'text',
          text: `✅ 任务更新成功！\n\n` +
                `任务 ID: ${result.displayId}\n` +
                `标题: ${result.title}\n` +
                `状态: ${result.status}\n` +
                (updates.summary ? `摘要: ${updates.summary}\n` : '') +
                `更新时间: ${new Date(result.updatedAt).toLocaleString('zh-CN')}`
        }
      ]
    };
  }
};
```

**src/tools/task-create.ts**
```typescript
import { z } from 'zod';
import { KbTaskApiClient } from '../api/client.js';

export const taskCreateTool = {
  name: 'kb_task_create',
  description: '在 kb-task 中创建新任务',
  inputSchema: z.object({
    projectId: z.string().describe('项目 ID'),
    title: z.string().min(1).describe('任务标题'),
    content: z.string().optional().describe('任务描述（支持 Markdown）'),
    status: z.enum(['todo', 'in_progress', 'completed', 'review']).default('todo'),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    assigneeId: z.string().optional().describe('指派人 ID'),
    tagIds: z.array(z.string()).optional().describe('标签 ID 列表'),
    dueDate: z.number().optional().describe('截止日期（时间戳）')
  }),

  async execute(params: any, apiClient: KbTaskApiClient) {
    const task = await apiClient.createTask(params);

    return {
      content: [
        {
          type: 'text',
          text: `✅ 任务创建成功！\n\n` +
                `任务 ID: ${task.displayId} (${task._id})\n` +
                `标题: ${task.title}\n` +
                `状态: ${task.status}\n` +
                `优先级: ${task.priority}\n` +
                `创建时间: ${new Date(task.createdAt).toLocaleString('zh-CN')}`
        }
      ]
    };
  }
};
```

**src/tools/task-comment.ts**
```typescript
import { z } from 'zod';
import { KbTaskApiClient } from '../api/client.js';

export const taskCommentTool = {
  name: 'kb_task_comment',
  description: '向任务添加评论，记录进度、问题或反馈',
  inputSchema: z.object({
    taskId: z.string().describe('任务 ID'),
    content: z.string().min(1).describe('评论内容（支持 Markdown）'),
    mentionedUsers: z.array(z.string()).optional().describe('@ 提及的用户 ID 列表')
  }),

  async execute(params: any, apiClient: KbTaskApiClient) {
    const result = await apiClient.addComment(
      params.taskId,
      params.content,
      params.mentionedUsers
    );

    return {
      content: [
        {
          type: 'text',
          text: `✅ 评论添加成功！\n\n` +
                `任务 ID: ${params.taskId}\n` +
                `评论内容: ${params.content.substring(0, 100)}${params.content.length > 100 ? '...' : ''}\n` +
                `时间: ${new Date().toLocaleString('zh-CN')}`
        }
      ]
    };
  }
};
```

---

### 第四步：实现 MCP 服务器主程序

**src/index.ts**
```typescript
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { KbTaskApiClient } from './api/client.js';
import { taskListTool } from './tools/task-list.js';
import { taskGetTool } from './tools/task-get.js';
import { taskCreateTool } from './tools/task-create.js';
import { taskUpdateTool } from './tools/task-update.js';
import { taskCommentTool } from './tools/task-comment.js';

// 配置（从环境变量或配置文件读取）
const KB_TASK_API_URL = process.env.KB_TASK_API_URL || 'http://localhost:3000';
const KB_TASK_API_TOKEN = process.env.KB_TASK_API_TOKEN || '';

// 创建 API 客户端
const apiClient = new KbTaskApiClient(KB_TASK_API_URL, KB_TASK_API_TOKEN);

// 创建 MCP 服务器
const server = new Server(
  {
    name: 'kb-task-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 注册工具
const tools = [
  taskListTool,
  taskGetTool,
  taskCreateTool,
  taskUpdateTool,
  taskCommentTool
];

// 实现 tools/list 方法
server.setRequestHandler('tools/list', async () => {
  return {
    tools: tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }))
  };
});

// 实现 tools/call 方法
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  const tool = tools.find(t => t.name === name);
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }

  try {
    // 执行工具
    const result = await tool.execute(args, apiClient);
    return result;
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ 工具执行失败：${error.message}\n\n` +
                `工具: ${name}\n` +
                `参数: ${JSON.stringify(args, null, 2)}\n` +
                `错误详情: ${error.stack || error}`
        }
      ],
      isError: true
    };
  }
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('kb-task MCP Server 已启动！');
  console.error(`API URL: ${KB_TASK_API_URL}`);
}

main().catch((error) => {
  console.error('启动失败:', error);
  process.exit(1);
});
```

---

### 第五步：配置 Claude Code

**~/.claude/mcp_config.json**（需要创建）
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

或者使用 npm 启动：
```json
{
  "mcpServers": {
    "kb-task": {
      "command": "npx",
      "args": ["-y", "kb-task-mcp"],
      "env": {
        "KB_TASK_API_URL": "http://localhost:3000"
      }
    }
  }
}
```

---

## 📝 使用场景示例

### 场景 1：查看待办任务

**用户输入：**
```
列出项目中所有高优先级的待办任务
```

**Claude Code 自动执行：**
```typescript
// 1. 调用工具
kb_task_list({
  priority: "high",
  status: "todo"
})

// 2. 返回结果
{
  "total": 3,
  "tasks": [
    {
      "id": "task-123",
      "displayId": 45,
      "title": "实现用户登录功能",
      "status": "todo",
      "priority": "high",
      "summary": "(无摘要)",
      "assignee": "未分配"
    },
    // ...
  ]
}

// 3. Claude 输出给用户
找到 3 个高优先级待办任务：

1. #45 - 实现用户登录功能
2. #46 - 修复支付接口异常
3. #47 - 优化数据库查询性能

你想让我处理哪个任务？
```

---

### 场景 2：完成任务并更新

**用户输入：**
```
帮我完成任务 #45
```

**Claude Code 自动执行：**
```typescript
// 1. 获取任务详情
kb_task_get({ taskId: "45" })

// 2. Claude 读取任务描述，开始开发
// - 创建登录表单组件
// - 实现 API 调用
// - 编写测试用例

// 3. 完成后更新任务
kb_task_update({
  taskId: "45",
  status: "completed",
  summary: "实现了用户登录功能，包括表单验证、API 调用、错误处理和记住密码功能",
  progress: 100
})

// 4. 添加评论记录实现细节
kb_task_comment({
  taskId: "45",
  content: `
## 实现细节

- 创建了 LoginForm.vue 组件
- 实现了前端表单验证（非空、格式）
- 调用 /api/auth/login 接口
- 使用 localStorage 存储 token
- 错误提示优化（显示具体错误信息）
- 支持"记住我"功能（7天免登录）

## 测试结果

✅ 单元测试通过（5/5）
✅ 集成测试通过（3/3）
✅ 手动测试正常

## 相关文件

- frontend/src/components/auth/LoginForm.vue
- frontend/src/api/auth.ts
- frontend/src/stores/auth.ts
  `
})

// 5. 发送通知
bash: ./.claude-notify.sh "任务 #45 完成" "用户登录功能已实现并测试通过"
```

---

### 场景 3：批量创建任务

**用户输入：**
```
根据这个 PRD 创建开发任务
[粘贴需求文档]
```

**Claude Code 自动执行：**
```typescript
// 1. 分析需求文档，提取功能点

// 2. 批量创建任务
kb_task_create({
  projectId: "project-abc",
  title: "数据库设计 - 用户表",
  content: "...",
  priority: "high",
  status: "todo"
})

kb_task_create({
  projectId: "project-abc",
  title: "API 接口开发 - 用户 CRUD",
  content: "...",
  priority: "high",
  status: "todo"
})

kb_task_create({
  projectId: "project-abc",
  title: "前端页面 - 用户管理",
  content: "...",
  priority: "medium",
  status: "todo"
})

// 3. 输出结果
✅ 已创建 3 个任务：
1. #48 - 数据库设计 - 用户表
2. #49 - API 接口开发 - 用户 CRUD
3. #50 - 前端页面 - 用户管理

建议按顺序完成，先做数据库设计，再做 API，最后做前端。
```

---

## 🔧 实现步骤总结

### 步骤 1：准备环境（5 分钟）
```bash
cd /Users/achen/Priv/task-banner
mkdir kb-task-mcp
cd kb-task-mcp
npm init -y
npm install @modelcontextprotocol/sdk axios dotenv
npm install -D typescript @types/node tsx
```

### 步骤 2：编写代码（30 分钟）
- 复制上面的代码到对应文件
- 根据实际 API 调整参数

### 步骤 3：测试 API 连接（10 分钟）
```bash
# 启动 kb-task 后端
cd kb-task
kb sync

# 测试 API 是否可访问
curl http://localhost:3000/api/task/list
```

### 步骤 4：构建 MCP 服务器（5 分钟）
```bash
npm run build
```

### 步骤 5：配置 Claude Code（5 分钟）
```bash
# 创建配置目录
mkdir -p ~/.claude

# 编辑配置文件
vim ~/.claude/mcp_config.json
# 粘贴上面的配置
```

### 步骤 6：测试 MCP 工具（10 分钟）
```bash
# 在 Claude Code 中测试
你：列出所有任务

# Claude 应该自动调用 kb_task_list 工具
```

### 步骤 7：实际使用（🎉）
```
你：帮我完成所有高优先级的待办任务，完成后通知我

[离开电脑，做其他事情]

[收到 Bark 推送] ✅ 已完成 5 个高优先级任务
```

---

## 📊 代码结构总览

```
/Users/achen/Priv/task-banner/
├── kb-task/                    # 现有项目
│   ├── frontend/
│   ├── src/
│   └── ...
├── kb-task-mcp/               # 新建：MCP 服务器
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts           # MCP Server 主程序
│   │   ├── api/
│   │   │   └── client.ts      # kb-task API 客户端
│   │   ├── tools/
│   │   │   ├── task-list.ts
│   │   │   ├── task-get.ts
│   │   │   ├── task-create.ts
│   │   │   ├── task-update.ts
│   │   │   └── task-comment.ts
│   │   └── config.ts
│   └── dist/                  # 编译输出
├── .claude-notify.sh          # 通知脚本（已存在）
└── docs/
    └── mcp-server-design.md   # 本文档
```

---

## 🎁 额外功能扩展

### 1. 任务导出工具（复用现有代码）

```typescript
// src/tools/task-export.ts
export const taskExportTool = {
  name: 'kb_task_export',
  description: '导出任务为 Markdown 格式（用于备份或分享）',
  inputSchema: z.object({
    taskIds: z.array(z.string()).describe('任务 ID 列表'),
    format: z.enum(['markdown', 'json']).default('markdown')
  }),

  async execute(params: any, apiClient: KbTaskApiClient) {
    const tasks = await Promise.all(
      params.taskIds.map(id => apiClient.getTask(id))
    );

    if (params.format === 'json') {
      return {
        content: [{ type: 'text', text: JSON.stringify(tasks, null, 2) }]
      };
    }

    // 复用现有的 exportTasksToMarkdown 逻辑
    const markdown = exportTasksToMarkdown(tasks);

    return {
      content: [{ type: 'text', text: markdown }]
    };
  }
};
```

### 2. 任务导入工具

```typescript
// src/tools/task-import.ts
export const taskImportTool = {
  name: 'kb_task_import',
  description: '从 Markdown 或 JSON 批量导入/更新任务',
  inputSchema: z.object({
    content: z.string().describe('任务内容（Markdown 或 JSON 格式）'),
    projectId: z.string().describe('目标项目 ID')
  }),

  async execute(params: any, apiClient: KbTaskApiClient) {
    let tasks: any[];

    // 智能识别格式
    try {
      tasks = JSON.parse(params.content);
    } catch {
      tasks = importTasksFromMarkdown(params.content, params.projectId);
    }

    // 批量创建/更新
    const results = await Promise.all(
      tasks.map(async task => {
        if (task._id) {
          // 尝试更新
          try {
            return await apiClient.updateTask(task._id, task);
          } catch {
            // 不存在则创建
            return await apiClient.createTask(task);
          }
        } else {
          return await apiClient.createTask(task);
        }
      })
    );

    return {
      content: [{
        type: 'text',
        text: `✅ 成功导入 ${results.length} 个任务`
      }]
    };
  }
};
```

### 3. 智能任务建议

```typescript
// src/tools/task-suggest.ts
export const taskSuggestTool = {
  name: 'kb_task_suggest',
  description: '根据项目上下文智能建议下一步任务',
  inputSchema: z.object({
    projectId: z.string().describe('项目 ID')
  }),

  async execute(params: any, apiClient: KbTaskApiClient) {
    // 1. 获取项目所有任务
    const allTasks = await apiClient.listTasks({
      projectId: params.projectId,
      size: 100
    });

    // 2. 分析任务状态
    const stats = {
      todo: allTasks.items.filter((t: any) => t.status === 'todo').length,
      inProgress: allTasks.items.filter((t: any) => t.status === 'in_progress').length,
      completed: allTasks.items.filter((t: any) => t.status === 'completed').length
    };

    // 3. 智能建议
    let suggestion = '';

    if (stats.inProgress > 5) {
      suggestion = '⚠️ 当前有 ' + stats.inProgress + ' 个任务进行中，建议先完成部分任务再开始新任务';
    } else if (stats.todo === 0) {
      suggestion = '✅ 所有任务已处理！可以规划下一个迭代了';
    } else {
      // 找到优先级最高的待办任务
      const highPriorityTasks = allTasks.items.filter(
        (t: any) => t.status === 'todo' && t.priority === 'high'
      );

      if (highPriorityTasks.length > 0) {
        suggestion = `建议优先处理以下高优先级任务：\n\n` +
          highPriorityTasks.slice(0, 3).map((t: any) =>
            `- #${t.displayId}: ${t.title}`
          ).join('\n');
      }
    }

    return {
      content: [{
        type: 'text',
        text: `## 项目任务概览\n\n` +
              `- 待办: ${stats.todo}\n` +
              `- 进行中: ${stats.inProgress}\n` +
              `- 已完成: ${stats.completed}\n\n` +
              `## 建议\n\n${suggestion}`
      }]
    };
  }
};
```

---

## 🚀 下一步

1. **立即开始**：按照上面的步骤创建 MCP 服务器
2. **测试验证**：在 Claude Code 中测试工具调用
3. **优化迭代**：根据实际使用体验调整
4. **扩展功能**：添加更多自动化工具

---

## ❓ 常见问题

### Q1: MCP 服务器需要一直运行吗？
A: 不需要。MCP 服务器由 Claude Code 按需启动，不使用时自动关闭。

### Q2: 如果 kb-task API 需要认证怎么办？
A: 在配置文件中添加 `KB_TASK_API_TOKEN` 环境变量，API 客户端会自动添加到请求头。

### Q3: 能同时连接多个项目吗？
A: 可以！在 `mcp_config.json` 中配置多个 MCP 服务器即可。

### Q4: 性能如何？
A: 每次工具调用约 100-500ms（取决于网络和数据库查询），比手动复制粘贴快 10 倍以上。

### Q5: 如何调试 MCP 工具？
A: 查看 Claude Code 的日志输出，或在 MCP 服务器代码中添加 `console.error()` 语句。

---

## 📚 参考资料

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [Claude Code 文档](https://docs.claude.com/claude-code)
- [kb-task API 文档](../kb-task/README.md)

---

**文档版本**: 1.0.0
**最后更新**: 2025-01-XX
**作者**: Claude Code
