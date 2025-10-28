import { KbTaskApiClient } from '../api/client.js';

export const taskListTool = {
  name: 'kb_task_list',
  description: '获取 kb-task 中的任务列表，支持按项目、状态、优先级等筛选。如果用户说"列出所有任务"、"查看待办任务"等，应该使用这个工具。',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: '项目 ID（可选）'
      },
      status: {
        type: 'string',
        enum: ['todo', 'in_progress', 'completed', 'review'],
        description: '任务状态：todo(待办), in_progress(进行中), completed(已完成), review(待验收)'
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: '优先级：low(低), medium(中), high(高)'
      },
      assigneeId: {
        type: 'string',
        description: '指派人 ID'
      },
      page: {
        type: 'number',
        description: '页码，默认 1'
      },
      size: {
        type: 'number',
        description: '每页数量，默认 20'
      }
    }
  },

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
      tags: task.tags?.map((t: any) => t.name).join(', ') || '无',
      createdAt: new Date(task.createdAt).toLocaleString('zh-CN'),
      updatedAt: new Date(task.updatedAt).toLocaleString('zh-CN')
    }));

    return {
      content: [
        {
          type: 'text',
          text: `找到 ${result.total} 个任务（当前显示第 ${result.page} 页）：\n\n` +
                JSON.stringify(formatted, null, 2)
        }
      ]
    };
  }
};
