<template>
  <div class="p-8 max-w-3xl">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">账号设置</h1>
    <p class="text-gray-500 dark:text-gray-400 mb-8">查看和管理你的个人信息</p>

    <div v-if="loading" class="bg-white dark:bg-gray-800 rounded-md shadow-md p-8 text-center text-gray-500">
      加载中...
    </div>

    <template v-else>
      <!-- 基本信息 -->
      <section class="bg-white dark:bg-gray-800 rounded-md shadow-md border border-gray-100 dark:border-gray-700 mb-6">
        <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">基本信息</h2>
        </div>
        <form class="p-6 space-y-5" @submit.prevent="handleSaveProfile">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-semibold">
              {{ userInitials }}
            </div>
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-400">用户名</div>
              <div class="text-base font-medium text-gray-900 dark:text-gray-100">{{ profile.username }}</div>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">显示名称</label>
            <input
              v-model="profile.displayName"
              type="text"
              class="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入显示名称"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">邮箱</label>
            <input
              v-model="profile.email"
              type="email"
              class="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入邮箱"
            />
          </div>

          <div v-if="profile.koobooId" class="text-sm text-gray-500 dark:text-gray-400">
            已绑定 Kooboo 账号：{{ profile.koobooId }}
          </div>

          <div class="flex justify-end">
            <el-button type="primary" native-type="submit" :loading="savingProfile">
              保存资料
            </el-button>
          </div>
        </form>
      </section>

      <!-- 修改密码 -->
      <section class="bg-white dark:bg-gray-800 rounded-md shadow-md border border-gray-100 dark:border-gray-700">
        <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">修改密码</h2>
        </div>
        <form class="p-6 space-y-5" @submit.prevent="handleChangePassword">
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">原密码</label>
            <input
              v-model="passwordForm.oldPassword"
              type="password"
              autocomplete="current-password"
              class="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入原密码"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">新密码</label>
            <input
              v-model="passwordForm.newPassword"
              type="password"
              autocomplete="new-password"
              class="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="6-20 位新密码"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">确认新密码</label>
            <input
              v-model="passwordForm.confirmPassword"
              type="password"
              autocomplete="new-password"
              class="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="再次输入新密码"
            />
          </div>

          <div class="flex justify-end">
            <el-button type="primary" native-type="submit" :loading="changingPassword">
              修改密码
            </el-button>
          </div>
        </form>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import type { UserInfo } from '@/types/auth'

const authStore = useAuthStore()
const loading = ref(true)
const savingProfile = ref(false)
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

const userInitials = computed(() => {
  const name = profile.displayName || profile.username
  return name ? name.substring(0, 1).toUpperCase() : '?'
})

function applyUser(user: UserInfo) {
  profile.username = user.username
  profile.displayName = user.displayName
  profile.email = user.email
  profile.koobooId = user.koobooId || ''
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
