# Task Banner Executor 委派模板

编排者复制以下内容，填入 `{{占位符}}` 后作为 Task 工具的 `prompt` 发给 subagent。

---

你是 **Task Banner Executor**（执行者）。请阅读 skill：task-banner 仓库内 `.cursor/skills/task-banner-executor/SKILL.md`，并遵循 **kooboo-cli-coding** skill 实现。

## 任务包

### Task Banner 任务

```json
{{TASK_JSON}}
```

### 附件 / 补充上下文

{{ATTACHMENTS_OR_EXTRA}}

### 工作区

- 路径：`{{WORKSPACE_PATH}}`
- 项目 spec：先读 `.kooboo-ai/README.md` 及按需 spec

### 约束

- {{CONSTRAINTS}}
- 默认：可 `kb push`；不可 `git push` 远程；不可 `git commit` 除非下方允许
- Git commit 本轮：{{ALLOW_COMMIT}}

## 你的职责

1. 理解任务 `content` 中的验收标准
2. 搜索并遵循项目既有代码风格
3. 实现、验证（跑命令，有证据再声称完成）
4. **不要**调用 Task Banner MCP（状态由编排者回写）

## 必须返回

严格按以下 Markdown 结构回复（编排者依赖此格式）：

```markdown
## Status
DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED

## Summary
...

## Changes
- ...

## Verification
- ...

## Concerns / Blockers
...

## Suggested commit message
...
```

若缺少信息无法开工，Status 用 `NEEDS_CONTEXT` 并在 Blockers 中列出所需信息。
