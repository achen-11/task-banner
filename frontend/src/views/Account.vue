<template>
  <div class="p-8 max-w-4xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">账号设置</h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">管理个人资料、偏好与登录安全</p>
    </div>

    <div v-if="loading" class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
      加载中...
    </div>

    <template v-else>
      <!-- 用户概览 -->
      <section class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <div class="flex items-center gap-5">
          <div
            class="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-semibold shadow-sm shrink-0"
          >
            {{ userInitials }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {{ profile.displayName || profile.username }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400 truncate">@{{ profile.username }}</p>
            <p v-if="profile.email" class="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{{ profile.email }}</p>
          </div>
          <span
            v-if="profile.koobooId"
            class="hidden sm:inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 shrink-0"
          >
            Kooboo 已绑定
          </span>
        </div>
      </section>

      <!-- 基本信息 -->
      <section class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40">
          <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">基本信息</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">显示名称与联系邮箱</p>
        </div>
        <el-form class="p-6" label-position="top" @submit.prevent="handleSaveProfile">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <el-form-item label="显示名称">
              <el-input v-model="profile.displayName" placeholder="请输入显示名称" clearable />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="profile.email" type="email" placeholder="请输入邮箱" clearable />
            </el-form-item>
          </div>
          <el-form-item label="用户名">
            <el-input :model-value="profile.username" disabled />
          </el-form-item>
          <div v-if="profile.koobooId" class="text-xs text-gray-500 dark:text-gray-400 -mt-2 mb-4 sm:hidden">
            已绑定 Kooboo：{{ profile.koobooId }}
          </div>
          <div class="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-700">
            <el-button type="primary" native-type="submit" :loading="savingProfile">
              保存资料
            </el-button>
          </div>
        </el-form>
      </section>

      <!-- 个人偏好 -->
      <section class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40">
          <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">个人偏好</h2>
        </div>
        <el-form class="p-6" label-position="top" @submit.prevent="handleSavePreferences">
          <div class="account-pref-field">
            <p class="text-sm font-medium text-gray-800 dark:text-gray-200">默认显示状态</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1.5 mb-4 leading-relaxed">
              用于「我的任务」页的初始状态筛选；至少选择一项。「重置筛选」也会回到此处配置。
            </p>
            <div
              class="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/30 px-4 py-4"
            >
              <el-checkbox-group
                v-model="preferenceStatuses"
                class="flex flex-wrap gap-x-8 gap-y-3 account-pref-checkboxes"
              >
                <el-checkbox
                  v-for="option in TASK_STATUS_OPTIONS"
                  :key="option.value"
                  :label="option.value"
                >
                  {{ option.label }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
          </div>
          <div class="flex justify-end pt-6 mt-6 border-t border-gray-100 dark:border-gray-700">
            <el-button type="primary" native-type="submit" :loading="savingPreferences">
              保存偏好
            </el-button>
          </div>
        </el-form>
      </section>

      <!-- 修改密码 -->
      <section class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40">
          <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">登录安全</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">修改账号密码</p>
        </div>
        <el-form class="p-6" label-position="top" @submit.prevent="handleChangePassword">
          <el-form-item label="原密码">
            <el-input
              v-model="passwordForm.oldPassword"
              type="password"
              show-password
              autocomplete="current-password"
              placeholder="请输入原密码"
            />
          </el-form-item>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <el-form-item label="新密码">
              <el-input
                v-model="passwordForm.newPassword"
                type="password"
                show-password
                autocomplete="new-password"
                placeholder="6-20 位"
              />
            </el-form-item>
            <el-form-item label="确认新密码">
              <el-input
                v-model="passwordForm.confirmPassword"
                type="password"
                show-password
                autocomplete="new-password"
                placeholder="再次输入"
              />
            </el-form-item>
          </div>
          <div class="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-700">
            <el-button type="primary" native-type="submit" :loading="changingPassword">
              修改密码
            </el-button>
          </div>
        </el-form>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { useUserTasksStore } from '@/stores/userTasks'
import type { UserInfo } from '@/types/auth'
import {
  TASK_STATUS_OPTIONS,
  getMyTasksDefaultStatuses,
  type TaskStatusValue
} from '@/constants/userPreferences'

const authStore = useAuthStore()
const userTasksStore = useUserTasksStore()
const loading = ref(true)
const savingProfile = ref(false)
const savingPreferences = ref(false)
const changingPassword = ref(false)

const profile = reactive({
  username: '',
  displayName: '',
  email: '',
  koobooId: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const preferenceStatuses = ref<TaskStatusValue[]>([...getMyTasksDefaultStatuses()])

const userInitials = computed(() => {
  const name = profile.displayName || profile.username
  return name ? name.substring(0, 1).toUpperCase() : '?'
})

function applyUser(user: UserInfo) {
  profile.username = user.username
  profile.displayName = user.displayName
  profile.email = user.email
  profile.koobooId = user.koobooId || ''
  preferenceStatuses.value = [...getMyTasksDefaultStatuses(user.preferences)]
}

async function loadProfile() {
  loading.value = true
  try {
    const user = await authApi.getCurrentUser()
    applyUser(user)
    authStore.user = user
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '加载用户信息失败')
  } finally {
    loading.value = false
  }
}

async function handleSaveProfile() {
  savingProfile.value = true
  try {
    const user = await authApi.updateProfile({
      displayName: profile.displayName.trim(),
      email: profile.email.trim()
    })
    applyUser(user)
    authStore.user = user
    ElMessage.success('资料更新成功')
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '更新资料失败')
  } finally {
    savingProfile.value = false
  }
}

async function handleSavePreferences() {
  if (preferenceStatuses.value.length === 0) {
    ElMessage.error('请至少选择一个默认任务状态')
    return
  }

  savingPreferences.value = true
  try {
    const user = await authApi.updateProfile({
      preferences: {
        myTasksDefaultStatuses: [...preferenceStatuses.value]
      }
    })
    applyUser(user)
    authStore.user = user
    userTasksStore.applyDefaultStatusFilter(user.preferences)
    ElMessage.success('偏好设置已保存')
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '保存偏好失败')
  } finally {
    savingPreferences.value = false
  }
}

async function handleChangePassword() {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error('两次输入的新密码不一致')
    return
  }

  changingPassword.value = true
  try {
    await authApi.changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    ElMessage.success('密码修改成功')
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '修改密码失败')
  } finally {
    changingPassword.value = false
  }
}

onMounted(loadProfile)
</script>

<style scoped>
.account-pref-field :deep(.el-checkbox) {
  margin-right: 0;
  height: auto;
  align-items: center;
}

.account-pref-checkboxes :deep(.el-checkbox__label) {
  padding-left: 8px;
  line-height: 1.5;
}
</style>
