import { z } from 'zod';
import { KbTaskApiClient } from '../api/client.js';

interface Tool {
  name: string;
  description: string;
  inputSchema: z.ZodObject<any>;
  execute: (params: any, apiClient: KbTaskApiClient) => Promise<any>;
}

export const documentListTool: Tool = {
  name: 'kb_document_list',
  description: '获取文档列表，支持按项目、状态、类型、关键词等条件筛选。返回分页结果。\n\n状态值：draft（草稿）、published（已发布）、archived（已归档）。类型值：markdown（Markdown）、text（纯文本）。',
  inputSchema: z.object({
    projectId: z.string().describe('项目 ID（必填）'),
    page: z.number().default(1).describe('页码（从1开始）'),
    size: z.number().default(20).describe('每页数量'),
    status: z.enum(['draft', 'published', 'archived']).optional().describe('文档状态筛选。可选值：draft（草稿）、published（已发布）、archived（已归档）'),
    type: z.enum(['markdown', 'text']).optional().describe('文档类型筛选。可选值：markdown（Markdown）、text（纯文本）'),
    keyword: z.string().optional().describe('关键词搜索（搜索标题和内容）')
  }),

  async execute(params: any, apiClient: KbTaskApiClient) {
    if (!params.projectId) {
      throw new Error('projectId 是必需的');
    }
    
    const result = await apiClient.listDocuments(params);

    // 检查 API 响应格式
    if (result.code !== 200) {
      throw new Error(result.message || 'Failed to get document list');
    }

    const documents = result.data?.items || [];
    const total = result.data?.total || 0;
    const page = result.data?.page || params.page;
    const size = result.data?.size || params.size;

    // 格式化输出，便于 AI 阅读
    const formatted = documents.map((doc: any) => ({
      id: doc._id,
      title: doc.title,
      type: doc.type || 'markdown',
      status: doc.status || 'draft',
      version: doc.version || 1,
      tags: doc.tags || [],
      order: doc.order || 0,
      creator: doc.creatorInfo?.displayName || doc.creatorInfo?.username || '未知',
      updater: doc.updaterInfo?.displayName || doc.updaterInfo?.username || '未知',
      createdAt: new Date(doc.createdAt).toLocaleString('zh-CN'),
      updatedAt: new Date(doc.updatedAt).toLocaleString('zh-CN'),
      contentPreview: doc.content ? doc.content.substring(0, 100) + '...' : ''
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            total,
            page,
            size,
            documents: formatted
          }, null, 2)
        }
      ]
    };
  }
};
