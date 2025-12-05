import { z } from 'zod';
import { KbTaskApiClient } from '../api/client.js';

interface Tool {
  name: string;
  description: string;
  inputSchema: z.ZodObject<any>;
  execute: (params: any, apiClient: KbTaskApiClient) => Promise<any>;
}

export const taskUpdateTool: Tool = {
  name: 'kb_task_update',
  description: '更新任务的信息，包括状态、内容、优先级、指派人、标签、模块等。完成任务后必须调用此工具更新状态！\n\n重要：状态值必须是以下之一：todo（待办）、in_progress（进行中）、completed（已完成）、review（待验收）。不要使用其他值如 "done"、"finished" 等。',
  inputSchema: z.object({
    taskId: z.string().describe('任务 ID（_id），完整的 UUID 字符串'),
    title: z.string().optional().describe('任务标题'),
    content: z.string().optional().describe('任务描述（支持 Markdown）'),
    status: z.enum(['todo', 'in_progress', 'completed', 'review']).optional().describe('任务状态。必须是以下值之一：todo（待办）、in_progress（进行中）、completed（已完成）、review（待验收）。注意：完成状态使用 "completed"，不是 "done" 或其他值。'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().describe('优先级。必须是以下值之一：low（低）、medium（中）、high（高）、urgent（紧急）'),
    assigneeId: z.string().optional().describe('指派人用户 ID（设为空字符串可取消指派）'),
    moduleIds: z.array(z.string()).optional().describe('模块 ID 列表（会完全替换现有模块）'),
    tagIds: z.array(z.string()).optional().describe('标签 ID 列表（会完全替换现有标签）'),
    dueDate: z.number().optional().describe('截止日期（Unix 时间戳，毫秒，设为 0 可清除）'),
    progress: z.number().min(0).max(100).optional().describe('进度百分比（0-100）'),
    summary: z.string().max(200).optional().describe('任务摘要（20-50字）')
  }),

  async execute(params: any, apiClient: KbTaskApiClient) {
    const taskId = params.taskId as string;
    const { taskId: _, ...updates } = params;

    // 验证状态值
    if (updates.status !== undefined) {
      const validStatuses = ['todo', 'in_progress', 'completed', 'review'];
      if (!validStatuses.includes(updates.status)) {
        throw new Error(`无效的状态值: "${updates.status}"。必须是以下值之一: ${validStatuses.join(', ')}。注意：完成状态使用 "completed"，不是 "done"。`);
      }
    }

    // 验证优先级值
    if (updates.priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(updates.priority)) {
        throw new Error(`无效的优先级值: "${updates.priority}"。必须是以下值之一: ${validPriorities.join(', ')}`);
      }
    }

    const result = await apiClient.updateTask(taskId, updates);

    // 检查 API 响应格式
    if (result.code !== 200) {
      throw new Error(result.message || 'Failed to update task');
    }

    const task = result.data;

    const updateSummary = Object.keys(updates)
      .filter(key => updates[key as keyof typeof updates] !== undefined)
      .map(key => {
        const value = updates[key as keyof typeof updates];
        if (key === 'status') {
          const statusMap: Record<string, string> = {
            'todo': '📝 待办',
            'in_progress': '🔄 进行中',
            'completed': '✅ 已完成',
            'review': '👀 待验收'
          };
          return `${key}: ${statusMap[value as string] || value}`;
        }
        return `${key}: ${value}`;
      })
      .join(', ');

    return {
      content: [
        {
          type: 'text',
          text: `✅ 任务更新成功！\n\n` +
                `任务 ID: #${task.displayId} (${task._id})\n` +
                `标题: ${task.title}\n` +
                (updateSummary ? `更新内容: ${updateSummary}\n` : '') +
                `更新时间: ${new Date(task.updatedAt).toLocaleString('zh-CN')}`
        }
      ]
    };
  }
};
