## 🤖 AI 协作指引

### 任务处理流程
1. **阅读任务**：仔细阅读下方的任务需求，理解每个任务的目标、技术要点和参考资料
2. **实现任务**：根据项目技术栈和任务描述完成开发
3. **保留元数据**：在返回结果时，务必保留每个任务的 task-id 注释（`<!-- task-id: xxx -->`）
4. **更新任务信息**：
   - 将任务状态更新为「已完成」
   - **添加任务摘要**：在任务描述开头添加 `**任务摘要：** <一句话总结>`
   - 补充实现细节（修改文件、技术要点等）
   - 如有修改文件，在技术要点中注明
5. **返回格式**：保持 Markdown 格式不变，返回完整的文档内容

### 📝 任务摘要编写规范
- **长度**：20-50 字
- **内容**：用一句话概括完成了什么，解决了什么问题
- **示例**：
  - ✅ "实现了用户登录功能，支持账号密码和第三方登录"
  - ✅ "修复了任务列表排序 bug，优化了性能"
  - ✅ "添加了任务导出功能，支持 Markdown 格式"
  - ❌ "将描述从 xxx 改为 xxx"（太粗暴）
  - ❌ "已在 Service 层实现..."（太技术化）

### ⚠️ 重要提醒
- 必须保留所有 `<!-- task-id: xxx -->` 注释，这是任务回填的关键标识
- 保持 Markdown 结构完整，不要删除任何标题层级
- 任务摘要必须简洁明了，便于快速理解任务变更内容

---

## 任务列表

共 1 个任务

### 🟡 中优先级

<!-- task-id: ca9bace2-b02d-4a14-b560-cdb937601330 -->
#### 1. 快捷键系统

**状态：** 已完成
**优先级：** 中
**创建时间：** 2025/10/26 15:22:23
**更新时间：** 2025/10/26 21:30:00

**任务描述：**

**任务摘要：** 实现了完整的全局快捷键系统，支持新建、导入导出任务及快捷键说明面板

- [x] N -> 新建任务
- [x] Cmd + b -> 展开/收起 左侧菜单栏
- [x] cmd + shift + . -> 查看快捷键说明面板
- [x] Cmd + e / i 快捷导入导出 (参照task-banner)

在支持快捷键的按钮上添加 hover 提醒(显示快捷键)

**实现细节：**

**新建的文件：**
1. `src/composables/useKeyboard.ts` - 全局快捷键管理系统
2. `src/components/common/KeyboardShortcutsPanel.vue` - 快捷键说明面板

**修改的文件：**
1. `src/layouts/MainLayout.vue` - 集成快捷键系统
2. `src/components/project/ProjectTaskList.vue` - 任务快捷键注册和按钮提示

**技术要点：**

1. **全局快捷键管理系统** - useKeyboard.ts
   - 使用单例模式管理所有快捷键
   - 支持组合键（Ctrl/Cmd、Shift、Alt）
   - 智能检测操作系统（Mac/Windows）
   - 自动过滤输入框内的快捷键触发
   ```typescript
   interface KeyboardShortcut {
     key: string
     ctrl?: boolean
     meta?: boolean  // Cmd on Mac, Ctrl on Windows
     shift?: boolean
     alt?: boolean
     description: string
     handler: () => void
     category?: string
   }

   export function registerShortcut(shortcut: KeyboardShortcut)
   export function unregisterShortcut(key: string)
   export function formatShortcut(shortcut: KeyboardShortcut): string
   ```

2. **快捷键说明面板** - KeyboardShortcutsPanel.vue
   - 按类别分组显示所有快捷键
   - 使用 Element Plus Dialog 组件
   - 支持 show/hide/toggle 方法
   - 键盘显示使用 macOS 风格符号（⌘ ⌃ ⇧ ⌥）

3. **全局快捷键注册** - MainLayout.vue:46-67
   ```typescript
   // Cmd/Ctrl + B: 切换侧边栏
   registerShortcut({
     key: 'b',
     meta: true,
     description: '展开/收起左侧菜单栏',
     category: '导航',
     handler: toggleSidebar
   })

   // Cmd/Ctrl + Shift + .: 查看快捷键说明
   registerShortcut({
     key: '.',
     meta: true,
     shift: true,
     description: '查看快捷键说明',
     category: '帮助',
     handler: () => shortcutsPanelRef.value?.toggle()
   })
   ```

4. **任务操作快捷键** - ProjectTaskList.vue:657-691
   - N: 新建任务
   - Cmd+I: 快捷导入任务
   - Cmd+E: 快捷导出任务
   - 组件卸载时自动移除快捷键

5. **按钮快捷键提示** - ProjectTaskList.vue:31-41
   ```vue
   <el-tooltip content="快捷键：N" placement="bottom">
     <button @click="handleCreateTask">
       新建任务
     </button>
   </el-tooltip>
   ```

**快捷键列表：**

| 快捷键 | 功能 | 类别 |
|-------|------|------|
| N | 新建任务 | 任务操作 |
| ⌘/Ctrl + B | 展开/收起左侧菜单栏 | 导航 |
| ⌘/Ctrl + I | 快捷导入任务 | 任务操作 |
| ⌘/Ctrl + E | 快捷导出任务 | 任务操作 |
| ⌘/Ctrl + ⇧ + . | 查看快捷键说明 | 帮助 |

**效果：**
- ✅ 全局快捷键系统，支持动态注册和移除
- ✅ 智能检测操作系统，显示对应的快捷键符号
- ✅ 自动过滤输入框内的快捷键冲突
- ✅ 按钮 hover 显示快捷键提示
- ✅ 快捷键说明面板按类别分组展示
- ✅ 组件级快捷键自动清理，无内存泄漏

---


> 📅 导出时间：2025/10/26 21:30:00
> 🤖 由 Task-Flow 生成
