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

共 2 个任务

### 🟡 中优先级

<!-- task-id: 1760973811078-760g44pw9 -->
#### 1. 快捷键提示

**状态：** 已完成
**优先级：** 中
**创建时间：** 2025/10/20 23:23:31
**更新时间：** 2025/10/23 10:00:00

**任务描述：**

- [x] 添加 title 属性是好的, 但反馈不够及时, 需要类似 tooltip 这种的反馈才会更及时

**实现说明：**

使用 Element Plus 的 `el-tooltip` 组件替换原生 `title` 属性，提供即时的视觉反馈。

**技术要点：**

- 修改文件：
  - `src/components/TaskDialog.vue:651-658` - 保存按钮添加 tooltip
  - `src/views/Board.vue:449-472` - 导入任务、导出选中、新建任务按钮添加 tooltip
- 使用 `el-tooltip` 组件包裹按钮，提供更好的用户体验
- 设置 `placement` 属性控制提示位置（top/bottom）

**参考链接：**

- [Element Plus Tooltip 组件文档](https://element-plus.org/zh-CN/component/tooltip.html)

---

<!-- task-id: 1761184818764-4xbypp5nu -->
#### 2. 任务列表-排序

**状态：** 已完成
**优先级：** 中
**创建时间：** 2025/10/23 10:00:18
**更新时间：** 2025/10/23 10:05:00

**任务描述：**

- [x] 调整默认排序: 先按状态排序, 后根据 update 进行排序

**实现说明：**

在任务列表的排序逻辑中，实现了两级排序：首先按任务状态优先级排序，相同状态下再按更新时间降序排序（最新的在前）。

**技术要点：**

- 修改文件：
  - `src/stores/task.ts:26-44` - 修改 `allTasks` computed 属性的排序逻辑
- 定义状态优先级顺序：
  1. `in_progress` (进行中) - 优先级最高
  2. `sent_to_ai` (发送到AI)
  3. `needs_optimization` (需要优化)
  4. `todo` (待办)
  5. `completed` (已完成) - 优先级最低
- 使用复合排序：先比较状态优先级，相同状态下再按 `updatedAt` 降序排序
- 确保最新更新的任务在相同状态分组内优先显示

**参考链接：**

- [TypeScript Record 类型](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)
- [Array.prototype.sort() - MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)

---


> 📅 导出时间：2025/10/23 10:00:24
> 🤖 由 Task Banner 生成