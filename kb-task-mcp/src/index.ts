#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { KbTaskApiClient } from './api/client.js';
import { taskListTool } from './tools/task-list.js';
import { taskGetTool } from './tools/task-get.js';
import { taskCreateTool } from './tools/task-create.js';
import { taskUpdateTool } from './tools/task-update.js';
import { taskCommentTool } from './tools/task-comment.js';
import { documentListTool } from './tools/document-list.js';
import { documentGetTool } from './tools/document-get.js';
import { documentCreateTool } from './tools/document-create.js';
import { documentUpdateTool } from './tools/document-update.js';
import { documentDeleteTool } from './tools/document-delete.js';

// 辅助函数：将 Zod schema 转换为符合 MCP 协议的 JSON Schema
function zodToMcpSchema(zodSchema: any): any {
  try {
    // 手动从 Zod schema 提取信息
    // shape 可能是一个函数或对象
    const shapeDef = zodSchema._def?.shape;
    const shape = typeof shapeDef === 'function' ? shapeDef() : shapeDef;
    
    if (!shape) {
      return {
        type: 'object',
        properties: {}
      };
    }
    
    const properties: any = {};
    const required: string[] = [];
    
    // 遍历所有字段
    for (const [key, zodField] of Object.entries(shape)) {
      const field = zodField as any;
      const zodDef = field._def;
      const fieldSchema: any = {};
      
      // 判断字段类型 - 需要递归处理 Optional、Default 等包装类型
      let isOptional = false;
      let actualType = zodDef;
      let description: string | undefined;
      
      // 递归解包，处理 ZodOptional, ZodDefault 等包装类型
      // 新版本 Zod 使用 typeName，旧版本可能使用 type
      while (actualType && (actualType.typeName || actualType.type)) {
        const typeName = actualType.typeName || (actualType.type === 'optional' ? 'ZodOptional' : 
                                                 actualType.type === 'default' ? 'ZodDefault' : null);
        
        if (typeName === 'ZodOptional' || actualType.type === 'optional') {
          isOptional = true;
          actualType = actualType.innerType?._def || actualType.innerType;
        } else if (typeName === 'ZodDefault' || actualType.type === 'default') {
          // 处理默认值
          if (actualType.defaultValue) {
            try {
              fieldSchema.default = typeof actualType.defaultValue === 'function' 
                ? actualType.defaultValue() 
                : actualType.defaultValue;
            } catch (e) {
              // 忽略默认值错误
            }
          }
          actualType = actualType.innerType?._def || actualType.innerType;
        } else {
          // 遇到基础类型，停止解包
          break;
        }
      }
      
      // 提取描述信息 - 从实际类型中获取
      if (actualType?.description) {
        description = actualType.description;
      } else if (zodDef?.description) {
        description = zodDef.description;
      }
      
      // 设置类型和属性
      // 新版本 Zod: 使用 _def.type，旧版本: 使用 _def.typeName
      const typeName = actualType?.typeName;
      const typeValue = actualType?.type;
      
      if (typeName === 'ZodString' || typeValue === 'string') {
        fieldSchema.type = 'string';
        // 添加字符串约束
        if (actualType.checks) {
          for (const check of actualType.checks) {
            if (check.kind === 'min') {
              fieldSchema.minLength = check.value;
            } else if (check.kind === 'max') {
              fieldSchema.maxLength = check.value;
            }
          }
        }
      } else if (typeName === 'ZodNumber' || typeValue === 'number') {
        fieldSchema.type = 'number';
        // 添加数字约束
        if (actualType.checks) {
          for (const check of actualType.checks) {
            if (check.kind === 'min') {
              fieldSchema.minimum = check.value;
            } else if (check.kind === 'max') {
              fieldSchema.maximum = check.value;
            }
          }
        }
      } else if (typeName === 'ZodBoolean' || typeValue === 'boolean') {
        fieldSchema.type = 'boolean';
      } else if (typeName === 'ZodArray' || typeValue === 'array') {
        fieldSchema.type = 'array';
        const itemType = actualType.type?._def || actualType.type;
        const itemTypeName = itemType?.typeName;
        const itemTypeValue = itemType?.type;
        if (itemTypeName === 'ZodString' || itemTypeValue === 'string') {
          fieldSchema.items = { type: 'string' };
        } else {
          fieldSchema.items = {};
        }
      } else if (typeName === 'ZodEnum' || typeValue === 'enum') {
        fieldSchema.type = 'string';
        // 新版本 Zod 使用 entries，旧版本使用 values
        if (actualType.entries) {
          // 新版本：entries 是对象，提取键或值
          fieldSchema.enum = Object.keys(actualType.entries);
        } else if (actualType.values) {
          // 旧版本：values 是数组
          fieldSchema.enum = actualType.values;
        }
      } else if (typeName === 'ZodRecord' || typeValue === 'record') {
        fieldSchema.type = 'object';
        fieldSchema.additionalProperties = true;
      }
      
      // 设置描述
      if (description) {
        fieldSchema.description = description;
      }
      
      properties[key] = fieldSchema;
      
      // 如果不是可选字段，添加到 required
      if (!isOptional) {
        required.push(key);
      }
    }
    
    const result: any = {
      type: 'object',
      properties
    };
    
    if (required.length > 0) {
      result.required = required;
    }
    
    return result;
  } catch (error) {
    // 如果转换失败，返回一个基本的 object schema
    console.error('Error converting Zod schema to JSON Schema:', error);
    return {
      type: 'object',
      properties: {}
    };
  }
}

