# Markdown 编辑器解决方案讨论

## 📋 需求分析

### 核心需求
1. **显示模式**：根据 Markdown 语法渲染好看的样式（不显示 `- [ ]`, `**` 等原始文字）
2. **编辑模式**：支持输入 `- [ ]` 转为可交互的 checkbox

### 当前问题
- Quill.js 存储 HTML 格式，复杂度高
- IME 输入法支持困难
- 样式冲突问题多
- 导出/导入需要 HTML ↔ Markdown 转换

---

## 🎯 解决方案对比

### 方案 1：纯 Textarea + Markdown 渲染器（推荐）

**架构**：
- 存储：纯 Markdown 文本
- 编辑：原生 `<textarea>`
- 显示：Markdown 渲染库（markdown-it / marked）

**优点**：
- ✅ 最简单，零学习成本
- ✅ 原生 IME 支持，无输入法问题
- ✅ 数据格式简单，直接存储 Markdown
- ✅ 导出/导入无需转换
- ✅ 体积小，性能好
- ✅ 无样式冲突

**缺点**：
- ❌ 编辑时看到原始 Markdown 语法
- ❌ 无富文本工具栏
- ❌ 需要手动输入 Markdown 语法

**适用场景**：
- 适合技术用户
- 适合以文本为主的内容
- 适合需要快速输入的场景

**实现细节**：
```vue
<!-- 编辑模式 -->
<textarea v-model="content" placeholder="支持 Markdown 语法..."></textarea>

<!-- 显示模式 -->
<div class="markdown-body" v-html="renderedMarkdown"></div>
```

**推荐库**：
- `markdown-it`（28KB，功能强大，插件丰富）
- `marked`（14KB，轻量快速）

---

### 方案 2：Markdown 实时预览编辑器

**架构**：
- 存储：纯 Markdown 文本
- 编辑：Textarea + 实时预览
- 显示：同编辑预览

**优点**：
- ✅ 编辑时可见渲染效果
- ✅ 保留 Markdown 格式
- ✅ 可以同时看到源码和效果
- ✅ IME 支持良好

**缺点**：
- ❌ 需要更多 UI 空间（分屏显示）
- ❌ 实现稍复杂

**适用场景**：
- 适合需要预览效果的场景
- 适合长文档编辑

**布局选项**：
1. 左右分屏：左边编辑，右边预览
2. 上下分屏：上边编辑，下边预览
3. 标签页切换：编辑/预览切换

---

### 方案 3：简化版 Markdown 编辑器（类 Notion）

**架构**：
- 存储：纯 Markdown 文本
- 编辑：智能输入（自动转换）
- 显示：Markdown 渲染

**优点**：
- ✅ 所见即所得体验
- ✅ 保留 Markdown 格式
- ✅ 自动识别并转换语法（如 `- [ ]` → checkbox）
- ✅ 可以添加快捷键和辅助工具栏

**缺点**：
- ❌ 实现复杂度中等
- ❌ 需要监听输入事件并处理转换逻辑

**适用场景**：
- 想要更好的编辑体验
- 愿意投入开发时间

**推荐库**：
- `@toast-ui/editor`（功能丰富，支持 WYSIWYG）
- `vditor`（国产，轻量，支持所见即所得）

---

### 方案 4：保留现有架构，仅替换 Quill

**架构**：
- 存储：HTML
- 编辑：其他富文本编辑器
- 显示：HTML 渲染

**备选编辑器**：
- `TinyMCE`（功能强大，但体积大）
- `CKEditor`（传统，稳定）
- `Tiptap`（基于 ProseMirror，现代化）

**优点**：
- ✅ 富文本编辑体验
- ✅ 所见即所得

**缺点**：
- ❌ 仍需要 HTML ↔ Markdown 转换
- ❌ 复杂度仍然较高
- ❌ 可能遇到类似的 IME 问题

---

## 💡 我的推荐

### 推荐方案：方案 1（纯 Textarea + markdown-it）

**理由**：
1. **最简单可靠**：使用原生组件，无兼容性问题
2. **完美符合需求**：
   - 显示时渲染 Markdown → ✅
   - 支持输入 checkbox 语法 → ✅（手动输入 `- [ ]`）
3. **数据一致性**：存储即 Markdown，无转换损失
4. **易于维护**：代码简单，无第三方库的坑
5. **性能优秀**：渲染速度快，体积小

**增强建议**：
- 添加简单的工具栏（可选）：插入链接、加粗、列表等快捷按钮
- 添加快捷键支持：Cmd/Ctrl + B → `**粗体**`
- 添加 Tab 键缩进支持
- 添加预览切换按钮

---

## 🔧 实现细节（方案 1）

