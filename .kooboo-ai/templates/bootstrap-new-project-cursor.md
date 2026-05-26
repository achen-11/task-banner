# 新项目 Cursor 协作环境引导（方案 C）

将 Task Banner + MCP + 编排者/执行者流程复制到**另一个 Kooboo CLI 仓库**（如 forum）。

**用法：**

1. 用 Cursor 打开目标仓库（单独窗口 / 单独 workspace root）
2. 新建 Agent 会话
3. 让 Agent **读取本文件全文**并按「Agent 执行指令」章节执行（不要从聊天里复制大段 prompt，避免 Markdown 被格式化吞掉）

---

## 固定参数（forum 示例）

| 变量 | 值 |
| --- | --- |
| `PROJECT_ROOT` | `/Users/achen/Priv/Yardi/AI-App/forum` |
| `TASK_BANNER_MCP_URL` | `https://ai_task_v2.redev.cn/_mcp` |
| `TASK_BANNER_PROJECT_ID` | `7b89b5878b4c4091a6c099643dddf6d2`（forum 示例） |
| `TASK_BANNER_SELF_PROJECT_ID` | `648660cbda2e4a2f9c7ace035edfe8aa`（task-banner 自用，灾后重建 ID） |
| `TASK_BANNER_PROJECT_NAME` | `forum` |
| `REF_TASK_BANNER_REPO` | `/Users/achen/Priv/task-banner` |

其他项目：只改上表四行（路径、project_id、项目名），其余流程相同。

JWT：用户自行填入 `.cursor/mcp.json` 的 Bearer（与 Task Banner 登录账号相同即可）。Agent **只生成** `mcp.json.example`，不要写真实 token。

---

## 架构说明

```text
Task Banner 站点 (ai_task_v2.redev.cn/_mcp)
        │
        ├── project: task-banner  →  在 task-banner 仓库执行
        └── project: forum        →  在 forum 仓库执行
```

- **共用**：同一个 MCP、同一套编排/执行流程
- **分离**：各自 `.kooboo-ai`、各自 `kb push` 目标站点、各自 git 仓库

---

## Agent 执行指令

> 以下内容供 Agent 在目标仓库内执行。请完整阅读后再动手。

### 目标

为当前 Kooboo CLI 仓库搭建与 task-banner 相同的 **Task Banner + MCP + 编排者/执行者** 协作环境（方案 C：每仓库自包含 skill + spec，共用远端 Task Banner MCP）。

在本仓库内完成脚手架，**不要**修改 `REF_TASK_BANNER_REPO` 下的代码。

### 1. 勘察本仓库

确认并记录：

- 前端源码目录（forum 为 `Frontend/`，task-banner 为 `frontend/`）
- `src/api/` 结构
- `build.sh` / `pnpm build` / `pnpm dev`（`kb sync`）
- 是否已有 `.kooboo-ai/`、`.cursor/`（预计没有）

### 2. 创建 `.cursor/` 协作层

从 `REF_TASK_BANNER_REPO` **复制并改写**（不要 symlink 到 task-banner，目标仓库要自包含）：

```text
.cursor/
├── mcp.json.example
├── skills/
│   ├── kooboo-cli-coding/       # 复制 REF/.cursor/skills/kooboo-cli-coding/ 整目录
│   ├── task-orchestrator/
│   │   ├── SKILL.md
│   │   └── executor-prompt.md
│   └── task-executor/
│       └── SKILL.md
```

#### `mcp.json.example`

与 task-banner 相同结构，URL 为 `TASK_BANNER_MCP_URL`：

```json
{
  "mcpServers": {
    "TaskBanner": {
      "url": "https://ai_task_v2.redev.cn/_mcp",
      "headers": {
        "Authorization": "Bearer <your-jwt-token>"
      }
    }
  }
}
```

#### `task-orchestrator/SKILL.md` 必改项

- 工作区路径 → `PROJECT_ROOT`
- 拉任务时 **默认 `project_id` = `TASK_BANNER_PROJECT_ID`**
- MCP 工具仍用 `k_list_projects` / `k_list_tasks` / `k_get_task` 等
- 完整 SOP → 本仓库 `.kooboo-ai/specs/agent-sop.md`
- 可复制 `REF_TASK_BANNER_REPO/.cursor/skills/task-banner-orchestrator/SKILL.md` 后替换路径与 project_id

#### `task-executor/SKILL.md` 必改项

- 工作区 → `PROJECT_ROOT`
- 前端目录 → 本仓库实际目录（forum 为 `Frontend/`）
- build → 本仓库 `pnpm build` / `build.sh` 约定
- **不调用** Task Banner MCP
- 可复制 `REF_TASK_BANNER_REPO/.cursor/skills/task-banner-executor/SKILL.md` 后改写

#### `executor-prompt.md` 必改项

