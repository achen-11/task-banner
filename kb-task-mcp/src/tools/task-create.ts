import { z } from 'zod';
import { KbTaskApiClient } from '../api/client.js';

interface Tool {
  name: string;
  description: string;
  inputSchema: z.ZodObject<any>;
  execute: (params: any, apiClient: KbTaskApiClient) => Promise<any>;
}

export const taskCreateTool: Tool = {
  name: 'kb_task_create',
  description: '在指定项目中创建新任务。可以设置标题、内容、状态、优先级、指派人、标签、模块等。\n\n状态值必须是：todo（待办）、in_progress（进行中）、completed（已完成）、review（待验收）。优先级值必须是：low（低）、medium（中）、high（高）、urgent（紧急）。',
  inputSchema: z.object({
    projectId: z.string().optional().describe('项目 ID（可选，如未提供将使用默认项目）'),
    title: z.string().min(1).describe('任务标题（必填）'),
    content: z.string().optional().describe('任务描述（支持 Markdown）'),
    status: z.enum(['todo', 'in_progress', 'completed', 'review']).default('todo').describe('任务状态。可选值：todo（待办，默认）、in_progress（进行中）、completed（已完成）、review（待验收）。注意：完成状态使用 "completed"，不是 "done"。'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium').describe('优先级。可选值：low（低）、medium（中，默认）、high（高）、urgent（紧急）'),
    assigneeId: z.string().optional().describe('指派人用户 ID'),
    moduleIds: z.array(z.string()).optional().describe('模块 ID 列表'),
    tagIds: z.array(z.string()).optional().describe('标签 ID 列表'),
    dueDate: z.number().optional().describe('截止日期（Unix 时间戳，毫秒）'),
    progress: z.number().min(0).max(100).optional().describe('进度百分比（0-100）'),
    summary: z.string().max(200).optional().describe('任务摘要（20-50字，用于快速预览）')
  }),

  async execute(params: any, apiClient: KbTaskApiClient) {
    // 确保 projectId 存在
    if (!params.projectId) {
      throw new Error('projectId 是必需的。请在参数中提供 projectId，或在 MCP 配置中设置 KB_TASK_DEFAULT_PROJECT_ID');
    }
    
    const result = await apiClient.createTask(params);

    // 检查 API 响应格式
    if (result.code !== 200) {
      throw new Error(result.message || 'Failed to create task');
    }

    const task = result.data;

    return {
      content: [
        {
          type: 'text',
          text: `✅ 任务创建成功！\n\n` +
                `任务 ID: #${task.displayId} (${task._id})\n` +
                `标题: ${task.title}\n` +
                `状态: ${task.status}\n` +
                `优先级: ${task.priority}\n` +
                `创建时间: ${new Date(task.createdAt).toLocaleString('zh-CN')}\n` +
                `项目 ID: ${task.projectId}`
        }
      ]
    };
  }
};
