export const meta = {
  name: "get_task",
  description: "按任务 _id 获取单条任务详情（含标签与模块）",
  approvalRequired: false,
  tags: ["task-banner"],
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "任务 _id"
      }
    },
    required: ["task_id"],
    additionalProperties: false
  }
} as const;

import { getCurrentAuthUser } from "code/Services/auth";
import { checkProjectPermission } from "code/Services/project";
import { getTaskById, getTaskDetailById } from "code/Services/task";
import { parseMcpRequestArgs } from "code/Utils/mcpArgs";
const args = parseMcpRequestArgs(k.request.body);
const currentUser = getCurrentAuthUser();
if (!currentUser) {
  k.response.json({
    ok: false,
    error: 'Unauthorized'
  });
} else if (!args.task_id) {
  k.response.json({
    ok: false,
    error: 'task_id 必填'
  });
} else {
  const taskId = String(args.task_id);
  const task = getTaskById(taskId);
  if (!task) {
    k.response.json({
      ok: false,
      error: '任务不存在'
    });
  } else if (!checkProjectPermission(task.projectId, currentUser._id, 'member')) {
    k.response.json({
      ok: false,
      error: '无权限查看该任务'
    });
  } else {
    const detail = getTaskDetailById(taskId);
    k.response.json({
      ok: true,
      data: detail
    });
  }
}
