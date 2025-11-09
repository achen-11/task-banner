<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-100">
    <div class="p-4 border-b border-gray-100 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900">项目成员 ({{ members.length }})</h2>
      <el-tooltip content="添加成员 (N)" placement="bottom">
        <el-button
          @click="showAddMemberDialog = true"
          type="primary"
          :style="{ backgroundColor: '#3762E3', borderColor: '#3762E3' }"
        >
          <el-icon class="mr-1">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </el-icon>
          添加成员
        </el-button>
      </el-tooltip>
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
        <div class="flex items-center gap-3 flex-1">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
            {{ getMemberInitial(member) }}
          </div>
          <div class="flex-1">
            <p class="font-medium text-gray-900">{{ getMemberName(member) }}</p>
            <p class="text-sm text-gray-500">
              {{ member.email || '未设置邮箱' }}
              <span class="mx-2">•</span>
              加入于 {{ formatDate(member.joinedAt) }}
            </p>
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
            v-if="(isAdmin) || member._id === String(currentUser?._id)"
            class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="编辑成员"
            @click="openEditDialog(member)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            v-if="isAdmin && member.role !== 'owner'"
            class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="移除成员"
            @click="confirmRemoveMember(member)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 添加成员对话框 -->
    <el-dialog v-model="showAddMemberDialog" title="添加成员" width="500px">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">选择用户</label>
          <el-select
            v-model="selectedUserId"
            filterable
            placeholder="请选择要添加的用户"
            class="w-full"
          >
            <el-option
              v-for="user in availableUsers"
              :key="user._id"
              :label="`${user.displayName || user.username} (${user.email})`"
              :value="user._id"
            />
          </el-select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">角色</label>
          <el-select v-model="selectedRole" placeholder="选择角色" class="w-full">
            <el-option label="管理员" value="admin" />
            <el-option label="成员" value="member" />
          </el-select>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="showAddMemberDialog = false">取消</el-button>
          <el-button type="primary" @click="handleAddMember" :loading="addingMember">添加</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑成员对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑成员信息" width="500px">
      <div v-if="editingMember" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">显示名称</label>
          <el-input
            v-model="editingMember.displayName"
            placeholder="请输入显示名称"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">用户名</label>
          <el-input
            v-model="editingMember.username"
            disabled
            placeholder="用户名不可修改"
          />
          <p class="text-xs text-gray-500 mt-1">用户名不可修改</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
          <el-input
            v-model="editingMember.email"
            type="email"
            placeholder="请输入邮箱"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="showEditDialog = false">取消</el-button>
          <el-button type="primary" @click="handleUpdateMember" :loading="updatingMember">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox, ElIcon } from 'element-plus'
import type { ProjectMember } from '@/types/project'
import type { User } from '@/types/user'
import * as projectApi from '@/api/project'
import * as userApi from '@/api/user'
import { getCurrentUser } from '@/utils/auth'

interface Props {
  projectId: string
}

const props = defineProps<Props>()

const members = ref<ProjectMember[]>([])
const loading = ref(false)
const currentUser = ref(getCurrentUser())

// 添加成员相关
const showAddMemberDialog = ref(false)
const selectedUserId = ref('')
const selectedRole = ref<'admin' | 'member'>('member')
const addingMember = ref(false)
const allUsers = ref<User[]>([])

// 编辑成员相关
const showEditDialog = ref(false)
const editingMember = ref<ProjectMember | null>(null)
const updatingMember = ref(false)

// 计算当前用户是否是管理员
const isAdmin = computed(() => {
  if (!currentUser.value) return false
  return currentUser.value.isAdmin
})

// 计算可添加的用户（排除已经是成员的用户）
const availableUsers = computed(() => {
  const memberUserIds = new Set(members.value.map(m => m.userId))
  return allUsers.value.filter(user => !memberUserIds.has(user._id))
})

// 获取成员显示名称（优先级：displayName > username > email）
const getMemberName = (member: ProjectMember): string => {
  return member.displayName || member.username || member.email || member.userId
}

// 获取用户名首字母
const getMemberInitial = (member: ProjectMember): string => {
  const name = getMemberName(member)
  return name?.charAt(0).toUpperCase() || 'U'
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

// 加载所有用户（组织内的用户）
const loadAllUsers = async () => {
  try {
    const response = await userApi.getUserList()
    allUsers.value = response.items
  } catch (error) {
    console.error('Failed to load users:', error)
    allUsers.value = []
  }
}

// 打开编辑对话框
const openEditDialog = (member: ProjectMember) => {
  editingMember.value = { ...member }
  showEditDialog.value = true
}

// 添加成员
const handleAddMember = async () => {
  if (!selectedUserId.value) {
    ElMessage.warning('请选择要添加的用户')
    return
  }

  addingMember.value = true
  try {
    // 查找选中的用户
    const selectedUser = allUsers.value.find(u => u._id === selectedUserId.value)

    // 优先使用 organizationUsername（用于自动注册），否则使用 _id
    const params: any = {
      projectId: props.projectId,
      role: selectedRole.value
    }

    if (selectedUser?.organizationUsername) {
      params.username = selectedUser.organizationUsername
    } else {
      params.userId = selectedUserId.value
    }

    await projectApi.addProjectMember(params)

    ElMessage.success('添加成员成功')
    showAddMemberDialog.value = false
    selectedUserId.value = ''
    selectedRole.value = 'member'

    // 重新加载成员列表
    await loadMembers()
  } catch (error: any) {
    ElMessage.error(error?.message || '添加成员失败')
  } finally {
    addingMember.value = false
  }
}

// 更新成员信息
const handleUpdateMember = async () => {
  if (!editingMember.value) return

  updatingMember.value = true
  try {
    await userApi.updateUser({
      userId: editingMember.value.userId,
      displayName: editingMember.value.displayName,
      email: editingMember.value.email
    })

    ElMessage.success('更新成员信息成功')
    showEditDialog.value = false
    editingMember.value = null

    // 重新加载成员列表
    await loadMembers()
  } catch (error: any) {
    ElMessage.error(error?.message || '更新成员信息失败')
  } finally {
    updatingMember.value = false
  }
}

// 确认移除成员
const confirmRemoveMember = async (member: ProjectMember) => {
  try {
    await ElMessageBox.confirm(
      `确定要移除成员 ${getMemberName(member)} 吗？`,
      '确认移除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await handleRemoveMember(member)
  } catch {
    // 用户取消
  }
}

// 移除成员
const handleRemoveMember = async (member: ProjectMember) => {
  try {
    await projectApi.removeProjectMember({
      projectId: props.projectId,
      userId: member.userId
    })

    ElMessage.success('移除成员成功')

    // 重新加载成员列表
    await loadMembers()
  } catch (error: any) {
    ElMessage.error(error?.message || '移除成员失败')
  }
}

// 监听 projectId 变化
watch(() => props.projectId, () => {
  loadMembers()
}, { immediate: true })

onMounted(() => {
  loadMembers()
  loadAllUsers()
  // 添加快捷键监听
  document.addEventListener('keydown', handleKeyDown)
})

// 组件卸载时移除监听器
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

// 处理快捷键
const handleKeyDown = (event: KeyboardEvent) => {
  // 检查是否在其他输入框中
  const target = event.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

  // N键 - 添加成员
  if (event.key === 'n' || event.key === 'N') {
    event.preventDefault()
    showAddMemberDialog.value = true
  }
}
</script>
