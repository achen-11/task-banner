import { z } from 'zod';
import { KbTaskApiClient } from '../api/client.js';

interface Tool {
  name: string;
  description: string;
  inputSchema: z.ZodObject<any>;
  execute: (params: any, apiClient: KbTaskApiClient) => Promise<any>;
}

export const documentUpdateTool: Tool = {
  name: 'kb_document_update',
  description: '更新文档信息，包括标题、内容、状态、标签、排序等。更新内容或标题时会自动创建新版本。',
  inputSchema: z.object({
    documentId: z.string().describe('文档 ID（必填）'),
    title: z.string().optional().describe('文档标题'),
    content: z.string().optional().describe('文档内容（支持 Markdown）'),
    status: z.enum(['draft', 'published', 'archived']).optional().describe('文档状态。可选值：draft（草稿）、published（已发布）、archived（已归档）'),
    tags: z.array(z.string()).optional().describe('标签列表'),
    order: z.number().optional().describe('排序值（数字越大越靠前）'),
    changeLog: z.string().optional().describe('变更说明（用于版本记录）')
  }),

  async execute(params: any, apiClient: KbTaskApiClient) {
    if (!params.documentId) {
      throw new Error('documentId 是必需的');
    }
    
    const { documentId, ...updates } = params;
    
    const result = await apiClient.updateDocument(documentId, updates);

    // 检查 API 响应格式
    if (result.code !== 200) {
      throw new Error(result.message || 'Failed to update document');
    }

    const doc = result.data;

    return {
      content: [
        {
          type: 'text',
          text: `✅ 文档更新成功！\n\n` +
                `文档 ID: ${doc._id}\n` +
                `标题: ${doc.title}\n` +
                `类型: ${doc.type || 'markdown'}\n` +
                `状态: ${doc.status || 'draft'}\n` +
                `版本: ${doc.version || 1}\n` +
                `标签: ${(doc.tags || []).join(', ') || '无'}\n` +
                `更新时间: ${new Date(doc.updatedAt).toLocaleString('zh-CN')}`
        }
      ]
    };
  }
};
