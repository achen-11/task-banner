# 任务详情抽屉 - 设计方案

> 本文档为任务 `1761442931670-vy6v8xz20` 的解决方案讨论
>
> 创建时间：2025/10/26

---

## 一、展示方式：抽屉 vs 详情页

### 方案对比

| 特性 | 抽屉 (Drawer) | 详情页 (Page) |
|------|--------------|--------------|
| **优势** | ✅ 不离开当前页面<br>✅ 快速查看和编辑<br>✅ 保持上下文<br>✅ 适合快速操作 | ✅ 更多展示空间<br>✅ 可独立分享链接<br>✅ 浏览器历史记录<br>✅ 适合复杂任务 |
| **劣势** | ❌ 空间有限<br>❌ 不适合长内容<br>❌ URL 不变（不好分享） | ❌ 上下文切换<br>❌ 需要返回操作<br>❌ 加载新页面 |
| **适用场景** | 列表/看板快速编辑 | 任务深度编辑、讨论 |

### 推荐方案：**混合方案** ⭐

参考知名产品（Linear、Notion、Asana）的做法：

- **默认抽屉**：在列表/看板页点击任务时打开抽屉
- **独立页面**：
  - 抽屉右上角提供"在新页面打开"按钮
  - 直接访问 `/projects/:projectId/tasks/:taskId` 打开完整页面
  - 支持分享链接和收藏

**实现方式**：

```typescript
// 路由配置
{
  path: '/projects/:projectId',
  component: ProjectView,
  children: [
    {
      path: 'tasks/:taskId',
      component: TaskDetailPage,
      meta: { isModal: true } // 支持抽屉模式
    }
  ]
}

// 组件复用
<Drawer v-if="isDrawerMode">
  <TaskDetail :task-id="taskId" mode="drawer" />
</Drawer>

<div v-else class="page">
  <TaskDetail :task-id="taskId" mode="page" />
</div>
```

**用户体验**：
- 在列表页点击任务 → 抽屉打开，URL 变为 `/projects/123/tasks/456`
- 刷新页面 → 自动重新打开抽屉
- 点击"在新页面打开" → 在新标签页打开完整页面
- 复制 URL 分享给他人 → 他人可直接访问该任务

---

## 二、任务详情核心功能设计

### 2.1 整体布局

