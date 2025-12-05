import { z } from 'zod';
import { KbTaskApiClient } from '../api/client.js';

interface Tool {
  name: string;
  description: string;
  inputSchema: z.ZodObject<any>;
  execute: (params: any, apiClient: KbTaskApiClient) => Promise<any>;
}

export const documentDeleteTool: Tool = {
  name: 'kb_document_delete',
  description: '删除指定文档。注意：删除操作需要项目管理员权限，且为软删除（可以恢复）。',
  inputSchema: z.object({
    documentId: z.string().describe('文档 ID（必填）')
  }),

  async execute(params: any, apiClient: KbTaskApiClient) {
    if (!params.documentId) {
      throw new Error('documentId 是必需的');
    }
    
    const result = await apiClient.deleteDocument(params.documentId);

    // 检查 API 响应格式
    if (result.code !== 200) {
      throw new Error(result.message || 'Failed to delete document');
    }

    return {
      content: [
        {
          type: 'text',
          text: `✅ 文档删除成功！\n\n` +
                `文档 ID: ${params.documentId}\n` +
                `注意：这是软删除，文档数据仍然保留，可以恢复。`
        }
      ]
    };
  }
};
