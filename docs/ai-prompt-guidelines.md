# AI 提示词指南

## 任务完成状态要求

**重要**：当AI完成任务时，必须将任务状态设置为 `review`（待验收）而不是 `completed`（已完成）。

### 状态说明

- `todo` - 待办
- `in_progress` - 进行中
- `review` - 待验收（AI完成时使用此状态）
- `completed` - 已完成（人工验收后使用）

### 推荐的AI提示词结尾模板

```
请完成上述任务并确保：
1. 任务状态设置为 "review"（待验收）
2. 在task.json中使用以下格式：
   ```json
   {
     "status": "review",
     "summary": "任务摘要（20-50字）"
   }
   ```

这确保了AI完成的工作需要人工验收，符合质量管控流程。
```

### 导入任务时的状态处理

当通过JSON或Markdown导入任务时：
- 如果任务已存在且状态为 `completed`，应保持为 `review`
- 新创建的任务状态默认为 `review`（如果是由AI生成）

## 实施说明

此要求已在以下文件中实现：
- `frontend/src/types/task.ts` - 类型定义
- `frontend/src/utils/export.ts` - 导出工具
- `frontend/src/components/task/TaskBasicInfo.vue` - 状态选择器

**更新日期**：2025-10-28