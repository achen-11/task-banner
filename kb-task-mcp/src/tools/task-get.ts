import { KbTaskApiClient } from '../api/client.js';

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
    'medium': '🟡 中',
    'low': '🟢 低'
  };
  return map[priority] || priority;
}

export const taskGetTool = {
  name: 'kb_task_get',
  description: '获取指定任务的详细信息，包括完整描述、标签、模块、历史记录等。当你需要了解任务的详细内容时使用此工具。支持使用任务的 displayId（如 "123"）或完整的 _id。如果使用 displayId，需要提供 projectId。',
  inputSchema: {
    type: 'object',
    properties: {
      taskId: {
        type: 'string',
        description: '任务 ID（可以是 displayId 如 "123" 或完整的 _id）'
      },
      projectId: {
        type: 'string',
        description: '项目 ID（当使用 displayId 时需要提供）'
      }
    },
    required: ['taskId']
  },

  async execute(params: any, apiClient: KbTaskApiClient) {
    let task;

    // 判断是 displayId 还是完整的 _id
    if (params.taskId.length < 20 && !params.taskId.includes('-')) {
      // 很可能是 displayId，需要 projectId
      if (!params.projectId) {
        // 尝试获取第一个项目作为默认项目
        const projects = await apiClient.listProjects();
        if (projects.items.length === 0) {
          throw new Error('No projects found. Please provide projectId when using displayId.');
        }
        const projectId = projects.items[0]._id;
        task = await apiClient.getTaskByDisplayId(params.taskId, projectId);
      } else {
        task = await apiClient.getTaskByDisplayId(params.taskId, params.projectId);
      }
    } else {
      // 完整的 _id，直接获取
      task = await apiClient.getTask(params.taskId);
    }

    // 格式化为 Markdown（类似现有的导出格式）
    const markdown = `
# 任务详情：${task.title}

**任务 ID**: #${task.displayId}
**状态**: ${getStatusLabel(task.status)}
**优先级**: ${getPriorityLabel(task.priority)}
**进度**: ${task.progress}%
**创建时间**: ${new Date(task.createdAt).toLocaleString('zh-CN')}
**更新时间**: ${new Date(task.updatedAt).toLocaleString('zh-CN')}
${task.assignee ? `**指派人**: ${task.assignee.name}` : '**指派人**: 未分配'}
${task.creator ? `**创建者**: ${task.creator.name}` : ''}
${task.tags?.length ? `**标签**: ${task.tags.map(t => t.name).join(', ')}` : ''}
${task.modules?.length ? `**模块**: ${task.modules.map(m => m.name).join(', ')}` : ''}
${task.summary ? `\n**任务摘要**: ${task.summary}\n` : ''}

## 任务描述

${task.content || '(无描述)'}

---

### 元数据（用于更新任务时使用）
\`\`\`json
{
  "_id": "${task._id}",
  "displayId": ${task.displayId},
  "projectId": "${task.projectId}",
  "status": "${task.status}",
  "priority": "${task.priority}"
}
\`\`\`

**提示**: 完成任务后，请使用 kb_task_update 工具更新任务状态、添加摘要等。
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