```
┌─────────────────────────────────────────────────────┐
│ [< 返回]  任务详情                          [在新页面打开] [×] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─ 基础信息区 ────────────────────────────────┐   │
│  │ [状态徽章] 任务标题（可编辑）                │   │
│  │ #1234 · 创建于 2025/10/26 · 创建人: @Alice  │   │
│  │                                              │   │
│  │ 状态: [进行中▼]  优先级: [高▼]              │   │
│  │ 指派: [@用户]    模块: [前端开发]           │   │
│  │ 标签: [Bug] [紧急]                          │   │
│  │ 截止: 2025/11/01  进度: ▓▓▓░░░░░ 30%      │   │
│  └──────────────────────────────────────────┘   │
│                                                     │
│  ┌─ 任务描述 ───────────────────────────────┐   │
│  │ [富文本编辑器 - Quill.js]                  │   │
│  │                                              │   │
│  │ 这是任务的详细描述...                       │   │
│  │ - 支持 Markdown                             │   │
│  │ - 支持代码块                                │   │
│  │ - 支持图片                                  │   │
│  │                                              │   │
│  │ [保存] [取消]                               │   │
│  └──────────────────────────────────────────┘   │
│                                                     │
│  ┌─ 活动与评论 ─────────────────────────────┐   │
│  │ [💬 评论] [📝 历史] [全部]                 │   │
│  │                                              │   │
│  │ [输入评论... @提及 😀]                      │   │
│  │                                              │   │
│  │ ─────────────────────────────────────     │   │
│  │ Timeline...                                 │   │
│  └──────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 2.2 基础信息区字段

**必填字段**：
- 标题（title）
- 状态（status）
- 优先级（priority）

**可选字段**：
- 指派人（assignee）
- 模块（module）
- 标签（tags）- 支持多选
- 截止日期（dueDate）
- 进度（progress）0-100%

**字段交互**：
- 点击即可编辑（inline editing）
- 自动保存或手动保存
- 变更记录到历史

### 2.3 状态和优先级选项

**状态（status）**：
- `todo` - 待办（灰色）
- `in_progress` - 进行中（蓝色）
- `completed` - 已完成（绿色）
- `sent_to_ai` - 已发送 AI（紫色）
- `needs_optimization` - 需要优化（黄色）

**优先级（priority）**：
- `low` - 低（绿色）
- `medium` - 中（黄色）
- `high` - 高（橙色）
- `urgent` - 紧急（红色）

---

## 三、知名任务管理工具的迭代历史方案分析

### 3.1 Linear ⭐⭐⭐⭐⭐ (最推荐)

**特点**：时间线式，简洁优雅，评论和历史混排

**UI 示例**：
```
┌─────────────────────────────────────────┐
│ Activity                                │
├─────────────────────────────────────────┤
│ ┌─ @Alice 10分钟前                     │
│ │  修改了状态: 待办 → 进行中            │
│ │                                       │
│ ├─ @Bob 2小时前                        │
│ │  添加了评论                            │
│ │  "这个任务需要先完成 API 设计"        │
│ │  💬 回复(2) 👍 3                      │
│ │                                       │
│ ├─ @Alice 昨天 15:30                   │
│ │  批量修改:                            │
│ │  · 优先级: 中 → 高                    │
│ │  · 截止日期: 11/01 → 10/28            │
│ │  · 指派给: @Bob                       │
│ │  [展开详情]                            │
│ │                                       │
│ └─ @System 3天前                       │
│    任务已创建                            │
└─────────────────────────────────────────┘
```

**优势**：
- ✅ **智能分组**：5分钟内同一用户的多次修改合并为一条
- ✅ **评论和历史统一时间线**，按时间倒序
- ✅ **清晰的视觉层级**：用户头像、时间戳、操作类型
- ✅ **可折叠**：批量修改可折叠查看详情
- ✅ **交互友好**：评论支持回复、点赞

**数据示例**：
```typescript
{
  id: "act_001",
  type: "field_update",
  userId: "alice",
  timestamp: 1729900000000,
  changes: [
    { field: "priority", oldValue: "medium", newValue: "high" },
    { field: "dueDate", oldValue: "2025-11-01", newValue: "2025-10-28" },
    { field: "assignee", oldValue: null, newValue: "bob" }
  ]
}
```

---

### 3.2 Notion ⭐⭐⭐⭐

**特点**：页面属性变更 + 独立评论系统

**UI 示例**：
```
┌─────────────────────────────────────────┐
│ Comments & Activity                     │
├─────────────────────────────────────────┤
│ 💬 Comments (3)                         │
│ ┌─────────────────────────────────────┐ │
│ │ @Alice 2小时前                      │ │
│ │ 这个功能需要UI设计确认              │ │
│ │ [回复] [😀] 👍 2                    │ │
│ │                                     │ │
│ │  └─ @Bob 1小时前                   │ │
│ │     已经确认，可以开始开发          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 📝 Page history                         │
│ ┌─────────────────────────────────────┐ │
│ │ @Bob edited Status · 昨天 15:30     │ │
│ │ @Alice edited Priority · 2天前      │ │
│ │ [查看完整历史]                       │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**优势**：
- ✅ **评论和历史分区**，各司其职
- ✅ **评论支持嵌套回复**
- ✅ **反应表情**：快速表达态度
- ✅ **@ 提及**：通知相关人员
- ✅ **完整历史**：可查看内容变更对比（diff）

**适用场景**：
- 需要深度讨论的任务
- 评论数量较多的场景

---

### 3.3 Jira ⭐⭐⭐

**特点**：详细的活动日志，企业级

**UI 示例**：
```
┌─────────────────────────────────────────┐
│ Activity                                │
├─────────────────────────────────────────┤
│ ▼ All  ○ Comments  ○ History           │
├─────────────────────────────────────────┤
│ [🔵] Alice Wang 刚刚                   │
│      changed status from 待办 to 进行中  │
│                                         │
│ [💬] Bob Chen 2小时前                  │
│      added a comment                    │
│      "需要前端配合，预计3天完成"         │
│      [Edit] [Delete] [Quote]            │
│                                         │
│ [📎] Alice Wang 昨天 14:23             │
│      attached screenshot.png            │
│      [Download] [Preview]               │
│                                         │
│ [📊] System 3天前                      │
│      Issue created via API              │
└─────────────────────────────────────────┘
```

