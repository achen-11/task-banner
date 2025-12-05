import { z } from 'zod';
import { KbTaskApiClient } from '../api/client.js';

interface Tool {
  name: string;
  description: string;
  inputSchema: z.ZodObject<any>;
  execute: (params: any, apiClient: KbTaskApiClient) => Promise<any>;
}

export const documentCreateTool: Tool = {
  name: 'kb_document_create',
  description: '在指定项目中创建新文档。可以设置标题、内容、类型、标签、状态等。\n\n状态值：draft（草稿，默认）、published（已发布）、archived（已归档）。类型值：markdown（Markdown，默认）、text（纯文本）。',
  inputSchema: z.object({
    projectId: z.string().describe('项目 ID（必填）'),
    title: z.string().min(1).describe('文档标题（必填）'),
    content: z.string().optional().describe('文档内容（支持 Markdown）'),
    type: z.enum(['markdown', 'text']).default('markdown').describe('文档类型。可选值：markdown（Markdown，默认）、text（纯文本）'),
    tags: z.array(z.string()).optional().describe('标签列表'),
    status: z.enum(['draft', 'published', 'archived']).default('draft').describe('文档状态。可选值：draft（草稿，默认）、published（已发布）、archived（已归档）')
  }),

  async execute(params: any, apiClient: KbTaskApiClient) {
    if (!params.projectId) {
      throw new Error('projectId 是必需的');
    }
    
    if (!params.title || params.title.trim() === '') {
      throw new Error('title 是必需的');
    }
    
    const result = await apiClient.createDocument(params);

    // 检查 API 响应格式
    if (result.code !== 200) {
      throw new Error(result.message || 'Failed to create document');
    }

    const doc = result.data;

    return {
      content: [
        {
          type: 'text',
          text: `✅ 文档创建成功！\n\n` +
                `文档 ID: ${doc._id}\n` +
                `标题: ${doc.title}\n` +
                `类型: ${doc.type || 'markdown'}\n` +
                `状态: ${doc.status || 'draft'}\n` +
                `版本: ${doc.version || 1}\n` +
                `标签: ${(doc.tags || []).join(', ') || '无'}\n` +
                `创建时间: ${new Date(doc.createdAt).toLocaleString('zh-CN')}\n` +
                `项目 ID: ${doc.projectId}`
        }
      ]
    };
  }
};
