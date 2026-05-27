# Task Banner UI 设计规范

前端 UI 改动前请阅读本规范，并配合 **design-taste-frontend** skill 做自检。

## 关联 Skill

- 路径：`~/.agents/skills/design-taste-frontend/SKILL.md`（或用户全局安装位置）
- 用途：纠正 AI 默认审美（避免紫渐变、三列卡片堆砌、Inter 字体等）

## 本项目约定

| 项 | 约定 |
| --- | --- |
| 布局容器 | 页面 `p-8`，内容区 `max-w-4xl` 或全宽列表 |
| 卡片 | `rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700` |
| 主色 | `#3762E3`（Element Plus primary），避免额外紫色强调 |
| 表单 | 优先 `el-form` + `label-position="top"`，少用裸 `<input>` |
| 暗色 | 所有新组件需带 `dark:` 变体 |
| 密度 | 任务/看板类页面偏高密度（VISUAL_DENSITY 6–7） |

## 自检清单（改 UI 前扫一遍）

- [ ] 无 emoji 作为 UI 图标
- [ ] 无 `h-screen`（移动端用 `min-h-[100dvh]`）
- [ ] 列表/看板不用三列等宽 feature 卡片凑数
- [ ] 标题层级清晰，H1 每页仅一个
- [ ] 交互态：hover / loading / empty 是否齐全
- [ ] 与 `Home.vue`、`Messages.vue` 卡片风格一致

## 待讨论项（见 #1021）

以下需产品确认后再改，Agent 勿擅自大改：

- 任务详情抽屉整体重构
- 消息列表布局重做
- 项目/我的任务非看板 Tab 的头部压缩方案