// 从环境变量读取配置
const KB_TASK_API_URL = process.env.KB_TASK_API_URL || 'https://ai_task_manage.redev.cn';
const KB_TASK_API_TOKEN = process.env.KB_TASK_API_TOKEN || '';
const KB_TASK_DEFAULT_PROJECT_ID = process.env.KB_TASK_DEFAULT_PROJECT_ID || '';

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

// 注册所有工具
const tools = [
  taskListTool,
  taskGetTool,
  taskCreateTool,
  taskUpdateTool,
  taskCommentTool,
  documentListTool,
  documentGetTool,
  documentCreateTool,
  documentUpdateTool,
  documentDeleteTool
];

// 实现 tools/list 方法：返回可用工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => {
  try {
    const toolList = tools.map(tool => {
      try {
        const inputSchema = zodToMcpSchema(tool.inputSchema);
        // 确保 schema 是有效的对象
        if (!inputSchema || typeof inputSchema !== 'object') {
          console.error(`Invalid schema for tool ${tool.name}, using fallback`);
          return {
            name: tool.name,
            description: tool.description,
            inputSchema: {
              type: 'object',
              properties: {}
            }
          };
        }
        return {
          name: tool.name,
          description: tool.description,
          inputSchema
        };
      } catch (error) {
        console.error(`Error processing tool ${tool.name}:`, error);
        return {
          name: tool.name,
          description: tool.description,
          inputSchema: {
            type: 'object',
            properties: {}
          }
        };
      }
    });
    
    return { tools: toolList };
  } catch (error) {
    console.error('Error in tools/list handler:', error);
    // 即使出错也返回工具列表（使用基本 schema）
    return {
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }))
    };
  }
});

// 实现 tools/call 方法：执行工具
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const tool = tools.find(t => t.name === name);
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }

  try {
    // 如果工具需要 projectId 但没有提供，且配置了默认 projectId，则自动注入
    const finalArgs = { ...args } as any;
    if (KB_TASK_DEFAULT_PROJECT_ID && 
        (name === 'kb_task_list' || name === 'kb_task_create') &&
        !finalArgs.projectId) {
      finalArgs.projectId = KB_TASK_DEFAULT_PROJECT_ID;
    }

    // 执行工具
    const result = await tool.execute(finalArgs, apiClient);
    return result;
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ 工具执行失败：${error.message}\n\n` +
                `工具: ${name}\n` +
                `参数: ${JSON.stringify(args, null, 2)}\n` +
                (error.stack ? `错误详情: ${error.stack}` : '')
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

  // 日志输出到 stderr（不会干扰 MCP 协议通信）
  console.error('kb-task MCP Server 已启动！');
  console.error(`API URL: ${KB_TASK_API_URL}`);
  console.error(`API Token: ${KB_TASK_API_TOKEN ? '已设置' : '未设置'}`);
  console.error(`默认项目 ID: ${KB_TASK_DEFAULT_PROJECT_ID || '未设置'}`);
}

main().catch((error) => {
  console.error('启动失败:', error);
  process.exit(1);
});