**优势**：
- ✅ **可过滤**：All/Comments/History 快速切换
- ✅ **类型图标**：评论、状态、附件、系统事件
- ✅ **完整的操作记录**：包括 API 调用、批量操作
- ✅ **附件支持**：文件上传、预览

**劣势**：
- ❌ 界面较重，信息密度高
- ❌ 学习成本高

---

### 3.4 Asana ⭐⭐⭐⭐

**特点**：故事式时间线，可读性强

**UI 示例**：
```
┌─────────────────────────────────────────┐
│ 📖 Task Story                           │
├─────────────────────────────────────────┤
│ Alice Wang 将此任务标记为已完成 · 刚刚  │
│ ─────────────────────────────────────── │
│                                         │
│ Bob Chen 添加了评论 · 1小时前           │
│ "UI 设计已完成，可以开始开发"           │
│ 💬 回复 · 👍 5                          │
│ ─────────────────────────────────────── │
│                                         │
│ Alice Wang 修改了截止日期 · 昨天        │
│ 从 11月1日 改为 10月28日                │
│ 原因: 需要提前上线                      │
│ ─────────────────────────────────────── │
│                                         │
│ System 任务已创建 · 3天前               │
│ 从模板"功能开发"创建                    │
└─────────────────────────────────────────┘
```

**优势**：
- ✅ **"Story" 概念**：像讲故事一样展示任务演进
- ✅ **清晰的分隔线**
- ✅ **变更原因**：可选填写修改原因
- ✅ **前后对比**：直观显示变更内容

---

### 3.5 ClickUp ⭐⭐⭐⭐

**特点**：可定制的活动流，高度灵活

