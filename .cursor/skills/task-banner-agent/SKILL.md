---
name: task-banner-agent
description: Task Banner MCP 协作入口。用户说查看/继续/执行任务时使用 task-banner-orchestrator（拉任务+委派），由 task-banner-executor subagent 实现代码。
---

# Task Banner Agent（入口）

本 skill 已拆分为**编排者 + 执行者**。收到任务相关指令时：

1. **读** `.cursor/skills/task-banner-orchestrator/SKILL.md` 并以**编排者**身份行动
2. **委派** Task 工具 → `task-banner-executor`（prompt 用 `executor-prompt.md`）
3. **不要**编排者亲自写业务代码

## 文档

| 文档 | 用途 |
| --- | --- |
| `.kooboo-ai/specs/agent-sop.md` | 完整 SOP |
| `.cursor/skills/task-banner-orchestrator/` | 编排者 + 委派模板 |
| `.cursor/skills/task-banner-executor/` | 执行者 |
| `kooboo-cli-coding` | 代码实现规范 |
