import { z } from 'zod';
import { KbTaskApiClient } from '../api/client.js';

interface Tool {
  name: string;
  description: string;
  inputSchema: z.ZodObject<any>;
  execute: (params: any, apiClient: KbTaskApiClient) => Promise<any>;
}

export const documentGetTool: Tool = {
  name: 'kb_document_get',
  description: '获取指定文档的详细信息，包括完整内容、版本信息、创建者和更新者信息等。',
  inputSchema: z.object({
    documentId: z.string().describe('文档 ID（必填）')
  }),

  async execute(params: any, apiClient: KbTaskApiClient) {
    if (!params.documentId) {
      throw new Error('documentId 是必需的');
    }
    
    const result = await apiClient.getDocument(params.documentId);

    // 检查 API 响应格式
    if (result.code !== 200) {
      throw new Error(result.message || 'Failed to get document');
    }

    const doc = result.data;

    // 格式化输出
    const formatted = {
      id: doc._id,
      title: doc.title,
      content: doc.content || '',
      projectId: doc.projectId,
      type: doc.type || 'markdown',
      status: doc.status || 'draft',
      version: doc.version || 1,
      tags: doc.tags || [],
      order: doc.order || 0,
      creator: {
        id: doc.createdBy,
        displayName: doc.creatorInfo?.displayName,
        username: doc.creatorInfo?.username,
        email: doc.creatorInfo?.email
      },
      updater: {
        id: doc.updatedBy,
        displayName: doc.updaterInfo?.displayName,
        username: doc.updaterInfo?.username,
        email: doc.updaterInfo?.email
      },
      createdAt: new Date(doc.createdAt).toLocaleString('zh-CN'),
      updatedAt: new Date(doc.updatedAt).toLocaleString('zh-CN')
    };

    return {
      content: [
        {
          type: 'text',
          text: `✅ 文档详情\n\n` +
                `文档 ID: ${formatted.id}\n` +
                `标题: ${formatted.title}\n` +
                `类型: ${formatted.type}\n` +
                `状态: ${formatted.status}\n` +
                `版本: ${formatted.version}\n` +
                `标签: ${formatted.tags.join(', ') || '无'}\n` +
                `创建者: ${formatted.creator.displayName || formatted.creator.username || '未知'}\n` +
                `更新者: ${formatted.updater.displayName || formatted.updater.username || '未知'}\n` +
                `创建时间: ${formatted.createdAt}\n` +
                `更新时间: ${formatted.updatedAt}\n\n` +
                `内容:\n${formatted.content}\n\n` +
                `完整 JSON:\n${JSON.stringify(formatted, null, 2)}`
        }
      ]
    };
  }
};
