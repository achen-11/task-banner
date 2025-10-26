# 附件功能设计方案

## 📋 目录

- [业界产品分析](#业界产品分析)
- [设计方案对比](#设计方案对比)
- [技术实现要点](#技术实现要点)
- [数据结构设计](#数据结构设计)
- [推荐方案](#推荐方案)
- [实施路线图](#实施路线图)
- [待讨论问题](#待讨论问题)

---

## 业界产品分析

### Linear ⭐⭐⭐⭐⭐

**任务附件**：
- 在任务描述下方有独立的"附件"区域
- 清晰分类，便于查找重要文件

**评论附件**：
- 可以在评论中直接拖拽上传
- 附件显示在评论内容下方，保持上下文

**文件类型支持**：
- 图片：直接预览缩略图
- 其他文件：显示图标 + 文件名 + 大小

**交互方式**：
- ✅ 拖拽上传（Drag & Drop）
- ✅ 点击上传（Click to Upload）
- ✅ 粘贴上传（Ctrl+V 截图）

**预览功能**：
- 图片：点击后 Lightbox 全屏预览
- 其他文件：直接下载

**优点**：
- 设计简洁优雅
- 分离式设计职责清晰
- 交互体验流畅

---

### Notion ⭐⭐⭐⭐⭐

**嵌入式附件**：
- 附件作为内容块，可以嵌入在任意位置
- 支持富文本中的图片、视频、PDF

**评论附件**：
- 评论中可以添加附件
- 与内容块统一管理

**文件类型支持**：
- 图片、PDF、视频都支持预览
- 集成了文档查看器

**交互方式**：
- ✅ 拖拽上传
- ✅ 粘贴上传
- ✅ /命令快速插入

**优点**：
- 灵活性极高
- 统一的内容管理
- 强大的预览功能

**缺点**：
- 实现复杂度高
- 需要完整的富文本编辑器

---

### Jira ⭐⭐⭐⭐

**任务附件**：
- 独立的"附件"标签页
- 列表式展示，支持排序和筛选

**评论附件**：
- **不支持**（评论只能是纯文本）

**文件类型支持**：
- 支持大部分常见格式
- 图片可以预览

**交互方式**：
- ✅ 点击上传
- ✅ 拖拽上传

**优点**：
- 功能完整
- 适合文档密集型项目

**缺点**：
- UI 较为笨重
- 评论不支持附件（体验欠佳）

---

### GitHub Issues/PR ⭐⭐⭐⭐

**评论附件**：
- **只在评论中支持附件**
- 没有独立的任务附件区域

**文件类型支持**：
- 图片、视频、文档
- 图片自动内联显示

**交互方式**：
- ✅ 拖拽上传
- ✅ 粘贴上传
- ✅ 点击上传

**特点**：
- 图片直接嵌入 Markdown
- 其他文件显示下载链接
- 简洁实用

**优点**：
- 实现简单
- 粘贴截图体验极佳（开发者最爱）

**缺点**：
- 重要文件需要翻历史查找
- 不适合需要归档附件的场景

---

## 设计方案对比

### 方案 A：分离式 ⭐⭐⭐⭐⭐ (推荐)

#### 设计说明

**任务附件**：
- **位置**：左列（TaskBasicInfo）描述区域下方
- **折叠**：默认展开，可点击收起
- **用途**：与任务直接相关的重要文件（设计稿、需求文档、原型图等）

**评论附件**：
- **位置**：在每条评论的下方
- **显示**：紧跟评论内容，支持多个附件
- **用途**：讨论时临时分享的文件、截图、错误日志等

#### UI 布局

```
┌──────────────────────────────────────────────────────────┐
│ 左列 - 任务信息                                          │
│ ──────────────────────────────────────────────────────── │
│ [展开详情 ▼]                                             │
│ （状态、优先级、指派人等字段...）                        │
│                                                          │
│ 描述                                                     │
│ ┌────────────────────────────────────────────────────┐  │
│ │ 基于 Linear 设计风格，实现可调整宽度的任务详情...  │  │
│ │                                                    │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ 📎 附件 (3)                               [+ 添加文件]  │
│ ┌────────────────────────────────────────────────────┐  │
│ │ ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│ │ │🖼️ 缩略图 │  │📄 PDF   │  │🎥 视频   │          │  │
│ │ │ design-  │  │ require- │  │ demo-    │          │  │
│ │ │ mockup   │  │ ments    │  │ video    │          │  │
│ │ │ 2.3 MB   │  │ 1.1 MB   │  │ 15 MB    │          │  │
│ │ │    ✕     │  │    ✕     │  │    ✕     │          │  │
│ │ └──────────┘  └──────────┘  └──────────┘          │  │
│ └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ 右列 - 活动历史                                          │
│ ──────────────────────────────────────────────────────── │
│                                                          │
│ 张三  2 天前                                      ...    │
│ 我来处理这个任务，预计明天完成。                         │
│                                                          │
│ 📎 附件:                                                 │
│ ┌────────────────────────────────────────────────────┐  │
│ │ 🖼️ screenshot.png         500 KB            下载   │  │
│ │ [图片预览缩略图]                                   │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ 👍 2    添加反应                                         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### 优点

- ✅ **职责清晰**：任务附件归档重要文件，评论附件用于临时沟通
- ✅ **符合心智模型**：用户自然能理解两者的区别和用途
- ✅ **便于管理**：重要文件不会淹没在评论历史中
- ✅ **查找方便**：任务附件一目了然，快速访问

#### 缺点

- ❌ 需要实现两套上传逻辑（但可以复用组件）
- ❌ 数据结构稍复杂（需要两个字段）

---

### 方案 B：统一式

#### 设计说明

**所有附件都在评论中**：
- 任务创建时的附件作为"系统评论"
- 后续添加附件也通过评论
- 左列完全没有附件区域

#### UI 布局

```
┌──────────────────────────────────────────────────────────┐
│ 右列 - 活动历史                                          │
│ ──────────────────────────────────────────────────────── │
│                                                          │
│ 系统  7 天前                                             │
│ 任务已创建，包含以下附件：                               │
│ 📎 design-mockup.png         2.3 MB           下载      │
│ 📎 requirements.pdf          1.1 MB           下载      │
│                                                          │
│ ──────────────────────────────────────────────────────── │
│                                                          │
│ 张三  5 天前                                             │
│ 已经开始设计，请查看附件。                               │
│ 📎 wireframe-v1.sketch       5.2 MB           下载      │
│                                                          │
│ ──────────────────────────────────────────────────────── │
│                                                          │
│ 张三  2 天前                                             │
│ 我来处理这个任务，预计明天完成。                         │
│ 📎 screenshot.png            500 KB           下载      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### 优点

- ✅ **实现简单**：只需一套上传逻辑
- ✅ **时间线完整**：所有附件都有明确的上传时间和上传人
- ✅ **上下文丰富**：每个附件都有对应的说明

#### 缺点

- ❌ **查找困难**：需要翻阅历史才能找到重要附件
- ❌ **不够直观**：无法快速浏览任务的所有附件
- ❌ **归档不便**：不适合需要频繁访问附件的场景

---

### 方案 C：混合式

#### 设计说明

**任务附件（汇总区）**：
- 在左列独立显示所有附件（包括评论中的）
- 点击附件可跳转到对应的评论

**评论附件**：
- 评论时上传的附件自动添加到任务附件列表
- 同时在评论中显示（引用关系）

#### UI 布局

```
┌──────────────────────────────────────────────────────────┐
│ 左列 - 附件汇总（所有附件）                              │
│ ──────────────────────────────────────────────────────── │
│                                                          │
│ 📎 附件 (5)                               [+ 添加文件]  │
│ ┌────────────────────────────────────────────────────┐  │
│ │ 🖼️ design-mockup.png      张三  7天前    →评论     │  │
│ │ 📄 requirements.pdf       系统  7天前              │  │
│ │ 🎨 wireframe-v1.sketch    张三  5天前    →评论     │  │
│ │ 🖼️ screenshot.png         张三  2天前    →评论     │  │
│ │ 📹 demo-video.mp4         李四  1天前              │  │
│ └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ 右列 - 评论                                              │
│ ──────────────────────────────────────────────────────── │
│                                                          │
│ 张三  2 天前                                             │
│ 我来处理这个任务，预计明天完成。                         │
│                                                          │
│ 📎 screenshot.png  (已添加到任务附件)                   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### 优点

- ✅ **集中管理**：所有附件都能在一个地方看到
- ✅ **上下文保留**：能跳转到附件对应的评论
- ✅ **查找方便**：不用翻历史也能看到所有附件

#### 缺点

- ❌ **信息冗余**：附件在两个地方都显示
- ❌ **数据关系复杂**：需要维护附件与评论的引用关系
- ❌ **可能混淆**：用户可能不理解"已添加到任务附件"的含义

---

## 技术实现要点

### 1. 文件上传方式

```typescript
// 支持多种上传方式
interface UploadMethods {
  // 1. 点击上传按钮
  clickUpload: () => void  // <input type="file" multiple>

  // 2. 拖拽上传
  dragDrop: (event: DragEvent) => void  // ondrop 事件

  // 3. 粘贴上传（重要！适合截图）
  pasteUpload: (event: ClipboardEvent) => void  // onpaste 事件
}

// 示例：拖拽上传
function handleDrop(event: DragEvent) {
  event.preventDefault()
  const files = event.dataTransfer?.files
  if (files) {
    uploadFiles(Array.from(files))
  }
}

// 示例：粘贴上传
function handlePaste(event: ClipboardEvent) {
  const items = event.clipboardData?.items
  if (items) {
    const files = Array.from(items)
      .filter(item => item.kind === 'file')
      .map(item => item.getAsFile())
      .filter(Boolean) as File[]

    if (files.length > 0) {
      uploadFiles(files)
    }
  }
}
```

---

### 2. 文件预览

```typescript
// 根据文件类型分类处理
const fileTypeHandlers = {
  // 图片：缩略图 + Lightbox 预览
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  // PDF：使用 PDF.js 或浏览器原生预览
  pdf: ['.pdf'],
  // 视频：<video> 标签内联播放
  video: ['.mp4', '.webm', '.ogg'],
  // 音频：<audio> 标签播放
  audio: ['.mp3', '.wav', '.ogg'],
  // 文档：显示图标 + 下载链接
  document: ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
  // 压缩包：显示图标 + 下载
  archive: ['.zip', '.rar', '.7z', '.tar', '.gz'],
  // 代码：语法高亮预览
  code: ['.js', '.ts', '.vue', '.css', '.html', '.json'],
  // 其他：显示通用图标 + 下载
  other: []
}

// 获取文件类型
function getFileType(filename: string): string {
  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0] || ''

  for (const [type, extensions] of Object.entries(fileTypeHandlers)) {
    if (extensions.includes(ext)) {
      return type
    }
  }

  return 'other'
}

// 渲染附件卡片
function renderAttachment(file: Attachment) {
  const type = getFileType(file.name)

  switch (type) {
    case 'image':
      return `<img src="${file.thumbnailUrl || file.url}"
                   alt="${file.name}"
                   @click="openLightbox" />`

    case 'pdf':
      return `<a href="${file.url}" target="_blank">
                <svg>📄</svg> ${file.name}
              </a>`

    case 'video':
      return `<video controls>
                <source src="${file.url}" />
              </video>`

    default:
      return `<a href="${file.url}" download>
                <svg>📎</svg> ${file.name} (${formatSize(file.size)})
              </a>`
  }
}
```

---

### 3. 存储方案

#### Option 1: Kooboo 内置存储

```typescript
// 使用 Kooboo 的文件上传 API
async function uploadToKooboo(file: File): Promise<Attachment> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/file/upload', {
    method: 'POST',
    body: formData
  })

  const data = await response.json()

  return {
    _id: data.fileId,
    name: file.name,
    size: file.size,
    type: file.type,
    url: data.url,
    uploadedBy: getCurrentUserId(),
    uploadedAt: Date.now()
  }
}
```

**优点**：
- ✅ 无需外部依赖
- ✅ 统一的权限控制
- ✅ 部署简单

**缺点**：
- ❌ 需要占用服务器存储空间
- ❌ 带宽消耗在自己服务器上
- ❌ 可能需要实现缩略图生成

---

#### Option 2: 云存储（OSS/S3）

```typescript
// 前端直传到云存储（推荐）

// 1. 获取上传凭证
async function getUploadCredentials(): Promise<UploadCredentials> {
  const response = await fetch('/api/file/get-upload-token')
  return response.json()
}

// 2. 直接上传到 OSS
async function uploadToOSS(file: File): Promise<Attachment> {
  const credentials = await getUploadCredentials()

  const formData = new FormData()
  formData.append('key', `attachments/${Date.now()}-${file.name}`)
  formData.append('policy', credentials.policy)
  formData.append('OSSAccessKeyId', credentials.accessKeyId)
  formData.append('signature', credentials.signature)
  formData.append('file', file)

  await fetch(credentials.host, {
    method: 'POST',
    body: formData
  })

  const fileUrl = `${credentials.host}/${formData.get('key')}`

  // 3. 保存到数据库
  const attachment: Attachment = {
    _id: generateId(),
    name: file.name,
    size: file.size,
    type: file.type,
    url: fileUrl,
    uploadedBy: getCurrentUserId(),
    uploadedAt: Date.now()
  }

  return attachment
}
```

**优点**：
- ✅ CDN 加速，访问快
- ✅ 节省服务器带宽和存储
- ✅ 自动生成缩略图（OSS 服务）
- ✅ 高可用性

**缺点**：
- ❌ 需要配置云服务
- ❌ 有额外成本
- ❌ 跨域配置

---

### 4. 图片处理

```typescript
// 生成缩略图（前端方案）
async function generateThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!

        // 设置缩略图尺寸（保持宽高比）
        const maxSize = 300
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height

        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }

      img.src = e.target?.result as string
    }

    reader.readAsDataURL(file)
  })
}