**UI 示例**：
```
┌─────────────────────────────────────────┐
│ Activity  [⚙️ 过滤] [排序▼]            │
├─────────────────────────────────────────┤
│ Today                                   │
│ ┌─────────────────────────────────────┐ │
│ │ 👤 Alice · 10:30 AM                 │ │
│ │ 批量修改 (2 changes)                │ │
│ │ · Status: 待办 → 进行中              │ │
│ │ · Priority: Medium → High            │ │
│ │ [展开详情] [撤销]                    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Yesterday                               │
│ ┌─────────────────────────────────────┐ │
│ │ 💬 Bob · 3:45 PM                    │ │
│ │ "需要确认技术方案..."               │ │
│ │ 👍 2  💬 Reply  ⋯                   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 3 Days Ago                              │
│ ┌─────────────────────────────────────┐ │
│ │ 🤖 System · 10:00 AM                │ │
│ │ Task created from template           │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**优势**：
- ✅ **按日期分组**：Today/Yesterday/3 Days Ago
- ✅ **批量操作合并**：避免刷屏
- ✅ **可过滤**：活动类型、用户、日期范围
- ✅ **撤销功能**：快速回滚操作

---

## 四、推荐方案：Linear 风格 + 增强功能

### 4.1 核心设计原则

1. **评论和历史混排**，统一时间线（参考 Linear）
2. **智能分组**：5分钟内同一用户的多次修改合并显示
3. **清晰的视觉层级**：用户、时间、操作类型一目了然
4. **可过滤**：快速切换查看评论/历史/全部
5. **支持交互**：评论、回复、点赞、@ 提及

### 4.2 UI 设计

```vue
<template>
  <div class="activity-section">
    <!-- 顶部过滤器 -->
    <div class="filter-tabs">
      <button :class="{ active: filter === 'all' }" @click="filter = 'all'">
        全部 ({{ totalCount }})
      </button>
      <button :class="{ active: filter === 'comments' }" @click="filter = 'comments'">
        💬 评论 ({{ commentCount }})
      </button>
      <button :class="{ active: filter === 'history' }" @click="filter = 'history'">
        📝 历史 ({{ historyCount }})
      </button>
    </div>

    <!-- 评论输入框 -->
    <div class="comment-input">
      <Avatar :user="currentUser" size="small" />
      <QuillEditor
        v-model="newComment"
        placeholder="添加评论... 使用 @ 提及他人"
        :modules="editorModules"
      />
      <button @click="submitComment" :disabled="!newComment">发送</button>
    </div>

    <!-- 时间线 -->
    <div class="timeline">
      <div
        v-for="item in filteredActivities"
        :key="item.id"
        class="timeline-item"
        :class="`timeline-item--${item.type}`"
      >
        <!-- 用户头像 -->
        <Avatar :user="item.user" class="timeline-avatar" />

        <!-- 连接线 -->
        <div class="timeline-line"></div>

        <!-- 内容区 -->
        <div class="timeline-content">
          <!-- 头部：用户名 + 时间 -->
          <div class="timeline-header">
            <strong>{{ item.user.name }}</strong>
            <time :title="formatFullTime(item.timestamp)">
              {{ formatRelativeTime(item.timestamp) }}
            </time>
          </div>

          <!-- 评论内容 -->
          <div v-if="item.type === 'comment'" class="comment-body">
            <div class="comment-content" v-html="item.content"></div>
            <div class="comment-actions">
              <button @click="reply(item)">💬 回复</button>
              <ReactionPicker @select="addReaction(item, $event)" />
              <Reactions :reactions="item.reactions" />
            </div>

            <!-- 回复列表 -->
            <div v-if="item.replies?.length" class="replies">
              <div v-for="reply in item.replies" :key="reply.id" class="reply-item">
                <!-- 回复内容... -->
              </div>
            </div>
          </div>

          <!-- 字段变更 -->
          <div v-else-if="item.changes" class="field-changes">
            <div v-if="item.changes.length === 1" class="single-change">
              {{ getChangeText(item.changes[0]) }}
            </div>
            <div v-else class="batch-changes">
              <summary @click="item.expanded = !item.expanded">
                批量修改 ({{ item.changes.length }} 项)
                <span>{{ item.expanded ? '▼' : '▶' }}</span>
              </summary>
              <div v-if="item.expanded" class="changes-list">
                <div v-for="change in item.changes" :key="change.field">
                  · {{ getChangeText(change) }}
                </div>
              </div>
            </div>
          </div>

          <!-- 系统事件 -->
          <div v-else-if="item.type === 'system'" class="system-event">
            {{ item.message }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

### 4.3 数据结构设计

**ActivityItem 接口**：

```typescript
interface ActivityItem {
  id: string
  type: 'comment' | 'field_update' | 'system'
  userId: string
  user: {
    _id: string
    name: string
    avatar?: string
  }
  timestamp: number

  // 评论相关
  content?: string              // Quill Delta JSON
  mentions?: string[]           // 被 @ 的用户 ID
  reactions?: Reaction[]        // 反应表情
  replies?: ActivityItem[]      // 回复（嵌套评论）
  replyTo?: string             // 回复的评论 ID

  // 字段变更相关
  changes?: FieldChange[]       // 批量修改

  // 系统事件
  message?: string             // 系统消息

  // UI 状态
  expanded?: boolean           // 是否展开（批量修改时）
}

interface FieldChange {
  field: string                // 'status', 'priority', 'assignee', 'module', 'tag', etc.
  oldValue: any
  newValue: any
  displayOldValue?: string     // 用于显示的旧值（如用户名而不是 ID）
  displayNewValue?: string     // 用于显示的新值
}

interface Reaction {
  emoji: string                // '👍', '❤️', '😀'
  users: string[]              // 点了这个表情的用户 ID 列表
}
```

**后端数据模型（TaskHistory）**：

```typescript
// kb-task/src/code/Models/TaskHistory.ts
export const TaskHistory = ksql.define('task_histories', {
  taskId: {
    type: DataTypes.String,
    required: true,
    ref: { tableName: 'tasks', fieldName: '_id' },
    index: true
  },
  userId: {
    type: DataTypes.String,
    required: true,
    ref: { tableName: 'users', fieldName: '_id' }
  },
  type: {
    type: DataTypes.String,
    required: true,
    // 'comment', 'status', 'priority', 'assignee', 'module', 'tag', 'description', 'system'
    index: true
  },

  // 评论内容（Quill Delta JSON）
  content: {
    type: DataTypes.String,
    default: ''
  },

  // 被 @ 的用户
  mentions: {
    type: DataTypes.String,  // JSON 数组
    default: '[]'
  },

  // 字段变更
  fieldName: {
    type: DataTypes.String,
    default: ''
  },
  oldValue: {
    type: DataTypes.String,
    default: ''
  },
  newValue: {
    type: DataTypes.String,
    default: ''
  },

  // 回复关系
  replyTo: {
    type: DataTypes.String,  // 回复的评论 ID
    default: ''
  },

  // 分组 ID（同一批次操作共享）
  groupId: {
    type: DataTypes.String,
    default: ''
  }
}, {
  timestamps: true,
  indexes: [
    { columns: ['taskId', 'createdAt'], name: 'task_time_idx' }
  ]
})
```

### 4.4 智能分组算法

```typescript
/**
 * 智能分组活动记录
 * - 5分钟内同一用户的字段修改合并为一条
 * - 评论不参与合并
 */
function groupActivities(activities: ActivityItem[]): ActivityItem[] {
  const grouped: ActivityItem[] = []
  let currentGroup: ActivityItem | null = null

  for (const activity of activities) {
    const isFieldUpdate = activity.type === 'field_update'
    const isComment = activity.type === 'comment'

    // 评论和系统事件不合并
    if (isComment || activity.type === 'system') {
      currentGroup = null
      grouped.push(activity)
      continue
    }

    // 判断是否应该合并到当前组
    const shouldMerge =
      currentGroup &&
      isFieldUpdate &&
      currentGroup.type === 'field_update' &&
      currentGroup.userId === activity.userId &&
      activity.timestamp - currentGroup.timestamp < 5 * 60 * 1000 // 5分钟

    if (shouldMerge && currentGroup.changes && activity.changes) {
      // 合并到当前组
      currentGroup.changes.push(...activity.changes)
      currentGroup.timestamp = activity.timestamp // 更新为最新时间
    } else {
      // 创建新组
      currentGroup = activity
      grouped.push(activity)
    }
  }

  return grouped
}
```

### 4.5 变更文本生成

```typescript
/**
 * 生成友好的变更描述文本
 */
function getChangeText(change: FieldChange): string {
  const fieldLabels: Record<string, string> = {
    status: '状态',
    priority: '优先级',
    assignee: '指派人',
    module: '模块',
    tag: '标签',
    dueDate: '截止日期',
    progress: '进度'
  }

  const label = fieldLabels[change.field] || change.field
  const oldVal = change.displayOldValue || change.oldValue || '无'
  const newVal = change.displayNewValue || change.newValue || '无'

  return `修改了${label}: ${oldVal} → ${newVal}`
}

/**
 * 格式化相对时间
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`

  return new Date(timestamp).toLocaleDateString('zh-CN')
}
```

---

## 五、Quill.js 富文本编辑器集成

### 5.1 安装依赖

```bash
npm install quill @vueup/vue-quill
npm install quill-mention  # @ 提及功能
```

### 5.2 配置

```typescript
// composables/useQuillEditor.ts
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import Quill from 'quill'
import QuillMention from 'quill-mention'
import 'quill-mention/dist/quill.mention.css'

