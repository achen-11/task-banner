import { z } from 'zod';
import { KbTaskApiClient } from '../api/client.js';

interface Tool {
  name: string;
  description: string;
  inputSchema: z.ZodObject<any>;
  execute: (params: any, apiClient: KbTaskApiClient) => Promise<any>;
}

export const taskListTool: Tool = {
  name: 'kb_task_list',
  description: '获取任务列表，支持按项目、状态、优先级、指派人等条件筛选。返回分页结果。\n\n状态筛选值必须是：todo（待办）、in_progress（进行中）、completed（已完成）、review（待验收）。优先级筛选值必须是：low（低）、medium（中）、high（高）、urgent（紧急）。',
  inputSchema: z.object({
    projectId: z.string().optional().describe('项目 ID（可选，如未提供将使用默认项目）'),
    moduleId: z.string().optional().describe('模块 ID（可选）'),
    status: z.enum(['todo', 'in_progress', 'completed', 'review']).optional().describe('任务状态筛选。可选值：todo（待办）、in_progress（进行中）、completed（已完成）、review（待验收）。注意：完成状态使用 "completed"，不是 "done"。'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().describe('优先级筛选。可选值：low（低）、medium（中）、high（高）、urgent（紧急）'),
    assigneeId: z.string().optional().describe('指派人用户 ID'),
    page: z.number().default(1).describe('页码（从1开始）'),
    size: z.number().default(20).describe('每页数量'),
    sortField: z.string().optional().describe('排序字段（如：createdAt, updatedAt, displayId, priority, status）'),
    sortDirection: z.enum(['asc', 'desc']).optional().describe('排序方向')
  }),

  async execute(params: any, apiClient: KbTaskApiClient) {
    // 确保 projectId 存在
    if (!params.projectId) {
      throw new Error('projectId 是必需的。请在参数中提供 projectId，或在 MCP 配置中设置 KB_TASK_DEFAULT_PROJECT_ID');
    }
    
    const result = await apiClient.listTasks(params);

    // 检查 API 响应格式
    if (result.code !== 200) {
      throw new Error(result.message || 'Failed to get task list');
    }

    const tasks = result.data?.items || [];
    const total = result.data?.total || 0;
    const page = result.data?.page || params.page;
    const size = result.data?.size || params.size;

    // 格式化输出，便于 AI 阅读
    const formatted = tasks.map((task: any) => ({
      id: task._id,
      displayId: task.displayId,
      title: task.title,
      status: task.status,
      priority: task.priority,
      summary: task.summary || '',
      assignee: task.assignee?.displayName || task.assignee?.username || '未分配',
      creator: task.creator?.displayName || task.creator?.username || '未知',
      progress: task.progress || 0,
      createdAt: new Date(task.createdAt).toLocaleString('zh-CN'),
      updatedAt: new Date(task.updatedAt).toLocaleString('zh-CN'),
      tagIds: task.tagIds || [],
      moduleIds: task.moduleIds || []
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            total,
            page,
            size,
            tasks: formatted
          }, null, 2)
        }
      ]
    };
  }
};