// Lightbox 图片预览组件
interface LightboxProps {
  images: Attachment[]
  currentIndex: number
  onClose: () => void
}

function Lightbox({ images, currentIndex, onClose }: LightboxProps) {
  // ESC 关闭，左右箭头切换图片
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goToPrev()
      if (e.key === 'ArrowRight') goToNext()
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [])

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <img src={images[currentIndex].url} className="max-w-[90%] max-h-[90%]" />
      <button onClick={onClose}>✕</button>
      <button onClick={goToPrev}>←</button>
      <button onClick={goToNext}>→</button>
    </div>
  )
}
```

---

## 数据结构设计

### Task 模型（任务附件）

```typescript
interface Task {
  _id: string
  taskId: number
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  assignee?: string
  module?: string | string[]
  tags?: string[]
  dueDate?: number

  // 任务附件（方案 A）
  attachments?: Attachment[]

  createdAt: number
  updatedAt: number
  createdBy: string
  projectId: string
}
```

---

### TaskHistory 模型（评论附件）

```typescript
interface TaskHistory {
  _id: string
  taskId: string
  type: 'comment' | 'field_change' | 'system'
  user: string
  content: string
  timestamp: number

  // 评论附件（方案 A）
  attachments?: Attachment[]

  // 分组信息（字段变更）
  grouped?: boolean
  changes?: string[]
}
```

---

### Attachment 通用结构

```typescript
interface Attachment {
  _id: string              // 附件唯一 ID
  name: string             // 原始文件名
  size: number             // 文件大小（字节）
  type: string             // MIME type（如 image/png）
  url: string              // 访问地址（完整 URL）
  thumbnailUrl?: string    // 缩略图地址（仅图片）
  uploadedBy: string       // 上传人 ID
  uploadedAt: number       // 上传时间戳