- `{{WORKSPACE_PATH}}` → `PROJECT_ROOT`
- 增加：`Task Banner project_id: <TASK_BANNER_PROJECT_ID>（<TASK_BANNER_PROJECT_NAME>）`
- 可复制 `REF_TASK_BANNER_REPO/.cursor/skills/task-banner-orchestrator/executor-prompt.md` 后改写

### 3. 创建 `.kooboo-ai/` 项目 spec

参考 `REF_TASK_BANNER_REPO/.kooboo-ai/`，结合本仓库实际生成：

```text
.kooboo-ai/
├── README.md
├── specs/
│   ├── agent-sop.md
│   ├── frontend.md
│   ├── backend.md
│   └── routing.md
├── rules/
│   └── overrides.md
└── templates/
    └── task-for-agent.md
```

#### `README.md` 必含

- 本项目用途
- `TASK_BANNER_PROJECT_ID` / 项目名
- 读取顺序（同 task-banner）
- `pnpm dev` / `pnpm build` 命令

#### `agent-sop.md`

从 task-banner 复制后改写路径、前端目录名，并**追加**：

```markdown
## 多项目说明

- 任务在 Task Banner「<项目名>」项目下创建（project_id: `<TASK_BANNER_PROJECT_ID>`）
- 代码在本仓库 `PROJECT_ROOT` 修改；MCP 状态回写到 Task Banner
- 编排者用 `k_list_tasks(project_id=<TASK_BANNER_PROJECT_ID>)` 拉任务
- Agent 主路径走 MCP；UI 剪贴板导入导出仅人工备用（若本项目无 MCP 工具则忽略 mcp.md）
```

#### `rules/overrides.md`

根据本仓库填写，forum 注意：

- 前端目录为 `Frontend/`（大写 F）
- Hash 路由、Tailwind、ksql 等与 task-banner 类似处可复用模板

#### 不要复制

- task-banner 的 `specs/mcp.md`（除非本仓库也有 `mcp-tools/`）

### 4. 用户手动步骤（Agent 在交付说明中列出）

1. 复制 `.cursor/mcp.json.example` → `.cursor/mcp.json`
2. 填入 JWT Bearer（与 Task Banner 相同账号）
3. Cursor 设置中启用 MCP server `TaskBanner`
4. （建议）User Rule：`git push 必须经过我二次确认`

### 5. 验证（必须跑并汇报）

- `kb` / `pnpm dev` 能识别本站点（`.env` 密钥勿提交）
- MCP 或 HTTP 调用 `k_list_tasks`，`project_id=TASK_BANNER_PROJECT_ID`，能列出任务
- `.cursor/skills/task-orchestrator/SKILL.md` 中 project_id、workspace 正确

### 6. 交付格式

Agent 完成后输出：

- 创建/修改的文件列表
- 用户接下来怎么说「继续任务」
- 仍须用户手动完成的步骤（JWT、开 MCP）
- **不要** `git commit`，除非用户明确要求

---

## 脚手架完成后的日常用法

在目标仓库 Cursor 会话中说：

```text
按 task-orchestrator：用 MCP 拉 <项目名> 项目（project_id=<TASK_BANNER_PROJECT_ID>）的 todo 任务，委派 task-executor 实现，你只做状态回写；不要 push 远程 git。
```

或简短：

```text
继续任务
```

---

## 验收清单

| # | 检查项 |
| --- | --- |
| 1 | `.cursor/mcp.json` 已配置且 MCP 工具可用 |
| 2 | `.cursor/skills/task-orchestrator/`、`task-executor/`、`kooboo-cli-coding/` 存在 |
| 3 | `.kooboo-ai/README.md` 写明 `TASK_BANNER_PROJECT_ID` |
| 4 | orchestrator skill 里 workspace 是本项目路径，不是 task-banner |
| 5 | `k_list_tasks(project_id=…)` 能拉到本项目任务 |
| 6 | 在本项目建测试任务 → 「继续任务」→ 改的是**本项目代码** |

---

## forum 会话一键触发语

在 forum 仓库新建 Cursor 会话后，**只发这一句**即可（Agent 自行读文件）：

```text
请阅读并执行本仓库 .kooboo-ai/templates/bootstrap-new-project-cursor.md（若尚未复制到本仓库，则先读 task-banner 仓库同路径文件）。目标 project_id=7b89b5878b4c4091a6c099643dddf6d2，PROJECT_ROOT 为当前仓库绝对路径。完成后按文件内验收清单汇报。
```

若 forum 尚未有该文件，先从 task-banner 复制：

```bash
mkdir -p .kooboo-ai/templates
cp /Users/achen/Priv/task-banner/.kooboo-ai/templates/bootstrap-new-project-cursor.md .kooboo-ai/templates/
```

然后再发上面的「一键触发语」。
