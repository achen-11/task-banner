<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-100">
    <div class="p-4 border-b border-gray-100 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900">项目成员 ({{ members.length }})</h2>
      <button class="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
        <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        添加成员
      </button>
    </div>

    <div v-if="loading" class="p-8 text-center">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="text-gray-500 mt-2">加载中...</p>
    </div>

    <div v-else-if="members.length === 0" class="p-8 text-center text-gray-400">
      <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <p>暂无成员数据</p>
      <p class="text-sm mt-1">点击上方"添加成员"按钮邀请成员</p>
    </div>

    <div v-else class="divide-y divide-gray-100">
      <div
        v-for="member in members"
        :key="member._id"
        class="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
            {{ getUserInitial(member.userId) }}
          </div>
          <div>
            <p class="font-medium text-gray-900">{{ member.userId }}</p>
            <p class="text-sm text-gray-500">加入于 {{ formatDate(member.joinedAt) }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span
            class="px-3 py-1 rounded-full text-xs font-medium"
            :class="getRoleBadgeClass(member.role)"
          >
            {{ getRoleText(member.role) }}
          </span>
          <button
            v-if="member.role !== 'owner'"
            class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="移除成员"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { ProjectMember } from '@/types/project'
import * as projectApi from '@/api/project'

interface Props {
  projectId: string
}

const props = defineProps<Props>()

const members = ref<ProjectMember[]>([])
const loading = ref(false)

// 获取用户名首字母
const getUserInitial = (userId: string) => {
  return userId?.charAt(0).toUpperCase() || 'U'
}

// 获取角色文本
const getRoleText = (role: string) => {
  const roleMap: Record<string, string> = {
    owner: '所有者',
    admin: '管理员',
    member: '成员'
  }
  return roleMap[role] || role
}

// 获取角色徽章样式
const getRoleBadgeClass = (role: string) => {
  const classMap: Record<string, string> = {
    owner: 'bg-purple-100 text-purple-700',
    admin: 'bg-blue-100 text-blue-700',
    member: 'bg-gray-100 text-gray-700'
  }
  return classMap[role] || 'bg-gray-100 text-gray-700'
}

// 格式化日期
const formatDate = (timestamp: number | undefined) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 加载项目成员
const loadMembers = async () => {
  if (!props.projectId) return

  loading.value = true
  try {
    const response = await projectApi.getProjectMembers(props.projectId)
    members.value = response.items
  } catch (error) {
    console.error('Failed to load members:', error)
    members.value = []
  } finally {
    loading.value = false
  }
}

// 监听 projectId 变化
watch(() => props.projectId, () => {
  loadMembers()
}, { immediate: true })

onMounted(() => {
  loadMembers()
})
</script>
