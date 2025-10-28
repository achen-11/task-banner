import { KbTaskApiClient } from '../api/client.js';

export const taskCommentTool = {
  name: 'kb_task_comment',
  description: '向任务添加评论，记录进度、问题、反馈或实现细节。建议在完成任务后添加评论记录详细的实现过程。',
  inputSchema: {
    type: 'object',
    properties: {
      taskId: {
        type: 'string',
        description: '任务 ID（必填）'
      },
      content: {
        type: 'string',
        description: '评论内容（支持 Markdown 格式，必填）'
      },
      mentionedUsers: {
        type: 'array',
        items: { type: 'string' },
        description: '@ 提及的用户 ID 列表'
      }
    },
    required: ['taskId', 'content']
  },

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
