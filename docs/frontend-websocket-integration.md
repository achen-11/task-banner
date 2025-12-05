# 前端 WebSocket 接入说明

## 概述

前端已成功接入 WebSocket 实时通信功能，实现了任务和评论的实时更新。

## 实现内容

### 1. WebSocket Composable

**文件**: `src/composables/useWebSocket.ts`

提供 WebSocket 连接管理的 composable：
- 自动连接/重连机制
- 心跳保持（ping/pong）
- 消息类型处理
- 错误处理和日志

### 2. WebSocket Store

**文件**: `src/stores/websocket.ts`

全局 WebSocket 状态管理：
- 连接状态管理
- 消息分发（通过自定义事件）
- 通知显示（Element Plus Notification）

### 3. 集成点

#### MainLayout (`src/layouts/MainLayout.vue`)
- 在应用启动时自动初始化 WebSocket 连接
- 在应用卸载时清理连接

#### ProjectTaskList (`src/components/project/ProjectTaskList.vue`)
- 监听任务创建/更新/删除消息
- 自动更新任务列表
- 只处理当前项目的消息

#### TaskDetailDrawer (`src/components/TaskDetailDrawer.vue`)
- 监听评论创建/更新/删除消息
- 自动刷新活动历史

#### MyTasks (`src/views/MyTasks.vue`)
- 监听任务相关消息
- 自动刷新任务列表

## 消息处理流程

1. **WebSocket 连接建立** (MainLayout)
   - 应用启动时自动连接
   - 使用用户 ID 作为连接标识

2. **消息接收** (WebSocket Store)
   - 接收服务器推送的消息
   - 触发自定义事件（`websocket:task-created` 等）

3. **组件响应** (各个组件)
   - 监听自定义事件
   - 更新本地状态
   - 刷新数据

## 消息类型

### 任务相关
- `websocket:task-created` - 任务创建
- `websocket:task-updated` - 任务更新
- `websocket:task-deleted` - 任务删除

### 评论相关
- `websocket:comment-created` - 评论创建
- `websocket:comment-updated` - 评论更新
- `websocket:comment-deleted` - 评论删除

### 通知
- `websocket:notification` - 通知消息

## 使用示例

### 在组件中监听 WebSocket 消息

```typescript
import { onMounted, onUnmounted } from 'vue'

// 处理任务创建消息
const handleTaskCreated = (event: CustomEvent) => {
  const { data, message } = event.detail
  // 只处理当前项目的消息
  if (message.projectId === currentProjectId.value) {
    // 更新任务列表
    refreshTaskList()
  }
}

onMounted(() => {
  // 监听 WebSocket 消息
  window.addEventListener('websocket:task-created', handleTaskCreated as EventListener)
})

onUnmounted(() => {
  // 移除监听
  window.removeEventListener('websocket:task-created', handleTaskCreated as EventListener)
})
```

## 自动功能

### 自动重连
- 连接断开时自动尝试重连
- 最多重试 5 次
- 重连延迟递增（3秒、6秒、9秒...）

### 心跳保持
- 每 30 秒发送一次 ping
- 服务器响应 pong
- 保持连接活跃

### 错误处理
- 连接失败不影响主应用
- 自动记录错误日志
- 用户友好的错误提示

## 测试方法

1. **打开两个浏览器窗口**
   - 窗口 A：打开项目任务列表
   - 窗口 B：打开同一个项目

2. **在窗口 B 中创建/更新/删除任务**
   - 窗口 A 应该自动看到更新

3. **在窗口 B 中添加评论**
   - 窗口 A 的任务详情应该自动刷新评论

4. **检查浏览器控制台**
   - 应该看到 WebSocket 连接日志
   - 应该看到消息接收日志

## 注意事项

1. **认证**: WebSocket 连接需要用户已登录
2. **项目过滤**: 组件会自动过滤只处理当前项目的消息
3. **性能**: 大量消息时可能需要优化（当前是广播给所有连接）
4. **兼容性**: 需要浏览器支持 WebSocket API

## 后续优化

1. 实现按项目订阅（只接收相关项目的消息）
2. 添加消息队列和去重
3. 优化大量消息时的性能
4. 添加连接状态指示器（UI 显示连接状态）
