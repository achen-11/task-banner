<template>
  <div class="p-8">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">我的任务</h1>
      <p class="text-gray-500">所有项目中分配给我的任务和我创建的任务</p>
    </div>

    <!-- 筛选栏 -->
    <div class="bg-white rounded-md shadow-md p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-gray-700 mb-1">项目</label>
          <select class="w-full border border-gray-200 rounded-md px-3 py-2 text-sm">
            <option value="">全部项目</option>
            <option value="1">TaskFlow 开发</option>
            <option value="2">个人学习计划</option>
          </select>
        </div>

        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
          <select class="w-full border border-gray-200 rounded-md px-3 py-2 text-sm">
            <option value="">全部状态</option>
            <option value="todo">待办</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
          </select>
        </div>

        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-gray-700 mb-1">优先级</label>
          <select class="w-full border border-gray-200 rounded-md px-3 py-2 text-sm">
            <option value="">全部优先级</option>
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
            <option value="urgent">紧急</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 任务列表 -->
    <div class="bg-white rounded-md shadow-md">
      <div class="bg-gray-50 border-b border-gray-200 px-4 py-3">
        <div class="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500">
          <div class="col-span-5">任务名称</div>
          <div class="col-span-2">负责人</div>
          <div class="col-span-2">截止日期</div>
          <div class="col-span-1">优先级</div>
          <div class="col-span-2">状态</div>
        </div>
      </div>

      <div class="divide-y divide-gray-100">
        <div
          v-for="task in tasks"
          :key="task.id"
          class="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
        >
          <div class="col-span-5 text-gray-900">{{ task.title }}</div>
          <div class="col-span-2 text-gray-600">{{ task.assignee?.displayName || task.assignee?.username || task.assignee?.email || task.assigneeId || '未指派' }}</div>
          <div class="col-span-2 text-gray-600">{{ task.dueDate }}</div>
          <div class="col-span-1">
            <span
              class="px-2 py-1 text-xs rounded"
              :class="{
                'bg-red-50 text-red-600': task.priority === 'urgent',
                'bg-orange-50 text-orange-600': task.priority === 'high',
                'bg-yellow-50 text-yellow-600': task.priority === 'medium',
                'bg-gray-50 text-gray-600': task.priority === 'low'
              }"
            >
              {{ priorityText(task.priority) }}
            </span>
          </div>
          <div class="col-span-2">
            <span
              class="px-2 py-1 text-xs rounded"
              :class="{
                'bg-blue-50 text-blue-600': task.status === 'todo',
                'bg-yellow-50 text-yellow-600': task.status === 'in_progress',
                'bg-green-50 text-green-600': task.status === 'completed'
              }"
            >
              {{ statusText(task.status) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 任务列表
const tasks = ref<any[]>([])

// 优先级文本
const priorityText = (priority: string) => {
  const map: any = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急'
  }
  return map[priority] || priority
}

// 状态文本
const statusText = (status: string) => {
  const map: any = {
    todo: '待办',
    in_progress: '进行中',
    completed: '已完成'
  }
  return map[status] || status
}

// 加载任务列表
const loadTasks = async () => {
  // TODO: 从 API 加载任务
  tasks.value = [
    {
      id: 1,
      title: '实现用户认证功能',
      assignee: '张三',
      dueDate: '2025-11-01',
      priority: 'high',
      status: 'in_progress'
    },
    {
      id: 2,
      title: '完成项目布局设计',
      assignee: '李四',
      dueDate: '2025-10-28',
      priority: 'urgent',
      status: 'todo'
    },
    {
      id: 3,
      title: '编写 API 文档',
      assignee: '王五',
      dueDate: '2025-11-05',
      priority: 'medium',
      status: 'todo'
    }
  ]
}

onMounted(() => {
  loadTasks()
})
</script>