Quill.register('modules/mention', QuillMention)

export const editorOptions = {
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
    mention: {
      allowedChars: /^[A-Za-z\u4e00-\u9fa5]*$/,
      mentionDenotationChars: ['@'],
      source: async function(searchTerm: string, renderList: Function) {
        // 从 API 获取用户列表
        const users = await fetchProjectMembers(searchTerm)
        renderList(users, searchTerm)
      },
      renderItem: (item: any) => {
        return `${item.value} <small>${item.email}</small>`
      }
    }
  },
  placeholder: '添加评论... 使用 @ 提及他人',
  theme: 'snow'
}
```

### 5.3 组件使用

```vue
<template>
  <div class="editor-wrapper">
    <QuillEditor
      v-model:content="content"
      :options="editorOptions"
      content-type="delta"
      @ready="onEditorReady"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'
import { editorOptions } from '@/composables/useQuillEditor'

const content = ref('')
const editor = ref<any>(null)

const onEditorReady = (quill: any) => {
  editor.value = quill
}

// 提取 @ 提及的用户
const extractMentions = (delta: any): string[] => {
  const mentions: string[] = []
  delta.ops.forEach((op: any) => {
    if (op.insert?.mention) {
      mentions.push(op.insert.mention.id)
    }
  })
  return mentions
}
</script>
```

---

## 六、API 设计

### 6.1 获取任务详情

```typescript
// GET /api/task/detail?id=xxx
{
  _id: string
  taskId: string
  projectId: string
  moduleId: string
  title: string
  content: string        // Quill Delta JSON
  status: string
  priority: string
  assigneeId: string
  creatorId: string
  dueDate: number
  progress: number
  tags: string[]         // 标签 ID 数组
  createdAt: number
  updatedAt: number
}
```

### 6.2 获取活动历史

```typescript
// GET /api/task/activities?taskId=xxx&page=1&size=20&type=all|comment|history
{
  items: [
    {
      _id: string
      taskId: string
      userId: string
      type: 'comment' | 'status' | 'priority' | 'assignee' | ...
      content?: string
      mentions?: string[]
      fieldName?: string
      oldValue?: string
      newValue?: string
      replyTo?: string
      createdAt: number

      // 关联数据（后端 join 查询）
      user: {
        _id: string
        name: string
        avatar?: string
      }
    }
  ],
  total: number
}
```

### 6.3 添加评论

```typescript
// POST /api/task/addComment
{
  taskId: string
  content: string        // Quill Delta JSON
  mentions?: string[]    // 被 @ 的用户 ID
  replyTo?: string      // 回复的评论 ID
}

