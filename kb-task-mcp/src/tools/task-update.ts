import { KbTaskApiClient } from '../api/client.js';

export const taskUpdateTool = {
  name: 'kb_task_update',
  description: '更新任务的状态、内容、摘要等信息。完成任务后必须调用此工具更新状态为 completed，并添加任务摘要（20-50字）记录完成情况！',
  inputSchema: {
    type: 'object',
    properties: {
      taskId: {
        type: 'string',
        description: '任务 ID（必填）'
      },
      status: {
        type: 'string',
        enum: ['todo', 'in_progress', 'completed', 'review'],
        description: '任务状态'
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: '优先级'
      },
      title: {
        type: 'string',
        description: '任务标题'
      },
      content: {
        type: 'string',
        description: '任务描述（支持 Markdown）'
      },
      summary: {
        type: 'string',
        description: '任务摘要（20-50字，用于记录任务的关键信息或完成情况）'
      },
      progress: {
        type: 'number',
        description: '进度百分比（0-100）'
      },
      assigneeId: {
        type: 'string',
        description: '指派人 ID'
      }
    },
    required: ['taskId']
  },

  async execute(params: any, apiClient: KbTaskApiClient) {
    const { taskId, ...updates } = params;

    const result = await apiClient.updateTask(taskId, updates);

    return {
      content: [
        {
          type: 'text',
          text: `✅ 任务更新成功！\n\n` +
                `任务 ID: #${result.displayId}\n` +
                `标题: ${result.title}\n` +
                `状态: ${result.status}\n` +
                (updates.summary ? `摘要: ${updates.summary}\n` : '') +
                (updates.progress !== undefined ? `进度: ${updates.progress}%\n` : '') +
                `更新时间: ${new Date(result.updatedAt).toLocaleString('zh-CN')}`
        }
      ]
    };
  }
};
