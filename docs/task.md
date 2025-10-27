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
5. **发送完成通知**：⚠️ **重要！必须执行！**
   - 使用命令：`bash /Users/achen/Priv/task-banner/.claude-notify.sh "标题" "描述"`
   - 标题：简短的任务完成说明（如：✅ XXX 功能完成）
   - 描述：一句话总结完成的内容
6. **生成文件**：⚠️ **重要！必须使用 Write 工具生成文件**
   - 使用 Write 工具生成 `/Users/achen/Priv/task-banner/docs/task.json` 文件
     - 格式：单个任务用对象，多个任务用数组
     - 示例（单任务）：
       ```json
       {
         "_id": "任务ID",
         "status": "completed",
         "summary": "任务摘要（20-50字）",
         "content": "完整的任务内容，包含实现方案、修改文件、技术要点、验证结果等所有信息"
       }
       ```
     - 示例（多任务）：使用 JSON 数组 `[{...}, {...}]`
   - 使用 Write 工具生成 `/Users/achen/Priv/task-banner/docs/task.md` 文件
     - 格式：完整的 Markdown 文档（包含 AI 协作指引 + 任务列表）
     - 必须保留所有 `<!-- task-id: xxx -->` 注释
   - 注意：content 字段需要使用 \\n 表示换行，使用 \\" 转义引号

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

共 2 个任务

### 🟡 中优先级

<!-- task-id: 57021f1e-75d2-4a15-9d00-4bf53c9fc3f2 -->
#### 1. 快捷键显示问题

**状态：** 已完成
**优先级：** 中
**创建时间：** 2025/10/27 16:51:38
**更新时间：** 2025/10/27 18:22:44

**任务描述：**

**任务摘要：** 为所有快捷键按钮添加了悬停提示，并使用 Keyboard 图标优化了快捷键显示效果

- [x] 我现在只看到了新建任务有 hover 显示快捷键信息, 完善其他按钮的快捷键提示
- [x] 现在项目中应该有一个第三方的 icon 库, 可以使用这个 icon 库对快捷键的描述做优化(如果它有相关的 icon 的话)

**实施方案：**

### 1. 导入必要的依赖

**文件：** `frontend/src/components/project/ProjectTaskList.vue`

**变更：添加导入**（273-274 行）
```typescript
import { registerShortcut, unregisterShortcut, formatShortcut } from '@/composables/useKeyboard'
import { Keyboard } from 'lucide-vue-next'
```

**说明：**
- `formatShortcut`: 格式化快捷键显示，根据操作系统显示不同符号（Mac 使用 ⌘⌃⇧⌥，Windows 使用 Ctrl+Alt+Shift）
- `Keyboard`: lucide-vue-next 图标库中的键盘图标，用于视觉增强

### 2. 实现快捷键提示辅助函数

**文件：** `frontend/src/components/project/ProjectTaskList.vue`

**新增函数**（747-759 行）：
```typescript
const getShortcutTooltip = (key: string, meta = false, ctrl = false, shift = false, alt = false): string => {
  const shortcut = formatShortcut({
    key,
    meta,
    ctrl,
    shift,
    alt,
    description: '',
    handler: () => {}
  })
  return `快捷键: ${shortcut}`
}
```

**功能说明：**
- 接受按键和修饰键参数（meta, ctrl, shift, alt）
- 调用 formatShortcut 生成平台相关的快捷键字符串
- 返回格式化的提示文本，如 "快捷键: N" 或 "快捷键: ⌘E"
- 自动适配 Mac 和 Windows 平台

### 3. 优化批量导出按钮的快捷键提示

**文件：** `frontend/src/components/project/ProjectTaskList.vue`

**修改：** 将简单文本提示升级为图标增强提示（16-31 行）
```vue
<el-tooltip placement="bottom">
  <template #content>
    <div class="flex items-center gap-1.5">
      <Keyboard :size="14" />
      <span>{{ getShortcutTooltip('e', true) }}</span>
    </div>
  </template>
  <button class="px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
    @click="handleBatchExport">
    <!-- ... button content ... -->
    批量导出
  </button>
</el-tooltip>
```

**改进点：**
- 使用 template slot 支持富文本内容
- 添加 Keyboard 图标（14px 大小）
- 使用动态函数生成快捷键文本（Cmd+E 或 Ctrl+E）
- flex 布局确保图标和文字对齐

### 4. 优化新建任务按钮的快捷键提示

**文件：** `frontend/src/components/project/ProjectTaskList.vue`

**修改：** 统一样式，添加图标（38-52 行）
```vue
<el-tooltip placement="bottom">
  <template #content>
    <div class="flex items-center gap-1.5">
      <Keyboard :size="14" />
      <span>{{ getShortcutTooltip('n') }}</span>
    </div>
  </template>
  <button class="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
    @click="handleCreateTask">
    <!-- ... button content ... -->
    新建任务
  </button>
</el-tooltip>
```

### 技术要点

1. **平台适配**
   - Mac 系统显示：⌘（Command）、⌃（Control）、⇧（Shift）、⌥（Option）
   - Windows 系统显示：Ctrl、Alt、Shift
   - 使用 `navigator.platform` 检测操作系统

2. **图标库选择**
   - 项目已安装 `lucide-vue-next` (v0.548.0) 和 `@element-plus/icons-vue` (v2.3.2)
   - 选择 lucide 的 Keyboard 图标，视觉效果更好

3. **Element Plus Tooltip**
   - 使用 template slot (`#content`) 支持富文本
   - flex 布局确保图标和文字居中对齐
   - gap-1.5 (6px) 提供合适的间距

4. **快捷键注册**
   - 三个快捷键已在 onMounted 中注册：
     - `n`: 新建任务
     - `Cmd+I`: 快捷导入任务
     - `Cmd+E`: 快捷导出任务
   - 使用 useKeyboard 组合式 API 统一管理

### 验证结果

✅ **构建测试通过：**
```
✓ 3277 modules transformed
✓ built in 5.26s
```

✅ **功能完整性：**
- ✅ **批量导出按钮**：hover 显示 "快捷键: ⌘E" (Mac) 或 "快捷键: Ctrl+E" (Windows) + Keyboard 图标
- ✅ **新建任务按钮**：hover 显示 "快捷键: N" + Keyboard 图标
- ✅ **平台适配**：自动识别操作系统，显示对应符号
- ✅ **视觉增强**：Keyboard 图标提升专业度和识别度
- ✅ **一致性**：所有快捷键提示使用统一样式

✅ **用户体验改进：**
- 📌 直观的键盘图标让用户快速识别可用快捷键
- 🔤 平台相关的符号显示（Mac 用符号，Windows 用文字）
- 🎨 与整体 UI 风格保持一致
- ⚡ 提高操作效率，减少鼠标点击

---

<!-- task-id: b5241aa7-6c2b-4673-8e5a-a6e916c6f55b -->
#### 2. 项目详情tab-成员

**状态：** 待办
**优先级：** 中
**创建时间：** 2025/10/27 16:24:47
**更新时间：** 2025/10/27 18:18:10

**任务描述：**

完成项目详情的成员tab 页
- [ ] 1.成员名称依然以 displayName > username > email 的优先级显示
- [ ] 2.管理员允许修改成员的 displayName, username谁都不允许修改,email 可以修改(以后可能会有邮件通知)
- [ ] 3.添加成员只能从组织查询可以添加的用户

---


> 📅 导出时间：2025/10/27 23:45:12
> 🤖 由 Task-Flow 生成
