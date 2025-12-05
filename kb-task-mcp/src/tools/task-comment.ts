import { z } from 'zod';
import { KbTaskApiClient } from '../api/client.js';

interface Tool {
  name: string;
  description: string;
  inputSchema: z.ZodObject<any>;
  execute: (params: any, apiClient: KbTaskApiClient) => Promise<any>;
}

export const taskCommentTool: Tool = {
  name: 'kb_task_comment',
  description: '向任务添加评论，记录进度、问题或反馈。支持 Markdown 格式。可以标记为 AI 完成评论（type: "ai_completion"）。',
  inputSchema: z.object({
    taskId: z.string().describe('任务 ID（_id）'),
    content: z.string().min(1).describe('评论内容（支持 Markdown）'),
    summary: z.string().optional().describe('评论摘要（用于快速预览）'),
    type: z.enum(['user', 'ai_completion', 'ai_revision', 'system']).default('user').describe('评论类型'),
    mentionedUsers: z.array(z.string()).optional().describe('@ 提及的用户 ID 列表'),
    metadata: z.record(z.string(), z.any()).optional().describe('元数据（用于存储额外信息）')
  }),

  async execute(params: any, apiClient: KbTaskApiClient) {
    const taskId = String(params.taskId || '');
    const content = String(params.content || '');
    
    const result = await apiClient.addComment(taskId, content, {
      summary: params.summary,
      type: params.type,
      mentionedUsers: params.mentionedUsers,
      metadata: params.metadata
    });

    // 检查 API 响应格式
    if (result.code !== 200) {
      throw new Error(result.message || 'Failed to add comment');
    }

    const comment = result.data;

    return {
      content: [
        {
          type: 'text',
          text: `✅ 评论添加成功！\n\n` +
                `任务 ID: ${params.taskId}\n` +
                `评论 ID: ${comment.id}\n` +
                `类型: ${comment.type}\n` +
                `内容: ${params.content.substring(0, 100)}${params.content.length > 100 ? '...' : ''}\n` +
                `时间: ${new Date(comment.timestamp).toLocaleString('zh-CN')}`
        }
      ]
    };
  }
};
