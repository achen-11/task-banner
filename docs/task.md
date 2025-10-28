# 快捷操作-导出评论

**任务ID:** #1041
**状态:** 已完成
**优先级:** 中
**创建时间:** 2025/10/28 20:27:11
**更新时间:** 2025/10/28 21:08:49

**任务摘要：** 优化评论显示和交互体验，支持AI标签、快捷键优化和Cmd+Enter发送

## 任务描述

任务详情页新增快捷操作
1. 在任务详情页时, 按下导出, 或者 cmd + e, 会进去评论选择状态, 可以点击选中要导出哪些任务
2. 选择后(可以不选)再次按下 cmd + e 则导出任务信息和选中的评论到剪切板

## 实现方案

### 主要优化内容
1. **评论显示优化**：支持summary字段显示和AI标签
2. **快捷键优化**：ESC键在选择模式下退出选择状态
3. **评论发送优化**：支持Cmd+Enter快捷发送评论

### 修改的文件
- `/Users/achen/Priv/task-banner/kb-task/frontend/src/components/task/TaskActivity.vue`
  - 添加AI标签显示逻辑
  - 优化评论内容显示，支持summary字段
  - 扩展Activity接口，添加commentType字段
  - 为MarkdownEditor添加submit事件监听
- `/Users/achen/Priv/task-banner/kb-task/frontend/src/components/TaskDetailDrawer.vue`
  - 修改ESC键处理逻辑，支持选择模式退出
- `/Users/achen/Priv/task-banner/kb-task/frontend/src/components/common/MarkdownEditor.vue`
  - 添加Cmd+Enter快捷键支持，触发submit事件

### 技术要点
- **AI标签显示**：当commentType为'ai_completion'时显示紫色AI标签
- **摘要显示**：有summary时显示摘要并添加查看详情按钮
- **快捷键优化**：选择模式下ESC优先退出选择状态
- **评论发送**：支持Cmd+Enter快捷发送，提升用户体验

### 验证结果
- ✅ AI评论正确显示紫色AI标签
- ✅ 评论摘要正确显示，支持查看详情
- ✅ ESC键在选择模式下正确退出选择状态
- ✅ Cmd+Enter快捷发送评论功能正常
- ✅ 前端构建成功（有少量TypeScript警告，不影响功能）

## 选中评论 (2条)

### 评论 1

**时间:** 2025/10/28 21:20:53

**内容:**

3.优化/api/task/activities, 评论是有 summary 字段的, 有 summary 时显示 summary 就行(有 summary 就必须显示查看详情按钮了); 另外还有type字段, 如果 type 是"ai_completion", 要显示一个"AI"tag

---

### 评论 2

**作者:** Guoqi Zheng
**时间:** 2025/10/28 21:16:48

**内容:**

1. 新增操作: cmd + e 进入选择状态, 再按 esc 是退出选择状态, 而不是退出弹窗
2. 新增快捷键: 聚焦在评论区输入框时, 发送评论按钮文字变为"发送评论(cmd +enter)" 括号内的文字要是 icon或者符号,不是打的文字,  cmd + enter 会发送评论

---