  // 可选：图片专用字段
  width?: number           // 图片宽度
  height?: number          // 图片高度

  // 可选：关联信息（方案 C）
  relatedCommentId?: string  // 来自哪条评论
}

// 文件大小格式化工具
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 示例：
formatFileSize(1234)      // "1.21 KB"
formatFileSize(1234567)   // "1.18 MB"
```

---

### API 设计

#### 上传附件

```typescript
// POST /api/task/upload-attachment
interface UploadAttachmentRequest {
  taskId: string
  type: 'task' | 'comment'  // 任务附件 or 评论附件
  commentId?: string        // 如果是评论附件，需要提供评论 ID
  file: File
}

interface UploadAttachmentResponse {
  success: boolean
  attachment: Attachment
}
```

#### 删除附件

```typescript
// DELETE /api/task/delete-attachment
interface DeleteAttachmentRequest {
  taskId: string
  attachmentId: string
  type: 'task' | 'comment'
}

interface DeleteAttachmentResponse {
  success: boolean
}
```

#### 获取任务附件

```typescript
// GET /api/task/attachments?taskId=xxx
interface GetAttachmentsResponse {
  success: boolean
  attachments: Attachment[]
}
```

---

## 推荐方案

### 综合推荐：方案 A（分离式）+ 渐进式实现

#### 为什么选择方案 A？

1. **用户体验最佳**：
   - 重要附件不会被淹没
   - 查找和访问效率高
   - 符合用户心智模型

2. **实现复杂度适中**：
   - 两套上传逻辑可以复用组件
   - 数据结构清晰，易于维护

3. **扩展性好**：
   - 未来可以添加附件分类、标签
   - 支持附件版本管理
   - 容易实现附件搜索

4. **参考业界最佳实践**：
   - Linear、Notion 都采用类似方案
   - 经过大量用户验证

---

### 功能清单

#### 任务附件区域（左列）

**基础功能**：
- ✅ 点击"添加文件"按钮上传
- ✅ 拖拽文件到区域上传
- ✅ 显示附件列表（网格布局）
- ✅ 图片显示缩略图
- ✅ 其他文件显示图标 + 文件名 + 大小
- ✅ 删除附件（带确认）
- ✅ 下载附件

**进阶功能**：
- ⭐ 附件搜索/筛选
- ⭐ 附件排序（按时间、大小、类型）
- ⭐ 批量下载（ZIP 打包）
- ⭐ 附件版本管理

---

#### 评论附件（右列）

**基础功能**：
- ✅ 评论输入框工具栏添加"📎"按钮
- ✅ 粘贴截图自动上传（Ctrl+V）
- ✅ 附件显示在评论下方
- ✅ 图片内联预览
- ✅ 其他文件显示下载链接
- ✅ 删除评论时级联删除附件

**进阶功能**：
- ⭐ 评论中 @ 某个附件（引用）
- ⭐ 图片标注（箭头、文字）

---

#### 图片预览

**基础功能**：
- ✅ 点击图片全屏预览（Lightbox）
- ✅ ESC 关闭
- ✅ 左右箭头切换图片
- ✅ 鼠标滚轮缩放

**进阶功能**：
- ⭐ 图片旋转
- ⭐ 图片下载原图
- ⭐ 图片对比（并排显示）

---

#### 文件限制

**推荐配置**：
```typescript
const FILE_LIMITS = {
  // 单个文件大小限制
  maxFileSize: 50 * 1024 * 1024,  // 50 MB

  // 单次上传文件数量
  maxFilesPerUpload: 10,

  // 任务附件总数限制
  maxAttachmentsPerTask: 100,

  // 允许的文件类型（MIME type）
  allowedTypes: [
    'image/*',
    'video/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.*',
    'application/zip',
    'text/*'
  ],

  // 禁止的文件类型
  blockedExtensions: ['.exe', '.bat', '.sh', '.cmd']
}
```

---

## 实施路线图

### Phase 1: MVP（最小可行产品）**[优先]**

**目标**：基础的任务附件功能

**时间**：3-4 天

**功能清单**：
- ✅ 任务附件数据模型
- ✅ 左列附件区域 UI
- ✅ 点击上传文件
- ✅ 文件列表显示（图标 + 文件名 + 大小）
- ✅ 删除附件
- ✅ 下载附件
- ✅ 文件大小和类型限制
- ✅ 上传进度提示

**技术方案**：
- 存储：Kooboo 内置存储
- 前端：简单的文件列表
- 后端：基础的上传/删除 API

**不包含**：
- ❌ 评论附件
- ❌ 图片预览
- ❌ 拖拽上传
- ❌ 粘贴上传

---

### Phase 2: 增强功能 **[重要]**

**目标**：完善交互体验

**时间**：3-4 天

**功能清单**：
- ✅ 评论附件支持
- ✅ 拖拽上传
- ✅ 粘贴截图上传（重要！）
- ✅ 图片缩略图显示
- ✅ 上传区域拖拽高亮效果
- ✅ 错误处理和重试

**技术方案**：
- 复用 Phase 1 的上传组件
- 添加 ondrop、onpaste 事件
- 前端生成图片缩略图

---

### Phase 3: 预览功能 **[锦上添花]**

**目标**：提升附件查看体验

**时间**：3-4 天

**功能清单**：
- ✅ 图片 Lightbox 预览
- ✅ PDF 在线预览
- ✅ 视频播放
- ✅ 代码文件语法高亮

**技术方案**：
- Lightbox：自定义组件或使用 `vue-easy-lightbox`
- PDF：`pdfjs-dist` 或 `<iframe>`
- 视频：原生 `<video>` 标签

---

### Phase 4: 高级功能 **[可选]**

**目标**：企业级功能

**时间**：4-5 天

**功能清单**：
- ⭐ 云存储集成（OSS/S3）
- ⭐ 附件搜索和筛选
- ⭐ 批量下载
- ⭐ 附件版本管理
- ⭐ 图片标注工具
- ⭐ 附件访问权限控制

---

## 待讨论问题

### 1. 方案选择

**问题**：您更倾向于哪个方案？

- **方案 A（分离式）**：任务附件 + 评论附件分开 ⭐⭐⭐⭐⭐
- **方案 B（统一式）**：所有附件都在评论中 ⭐⭐⭐
- **方案 C（混合式）**：附件汇总 + 评论引用 ⭐⭐⭐⭐

**我的推荐**：方案 A（分离式），原因见上文

---

### 2. 存储方式

**问题**：使用哪种存储方案？

**Option 1: Kooboo 内置存储**
- ✅ 简单、无外部依赖
- ❌ 占用服务器资源

**Option 2: 云存储（阿里云 OSS / AWS S3）**
- ✅ CDN 加速、高可用
- ❌ 需要配置、有成本

**建议**：
- **MVP 阶段**：使用 Kooboo 内置存储
- **生产环境**：迁移到云存储（OSS）

---

### 3. 实施优先级

**问题**：希望先实现哪些功能？

**Option 1: 快速上线 MVP**
- Phase 1 (3-4 天)
- 只支持任务附件，基础上传/下载

**Option 2: 完整的基础功能**
- Phase 1 + Phase 2 (6-8 天)
- 任务附件 + 评论附件 + 拖拽/粘贴

**Option 3: 一次性做完**
- Phase 1 + Phase 2 + Phase 3 (9-12 天)
- 包含图片预览、PDF 查看等

**建议**：先做 Phase 1 (MVP)，验证效果后再迭代

---

### 4. 文件限制

**问题**：需要限制哪些内容？

**建议配置**：
```typescript
- 单文件大小：50 MB
- 单次上传数量：10 个
- 任务总附件数：100 个
- 允许类型：图片、文档、视频、PDF、压缩包
- 禁止类型：可执行文件（.exe、.sh、.bat）
```

**是否需要调整？**

---

### 5. 权限控制

**问题**：附件的权限如何管理？

**Option 1: 跟随任务权限**
- 能看任务的人就能看附件
- 能编辑任务的人才能删除附件

**Option 2: 独立权限**
- 附件上传人可以删除自己的附件
- 项目管理员可以删除任何附件

**建议**：Option 1（跟随任务权限），简单明了

---

### 6. UI 风格

**问题**：附件区域的展示风格？

**Option 1: 网格布局（推荐）**
```
┌────┐ ┌────┐ ┌────┐
│ 图 │ │ PDF│ │ 视 │
│ 片 │ │    │ │ 频 │
└────┘ └────┘ └────┘
```
- ✅ 视觉美观
- ✅ 图片缩略图展示好
- ❌ 占用垂直空间

**Option 2: 列表布局**
```
📄 document.pdf    1.2 MB  [下载] [删除]
🖼️ image.png       500 KB  [下载] [删除]
🎥 video.mp4       15 MB   [下载] [删除]
```
- ✅ 紧凑，省空间
- ✅ 信息完整
- ❌ 图片预览效果差

**建议**：网格布局（图片用卡片，其他用列表）

---

## 总结

### 最优方案组合

1. **设计方案**：方案 A（分离式）
2. **存储方式**：MVP 用 Kooboo，生产用 OSS
3. **实施路线**：渐进式，先 Phase 1 (MVP)
4. **文件限制**：50MB/文件，10个/次，100个/任务
5. **权限控制**：跟随任务权限
6. **UI 风格**：网格布局（图片卡片）

### 下一步

请您确认以下内容，我将开始实现：

1. ✅ 确认使用方案 A（分离式）
2. ✅ 确认先实现 Phase 1 (MVP)
3. ✅ 确认使用 Kooboo 内置存储
4. ✅ 确认文件限制配置
5. ✅ 确认 UI 采用网格布局

确认后，我将创建以下文件：
- `AttachmentUpload.vue` - 上传组件
- `AttachmentList.vue` - 附件列表组件
- `AttachmentCard.vue` - 单个附件卡片
- 更新 `TaskBasicInfo.vue` - 集成附件区域
- 更新 `TaskActivity.vue` - 评论附件（Phase 2）
- API 路由和后端逻辑

---

> 📅 文档创建时间：2025/10/26
> 🤖 由 Claude Code 生成
