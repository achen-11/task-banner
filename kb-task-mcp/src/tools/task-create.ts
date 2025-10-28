import { KbTaskApiClient } from '../api/client.js';

export const taskCreateTool = {
  name: 'kb_task_create',
  description: '在 kb-task 中创建新任务。当用户要求创建任务、添加任务时使用。',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: '项目 ID（必填）'
      },
      title: {
        type: 'string',
        description: '任务标题（必填）'
      },
      content: {
        type: 'string',
        description: '任务描述（支持 Markdown 格式）'
      },
      status: {
        type: 'string',
        enum: ['todo', 'in_progress', 'completed', 'review'],
        description: '任务状态，默认为 todo'
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: '优先级，默认为 medium'
      },
      assigneeId: {
        type: 'string',
        description: '指派人 ID'
      },
      tagIds: {
        type: 'array',
        items: { type: 'string' },
        description: '标签 ID 列表'
      },
      dueDate: {
        type: 'number',
        description: '截止日期（时间戳）'
      }
    },
    required: ['projectId', 'title']
  },

  async execute(params: any, apiClient: KbTaskApiClient) {
    const task = await apiClient.createTask(params);

    return {
      content: [
        {
          type: 'text',
          text: `✅ 任务创建成功！\n\n` +
                `任务 ID: #${task.displayId} (${task._id})\n` +
                `标题: ${task.title}\n` +
                `状态: ${task.status}\n` +
                `优先级: ${task.priority}\n` +
                `创建时间: ${new Date(task.createdAt).toLocaleString('zh-CN')}\n\n` +
                `你可以使用 kb_task_get 工具查看详情，或使用 kb_task_update 工具更新任务。`
        }
      ]
    };
  }
};
