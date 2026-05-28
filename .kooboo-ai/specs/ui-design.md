# Task Banner UI 设计规范

前端 UI 改动前请阅读本规范；需要更严格的设计约束时，参考 **[Taste Skill](https://www.tasteskill.dev/)** 官网与文档。

## Taste Skill（可选安装）

本项目**未内置** Taste Skill 文件；Agent 默认以本文 + 现有页面风格为准。

| 项 | 说明 |
| --- | --- |
| 官网 | https://www.tasteskill.dev/ |
| 文档 | https://www.tasteskill.dev/docs |
| 安装（可选） | `npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"` |
| 用途 | 减少 AI 默认审美（紫渐变、三列卡片堆砌、Inter 字体等） |

若本地已安装 `design-taste-frontend`，改 UI 时可按其 SKILL.md 做 pre-flight 自检；未安装则不必虚构本地 skill 路径。

## 本项目约定

| 项 | 约定 |
| --- | --- |
| 布局容器 | 页面 `p-8`，内容区 `max-w-4xl` 或全宽列表 |
| 卡片 | `rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700` |
| 主色 | `#3762E3`（Element Plus primary），避免额外紫色强调 |
| 表单 | 优先 `el-form` + `label-position="top"`；说明文案与控件之间保留 `mb-3` 以上间距 |
| 暗色 | 所有新组件需带 `dark:` 变体 |
| 密度 | 任务/看板类页面偏高密度（可参考 Taste Skill 的 VISUAL_DENSITY 6–7） |

## 自检清单（改 UI 前扫一遍）

- [ ] 无 emoji 作为 UI 图标
- [ ] 无 `h-screen`（移动端用 `min-h-[100dvh]`）
- [ ] 列表/看板不用三列等宽 feature 卡片凑数
- [ ] 标题层级清晰，H1 每页仅一个
- [ ] 区块说明文案与表单项/选项之间间距充足，不「贴在一起」
- [ ] 交互态：hover / loading / empty 是否齐全
- [ ] 与 `Home.vue`、`Messages.vue` 卡片风格一致

## 进行中的 UI 任务（看板）

| 任务 | 内容 |
| --- | --- |
| #1023 | 消息列表页布局（方案待定） |
| #1024 | 专注模式体验、动态面包屑、我的任务页专注 |

#1022 已完成（任务详情抽屉改造，2026-05）。

#1021 已关闭（规范文档 + 项目默认专注看板）。Agent 改上述范围前请先 `k_get_task` 读最新描述。
