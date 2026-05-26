# 项目 Spec 设置指引

scope: cli-only

当 Kooboo CLI 站点尚未有 `.kooboo-ai/` 目录，或用户要开始一个新功能但缺少项目约定时，使用本指引协助用户建立项目级 spec。

## 何时触发

- 用户首次在本仓库开发，且没有 `.kooboo-ai/README.md`
- 任务涉及 Local 前端，但不存在 `.kooboo-ai/specs/frontend.md`
- 用户提到「按我们项目规范」但仓库里没有成文约定

## 协助流程

### 1. 确认前端路线

询问或从现有代码推断：

| 判断项 | SSR | Local |
| --- | --- | --- |
| 需要 SEO | 是 | 否 |
| 公开内容页 | 是 | 否 |
| 后台 / 仪表盘 | 否 | 是 |
| 复杂客户端交互 | 否 | 是 |
| 任意前端框架 | 受限 | 是 |

详细分流见 `references/frontend/index.md`。

### 2. 收集必要信息

**所有项目：**

- 站点用途与主要页面
- 是否有多语言、认证、电商等特殊需求

**Local 路线额外询问：**

- 前端框架（Vue / React / 原生等）
- 源码目录（如 `frontend/`）
- build 命令与产物如何映射到 `src/page`、`src/js`、`src/css`

**SSR 路线额外询问：**

- 是否已有 layout 约定
- 服务端取数方式（PageScript、API、CodeBlock）

### 3. 生成 spec 文件

从 `templates/project-spec/` 复制模板到站点根目录 `.kooboo-ai/`：

```text
.kooboo-ai/
├── README.md
├── specs/
│   ├── frontend.md      # Local 必填；SSR 可简写
│   └── routing.md       # 可选
└── rules/
    └── overrides.md     # 覆盖 skill 默认的项目特例
```

让用户确认后再写入文件。不要未经确认覆盖已有 spec。

### 4. 后续任务

每次开发任务开始时：

1. 读 `.kooboo-ai/README.md`
2. 读相关 `specs/` 与 `rules/`
3. 再读本 skill 的通用 reference

## 写入边界

- **写入 `.kooboo-ai/`**：框架、build、代码规范、业务规则、项目特例
- **写回本 skill repo**：仅当约定具有跨项目通用价值时，才提议贡献到 `references/`

## 模板位置

见仓库根目录 `templates/project-spec/`。
