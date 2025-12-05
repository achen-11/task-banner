import { z } from 'zod';
import { KbTaskApiClient } from '../api/client.js';

interface Tool {
  name: string;
  description: string;
  inputSchema: z.ZodObject<any>;
  execute: (params: any, apiClient: KbTaskApiClient) => Promise<any>;
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    'todo': '📝 待办',
    'in_progress': '🔄 进行中',
    'completed': '✅ 已完成',
    'review': '👀 待验收'
  };
  return map[status] || status;
}

function getPriorityLabel(priority: string): string {
  const map: Record<string, string> = {
    'high': '🔴 高',
    'urgent': '🔴 紧急',
    'medium': '🟡 中',
    'low': '🟢 低'
  };
  return map[priority] || priority;
}

export const taskGetTool: Tool = {
  name: 'kb_task_get',
  description: '获取指定任务的详细信息，包括完整描述、标签、模块、指派人、创建人等。支持使用任务 ID（_id）或显示 ID（displayId）。',
  inputSchema: z.object({
    taskId: z.string().describe('任务 ID（_id）或显示 ID（displayId，如 "1001"）')
  }),

  async execute(params: any, apiClient: KbTaskApiClient) {
    const result = await apiClient.getTask(params.taskId);

    // 检查 API 响应格式
    if (result.code !== 200) {
      throw new Error(result.message || 'Failed to get task');
    }

    const task = result.data;

    if (!task) {
      throw new Error('Task not found');
    }

    // 格式化为 Markdown
    const markdown = `
# 任务详情：${task.title}

**任务 ID**: #${task.displayId} (${task._id})
**状态**: ${getStatusLabel(task.status)}
**优先级**: ${getPriorityLabel(task.priority)}
**进度**: ${task.progress || 0}%
**创建时间**: ${new Date(task.createdAt).toLocaleString('zh-CN')}
**更新时间**: ${new Date(task.updatedAt).toLocaleString('zh-CN')}
${task.assignee ? `**指派人**: ${task.assignee.displayName || task.assignee.username || '未知'}` : '**指派人**: 未分配'}
${task.creator ? `**创建人**: ${task.creator.displayName || task.creator.username || '未知'}` : ''}
${task.dueDate ? `**截止日期**: ${new Date(task.dueDate).toLocaleString('zh-CN')}` : ''}
${task.tags?.length ? `**标签**: ${task.tags.map((t: any) => t.name).join(', ')}` : ''}
${task.modules?.length ? `**模块**: ${task.modules.map((m: any) => m.name).join(', ')}` : ''}
${task.summary ? `\n**任务摘要**: ${task.summary}\n` : ''}

## 任务描述

${task.content || '(无描述)'}

---

### 元数据（用于更新任务）

\`\`\`json
{
  "_id": "${task._id}",
  "displayId": ${task.displayId},
  "projectId": "${task.projectId}",
  "status": "${task.status}",
  "priority": "${task.priority}",
  "tagIds": ${JSON.stringify(task.tagIds || [])},
  "moduleIds": ${JSON.stringify(task.moduleIds || [])}
}
\`\`\`
    `.trim();

    return {
      content: [
        {
          type: 'text',
          text: markdown
        }
      ]
    };
  }
};
