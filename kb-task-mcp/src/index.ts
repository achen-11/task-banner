#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { KbTaskApiClient } from './api/client.js';
import { taskListTool } from './tools/task-list.js';
import { taskGetTool } from './tools/task-get.js';
import { taskCreateTool } from './tools/task-create.js';
import { taskUpdateTool } from './tools/task-update.js';
import { taskCommentTool } from './tools/task-comment.js';

// 从环境变量读取配置
const KB_TASK_API_URL = process.env.KB_TASK_API_URL || 'http://localhost:3000';
const KB_TASK_API_TOKEN = process.env.KB_TASK_API_TOKEN || '';

// 创建 API 客户端
const apiClient = new KbTaskApiClient(KB_TASK_API_URL, KB_TASK_API_TOKEN);

// 注册所有工具
const tools = [
  taskListTool,
  taskGetTool,
  taskCreateTool,
  taskUpdateTool,
  taskCommentTool
];

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

// 实现 tools/list 方法
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }))
  };
});

// 实现 tools/call 方法
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const tool = tools.find(t => t.name === name);
  if (!tool) {
    return {
      content: [
        {
          type: 'text',
          text: `错误：未找到工具 "${name}"`
        }
      ],
      isError: true
    };
  }

  try {
    // 执行工具
    const result = await tool.execute(args || {}, apiClient);
    return result;
  } catch (error: any) {
    // 错误处理
    const errorMessage = error.response?.data?.message || error.message || '未知错误';
    const statusCode = error.response?.status;

    return {
      content: [
        {
          type: 'text',
          text: `❌ 工具执行失败：${errorMessage}\n\n` +
                `工具: ${name}\n` +
                `参数: ${JSON.stringify(args, null, 2)}\n` +
                (statusCode ? `HTTP 状态码: ${statusCode}\n` : '') +
                `\n提示：请检查参数是否正确，API 服务是否正常运行。`
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

  // 输出到 stderr，不会影响 MCP 协议通信
  console.error('kb-task MCP Server 已启动！');
  console.error(`API URL: ${KB_TASK_API_URL}`);
  console.error(`已注册 ${tools.length} 个工具：`);
  tools.forEach(tool => {
    console.error(`  - ${tool.name}: ${tool.description}`);
  });
}

main().catch((error) => {
  console.error('启动失败:', error);
  process.exit(1);
});