// Response
{
  _id: string
  taskId: string
  userId: string
  type: 'comment'
  content: string
  mentions: string[]
  replyTo?: string
  createdAt: number
}
```

### 6.4 更新任务字段

```typescript
// POST /api/task/update
{
  id: string
  updates: {
    title?: string
    status?: string
    priority?: string
    assigneeId?: string
    moduleId?: string
    tags?: string[]
    dueDate?: number
    progress?: number
  }
}

// 后端自动记录历史
// 对于每个修改的字段，创建一条 TaskHistory 记录
```

### 6.5 添加反应

```typescript
// POST /api/task/addReaction
{
  historyId: string     // 评论或历史记录的 ID
  emoji: string         // '👍', '❤️', '😀'
}

// 后端逻辑：
// 1. 查找 TaskHistory 记录
// 2. 解析 reactions JSON
// 3. 如果用户已点过该表情，则移除；否则添加
// 4. 更新记录
```

---

## 七、实现优先级与里程碑

### P0 - MVP 核心功能 (第一版)

**目标**：基本可用的任务详情页

- [ ] 抽屉组件框架
- [ ] 基础信息展示和编辑
  - [ ] 标题（inline edit）
  - [ ] 状态、优先级下拉选择
  - [ ] 指派人、模块、标签选择器
- [ ] 简单的描述编辑（textarea，暂不集成 Quill）
- [ ] 基础活动历史
  - [ ] 显示字段变更记录
  - [ ] 按时间倒序

**工作量估算**：2-3 天

---

### P1 - 富文本与评论 (第二版)

**目标**：支持富文本编辑和评论

- [ ] 集成 Quill.js 编辑器
  - [ ] 基础工具栏（加粗、斜体、列表、链接）
  - [ ] 代码块、引用
  - [ ] 图片上传
- [ ] 评论系统
  - [ ] 添加评论
  - [ ] 评论列表展示
  - [ ] 评论和历史混排时间线
- [ ] 智能分组算法
  - [ ] 5分钟内批量修改合并

**工作量估算**：3-4 天

---

### P2 - 高级交互 (第三版)

**目标**：提升用户体验

- [ ] @ 提及功能
  - [ ] Quill mention 插件
  - [ ] 提及用户通知
- [ ] 反应表情
  - [ ] 点赞/表情选择器
  - [ ] 反应列表展示
- [ ] 评论回复
  - [ ] 嵌套回复
  - [ ] 引用回复
- [ ] 活动过滤
  - [ ] 全部/评论/历史切换
  - [ ] 按用户过滤

**工作量估算**：3-4 天

---

### P3 - 完善与优化 (第四版)

**目标**：补充完整功能

- [ ] 独立详情页
  - [ ] 路由配置
  - [ ] "在新页面打开"功能
  - [ ] 分享链接
- [ ] 附件支持
  - [ ] 文件上传
  - [ ] 文件预览
  - [ ] 文件下载
- [ ] 更多交互
  - [ ] 撤销操作
  - [ ] 任务复制
  - [ ] 任务删除
- [ ] 性能优化
  - [ ] 虚拟滚动（长列表）
  - [ ] 懒加载历史记录

**工作量估算**：4-5 天

---

## 八、技术栈总结

### 前端

| 功能 | 技术方案 | 说明 |
|------|---------|------|
| 抽屉组件 | 自定义 Vue 组件 + Teleport | 或使用 Headless UI |
| 富文本编辑器 | Quill.js | 轻量、成熟、可扩展 |
| @ 提及 | quill-mention | Quill 官方推荐插件 |
| 表情选择器 | emoji-picker-element | 原生 Web Component |
| 日期选择器 | VCalendar | Vue 3 日期组件 |
| 图片上传 | 自定义 + OSS | 支持拖拽、粘贴 |

### 后端

| 功能 | 技术方案 | 说明 |
|------|---------|------|
| 任务模型 | Task (已有) | 基础任务信息 |
| 历史模型 | TaskHistory (需新建) | 评论 + 字段变更 |
| 通知 | Notification (已有) | @ 提及通知 |
| 文件存储 | 本地/OSS | 图片、附件 |

---

## 九、UI/UX 细节建议

### 9.1 抽屉尺寸

- **宽度**：600px（中等）或 800px（宽松）
- **高度**：100vh
- **位置**：从右侧滑入

### 9.2 颜色主题

**状态颜色**：
- 待办：`bg-gray-100 text-gray-700`
- 进行中：`bg-blue-100 text-blue-700`
- 已完成：`bg-green-100 text-green-700`
- 发送 AI：`bg-purple-100 text-purple-700`
- 需优化：`bg-yellow-100 text-yellow-700`

**优先级颜色**：
- 低：`text-green-600`
- 中：`text-yellow-600`
- 高：`text-orange-600`
- 紧急：`text-red-600`

### 9.3 交互动画

```css
/* 抽屉滑入 */
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.3s ease-out;
}

