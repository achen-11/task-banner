# Task-Banner - 任务需求文档

## 🤖 AI 协作指引

### 任务处理流程
1. **阅读任务**：仔细阅读下方的任务需求，理解每个任务的目标、技术要点和参考资料
2. **实现任务**：根据项目技术栈和任务描述完成开发
3. **保留元数据**：在返回结果时，务必保留每个任务的 task-id 注释（`<!-- task-id: xxx -->`）
4. **更新任务信息**：
   - 更新任务描述，补充实现细节
   - 如有修改文件，在技术要点中注明
   - 添加相关的参考链接（如果有）
5. **返回格式**：保持 Markdown 格式不变，返回完整的文档内容

### ⚠️ 重要提醒
- 必须保留所有 `<!-- task-id: xxx -->` 注释，这是任务回填的关键标识
- 保持 Markdown 结构完整，不要删除任何标题层级
- 任务完成后，可以在任务描述末尾添加实现说明

---

## 任务列表

共 1 个任务

### 🟡 中优先级

<!-- task-id: 1761184818764-4xbypp5nu -->
#### 1. 任务列表-排序

**状态：** 已完成
**优先级：** 中
**创建时间：** 2025/10/23 10:00:18
**更新时间：** 2025/10/23 11:10:00

**任务描述：**

- [x] 目前看起来并没有效果
- [x] 检查并修复排序问题
- [x] 可以移除默认的 status 排序, 但需要完成待办靠前, 且根据更新时间降序的效果

**实现说明：**

问题原因：之前在 `task.ts` 的 `allTasks` 中实现的排序逻辑没有被实际使用。列表视图使用的是 `allProjectTasks`，它调用 `getTasksByProject` 按 `order` 字段排序。

解决方案：在 Board.vue 中创建新的 `sortedProjectTasks` computed 属性，专门为列表视图提供排序后的任务列表。简化排序逻辑为：
- 已完成的任务排在后面
- 其他任务（待办、进行中等）排在前面
- 相同状态下按更新时间降序排序（最新的在前）

**技术要点：**

- 修改文件：
  - `src/views/Board.vue:166-178` - 新增 `sortedProjectTasks` computed 属性
  - `src/views/Board.vue:601` - ListView 使用 `sortedProjectTasks` 替代 `allProjectTasks`
  - `src/stores/task.ts:26-28` - 恢复 `allTasks` 为简单的按创建时间排序
- 排序逻辑：
  - 第一优先级：已完成的任务 (`status === 'completed'`) 排在后面
  - 第二优先级：相同状态分组内，按 `updatedAt` 降序排序
- 使用 `[...array]` 创建数组副本避免直接修改原数组
- 只影响列表视图的排序，看板视图保持原有的按列分组+order排序逻辑

**参考链接：**

- [Vue 3 Computed Properties](https://vuejs.org/guide/essentials/computed.html)
- [JavaScript Array.sort()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)

---


> 📅 导出时间：2025/10/23 11:03:03
> 🤖 由 Task Banner 生成