### 1. Markdown 渲染器选择

**推荐：markdown-it**

```bash
npm install markdown-it
npm install @types/markdown-it -D
```

**特点**：
- 支持 GFM（GitHub Flavored Markdown）
- 支持任务列表 `- [ ]`
- 支持表格、代码高亮
- 插件丰富，可扩展

### 2. 组件设计

```vue
<template>
  <!-- 编辑模式 -->
  <textarea
    v-if="!readOnly"
    v-model="localContent"
    :placeholder="placeholder"
    @input="handleInput"
    class="markdown-editor"
  />

  <!-- 显示模式 -->
  <div
    v-else
    class="markdown-preview"
    v-html="renderedHtml"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true // 支持换行
})

// 启用任务列表插件
md.use(require('markdown-it-task-lists'), {
  enabled: true,
  label: true
})

const localContent = ref(props.modelValue || '')

const renderedHtml = computed(() => {
  return md.render(localContent.value)
})
</script>
```

### 3. 样式增强

可以使用：
- `github-markdown-css`：GitHub 风格的 Markdown 样式
- 自定义 CSS：参考你现有的 quill-custom.css

### 4. 可选工具栏

如果需要辅助工具栏，可以添加简单按钮：

```vue
<div class="toolbar">
  <button @click="insertBold">B</button>
  <button @click="insertItalic">I</button>
  <button @click="insertLink">🔗</button>
  <button @click="insertCheckbox">☑️</button>
  <button @click="insertCode">{ }</button>
</div>

<script>
const insertCheckbox = () => {
  insertText('- [ ] ')
}

const insertBold = () => {
  wrapSelection('**', '**')
}
</script>
```

### 5. 数据库存储

```typescript
interface Task {
  content: string // 直接存储 Markdown 文本
  // ... 其他字段
}
```

---

## 📊 技术对比表

| 特性 | 方案1 Textarea | 方案2 预览编辑 | 方案3 智能编辑 | 方案4 其他富文本 |
|------|---------------|---------------|---------------|----------------|
| 实现复杂度 | ⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| IME 支持 | ✅ 完美 | ✅ 完美 | ⚠️ 需处理 | ⚠️ 需处理 |
| 体积大小 | 28KB | 30KB | 100KB+ | 200KB+ |
| 学习成本 | 低 | 低 | 中 | 中 |
| 维护成本 | 低 | 中 | 中 | 高 |
| 编辑体验 | 纯文本 | 实时预览 | 所见即所得 | 所见即所得 |
| 数据格式 | Markdown | Markdown | Markdown | HTML |

---

## 🎬 迁移步骤（如选择方案 1）

1. **安装依赖**
   ```bash
   npm install markdown-it markdown-it-task-lists
   npm install github-markdown-css
   npm uninstall quill @vueup/vue-quill
   ```

2. **创建新组件** `MarkdownEditor.vue`
   - 替代 `QuillEditor.vue`
   - 实现 textarea 编辑 + markdown 渲染

3. **更新使用处**
   - `TaskBasicInfo.vue`
   - `TaskActivity.vue`
   - 其他使用 QuillEditor 的地方

4. **数据迁移**
   - 如果数据库已有 HTML 数据，需转为 Markdown
   - 可以用 `turndown` 库：HTML → Markdown

5. **删除 Quill 相关**
   - 删除 `QuillEditor.vue`
   - 删除 `quill-custom.css`
   - 清理导出逻辑中的 HTML 处理

---

## ❓ 需要确认的问题

1. **编辑体验偏好**：
   - 接受原始 Markdown 编辑？
   - 还是需要实时预览？
   - 是否需要简单的工具栏辅助？

2. **现有数据**：
   - 数据库中是否已有 HTML 格式的数据？
   - 如果有，是否需要迁移？

3. **功能范围**：
   - 需要支持哪些 Markdown 语法？
   - 基础：加粗、斜体、列表、链接、代码
   - 扩展：表格、图片、任务列表、引用
   - 高级：数学公式、流程图、时序图

4. **交互细节**：
   - checkbox 是否需要在编辑模式也可点击切换？
   - 还是只在显示模式可交互？

---

## 🚀 我的建议

**快速开始**：选择方案 1
- 先实现最简单的版本（纯 textarea + markdown-it）
- 验证是否满足需求
- 如果需要，再逐步增强（添加工具栏、快捷键等）

**渐进增强路径**：
1. 第一步：纯 textarea + markdown 渲染（1-2小时）
2. 第二步：添加简单工具栏（可选，+1小时）
3. 第三步：添加快捷键支持（可选，+1小时）
4. 第四步：添加预览切换（可选，+1小时）

这样可以快速验证方案，避免一次性投入过多。
