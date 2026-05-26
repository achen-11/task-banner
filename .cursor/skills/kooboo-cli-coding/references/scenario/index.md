# 业务场景索引

scope: shared（待扩充）

常见业务场景的组合参考。每个场景文档描述：涉及哪些资源、推荐路线（SSR / Local）、相关 KScript 模块、注意事项。

## 场景列表（待扩充）

| 场景 | 说明 | 状态 |
| --- | --- | --- |
| 多语言站点 | 前端标签、路由模式、语言切换 | 待从官方 Scenario 移植 |
| 认证 / 登录 | 密码、OAuth、JWT 等选型 | 待移植 |
| 电商顾客流程 | product / cart / order / login | 待移植 |
| 邮件与短信 | 验证码、通知 | 待移植 |

官方参考路径：`kooboo-coding/references/Scenario/`

## 使用方式

1. 确认任务属于哪个场景
2. 读取对应场景文档
3. 结合项目 `.kooboo-ai/specs/` 中的业务规则
4. 按 CLI 方式实现（本地文件 + kb push）

## CLI 差异

官方场景文档中涉及 `load_skill`、`get_site_info`、`show_action_button` 的段落，须改写为 CLI 等价操作或删除。