.drawer-enter-from {
  transform: translateX(100%);
}

.drawer-leave-to {
  transform: translateX(100%);
}

/* 活动项淡入 */
.timeline-item {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 9.4 响应式设计

- **桌面端（>1024px）**：抽屉 800px
- **平板端（768px-1024px）**：抽屉 600px
- **移动端（<768px）**：全屏模式

---

## 十、参考资料

### 产品参考
- [Linear](https://linear.app/) - 最佳实践参考
- [Notion](https://notion.so/) - 评论系统参考
- [Asana](https://asana.com/) - 任务详情参考
- [ClickUp](https://clickup.com/) - 可定制性参考

### 技术文档
- [Quill.js 官方文档](https://quilljs.com/docs/)
- [quill-mention 插件](https://github.com/quill-mention/quill-mention)
- [Vue 3 Teleport](https://vuejs.org/guide/built-ins/teleport.html)
- [Headless UI](https://headlessui.com/) - 无样式组件库

---

## 总结

**推荐最终方案**：

1. ✅ **展示方式**：默认抽屉 + 支持独立页面（URL 变化）
2. ✅ **迭代历史**：Linear 风格统一时间线 + 智能分组
3. ✅ **富文本**：Quill.js + mention 插件
4. ✅ **评论系统**：支持 @ 提及、反应表情、嵌套回复
5. ✅ **实施路径**：按 P0 → P1 → P2 → P3 逐步迭代

**核心优势**：
- 🎯 用户体验好：不离开上下文，快速操作
- 🔗 可分享：支持 URL 直达任务
- 📝 历史清晰：时间线展示，智能分组
- 💬 讨论友好：评论、回复、@ 提及一应俱全
- 🚀 可扩展：为后续附件、子任务等功能预留空间

需要我详细设计某个具体模块的实现吗？
