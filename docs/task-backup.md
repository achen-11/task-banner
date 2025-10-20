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

共 3 个任务

### ✅ 已完成

# <!-- task-id: 1760835554684-bgf5v7ik2 -->
#### 1. 创建任务缓存

**状态：** 已完成
**优先级：** 中
**创建时间：** 2025/10/19 08:59:14
**更新时间：** 2025/10/19 09:45:00

**任务描述：**

场景: 创建任务时有时候会误触 esc 或者误关闭弹窗, 此时会丢失所有已填写的内容
- [x] 关闭弹窗时不清空内容，可以做一个快捷键来清空

**实现方案：**

1. **修改关闭逻辑**：移除 `handleClose()` 函数中的 `resetForm()` 调用，关闭弹窗时保留表单内容
2. **修改 watch 逻辑**：只在编辑模式（props.task 存在）时加载任务内容，创建模式时保留缓存
3. **添加清空快捷键**：Cmd+Shift+K（macOS）/ Ctrl+Shift+K（Windows）手动清空表单

```typescript
function handleClose() {
  emit('update:visible', false)
  // 不再自动清空表单，保留用户输入的缓存
  // 用户可以使用 Cmd+Shift+K 快捷键手动清空
}

watch(() => props.visible, async (newVal) => {
  if (newVal) {
    if (props.task) {
      // 编辑模式：加载任务内容
      currentTask.value = props.task
      formData.value = { /* ... */ }
    } else {
      // 创建模式：保留表单缓存，不清空
      currentTask.value = null
      // 不调用 resetForm()，保留用户输入的缓存
    }
  }
})
```

**修改文件：**
- `src/components/TaskDialog.vue:322-326` - 移除自动清空逻辑
- `src/components/TaskDialog.vue:95-124` - 修改 watch 逻辑
- `src/components/TaskDialog.vue:408-415` - 添加 Cmd+Shift+K 清空快捷键

---

# <!-- task-id: 1760835824552-b2bnvxwdq -->
#### 2. 快捷操作优化

**状态：** 已完成
**优先级：** 中
**标签：** 优化
**创建时间：** 2025/10/19 09:03:44
**更新时间：** 2025/10/19 09:45:00

**任务描述：**

- [x] 1. 任务详情抽屉打开时，默认选中任务标题
- [x] 2. 添加保存并新建快捷键（Cmd+Shift+S）
- [x] 3. 保存后自动选中任务（方便 ESC 后直接 Cmd+E 导出）

**实现方案：**

#### 1. 默认选中标题

在抽屉打开时自动聚焦并选中标题输入框：

```typescript
// 添加 titleInputRef
const titleInputRef = ref()

// 在 watch 中添加聚焦逻辑
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    // ... 加载任务数据

    // 等待 DOM 更新后，聚焦并选中标题输入框
    await nextTick()
    if (titleInputRef.value) {
      titleInputRef.value.focus()
      titleInputRef.value.select()
    }
  }
})
```

#### 2. 保存并新建快捷键

添加 Cmd+Shift+S 快捷键，保存当前任务后清空表单并切换到创建模式：

```typescript
// 保存并新建函数
async function handleSubmitAndNew() {
  const success = await handleSubmit()
  if (success) {
    resetForm()
    currentTask.value = null

    await nextTick()
    if (titleInputRef.value) {
      titleInputRef.value.focus()
      titleInputRef.value.select()
    }

    ElMessage.success('已保存，可以继续创建新任务')
  }
}

// 快捷键处理（需要在 Cmd+S 之前判断）
if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'S') {
  event.preventDefault()
  if (props.visible) {
    handleSubmitAndNew()
  }
}
```

#### 3. 保存后自动选中

修改 TaskDialog 的 success 事件，传递任务 ID：

```typescript
// TaskDialog.vue - 修改 emit 定义
interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success', taskId: string): void
}

// 保存成功后传递任务 ID
emit('success', currentTask.value.id)
```

在 Board.vue 中接收并选中任务：

```typescript
const handleTaskDialogSuccess = (taskId: string) => {
  // 清空之前的选中状态，只选中当前任务
  selectedTasks.value.clear()
  selectedTasks.value.add(taskId)
}
```

**修改文件：**
- `src/components/TaskDialog.vue:2` - 添加 nextTick 导入
- `src/components/TaskDialog.vue:31` - 添加 titleInputRef
- `src/components/TaskDialog.vue:117-122` - 添加聚焦逻辑
- `src/components/TaskDialog.vue:417` - 添加 ref="titleInputRef"
- `src/components/TaskDialog.vue:250` - handleSubmit 返回 boolean
- `src/components/TaskDialog.vue:334-351` - 添加 handleSubmitAndNew 函数
- `src/components/TaskDialog.vue:386-393` - 添加 Cmd+Shift+S 快捷键
- `src/components/TaskDialog.vue:18-21` - 修改 Emits 接口
- `src/components/TaskDialog.vue:298,325` - emit success 时传递 taskId
- `src/views/Board.vue:204-209` - 修改 handleTaskDialogSuccess 接收并选中任务

---

# <!-- task-id: 1760835990443-pghe0plzm -->
#### 3. 保存任务 bug

**状态：** 已完成
**优先级：** 中
**标签：** Bug
**创建时间：** 2025/10/19 09:06:30
**更新时间：** 2025/10/19 09:45:00

**任务描述：**

创建任务 -> cmd+s
预期: 创建任务，并且任务详情变为编辑任务（已实现）
此时，再 cmd+s
预期: 保存并更新任务
实际: 又创建了一个新的任务（bug，需修复）

**问题分析：**

在 `handleSubmit()` 函数中，判断是创建还是更新任务的条件是 `if (props.task)`。但是在创建任务后：
- `props.task` 仍然是 `null`（因为是从父组件传递的，父组件没有更新）
- 只有 `currentTask.value` 被更新为新创建的任务

所以再次保存时，条件 `if (props.task)` 为 false，导致又走了创建逻辑。

**解决方案：**

将判断条件从 `if (props.task)` 改为 `if (currentTask.value)`：

```typescript
async function handleSubmit(): Promise<boolean> {
  try {
    await formRef.value?.validate()

    // 使用 currentTask 而不是 props.task 来判断是更新还是创建
    // 这样在创建任务后再次保存时，会正确执行更新逻辑
    if (currentTask.value) {
      // 更新任务
      const changes = detectChanges(currentTask.value)
      const existingChangelog = currentTask.value.changelog || []
      // ... 使用 currentTask.value 的所有字段

      const updatedTask: Task = {
        id: currentTask.value.id,
        projectId: currentTask.value.projectId,
        // ... 其他字段
      }
      taskStore.updateTask(currentTask.value.id, updatedTask)
      // ...
    } else {
      // 创建新任务
      // ...
      currentTask.value = newTask  // 创建后更新 currentTask
    }

    return true
  } catch (error) {
    return false
  }
}
```

**修改文件：**
- `src/components/TaskDialog.vue:246-298` - 将所有 `props.task` 改为 `currentTask.value`

---


> 📅 导出时间：2025/10/19 09:45:00
> 🤖 由 Task Banner 生成