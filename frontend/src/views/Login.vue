<template>
  <div class="min-h-screen flex">
    <!-- 左侧品牌区 -->
    <div class="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950" />
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div class="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />

      <div class="relative z-10 flex flex-col justify-center items-center w-full text-white p-12">
        <div class="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm border border-blue-500/30">
          <ClipboardList class="w-8 h-8 text-blue-400" />
        </div>
        <h1 class="text-4xl font-bold mb-4">
          {{ pageMode === 'register' ? '加入 Task Banner' : '欢迎回来' }}
        </h1>
        <p class="text-slate-400 text-lg max-w-md text-center leading-relaxed whitespace-pre-line">
          {{ pageMode === 'register'
            ? '创建账号\n开始管理你的任务与项目'
            : '登录后继续你的协作工作\n高效追踪每一个任务' }}
        </p>
      </div>
    </div>

    <!-- 右侧表单 -->
    <div class="flex-1 flex items-center justify-center p-6 sm:p-8 bg-gray-50">
      <div class="auth-card w-full max-w-md bg-white rounded-xl shadow-xl border-0 p-8">
        <!-- 头部 -->
        <div class="pb-6">
          <button
            v-if="pageMode === 'register'"
            type="button"
            class="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3 transition-colors"
            @click="togglePageMode('login')"
          >
            <ArrowLeft class="w-4 h-4" />
            返回登录
          </button>
          <h2 class="text-2xl font-bold text-gray-900">
            {{ pageMode === 'login' ? '登录' : '注册' }}
          </h2>
          <p class="text-sm text-gray-500 mt-1">
            {{ pageMode === 'login' ? '使用账号密码登录' : '填写信息创建 Task Banner 账号' }}
          </p>
        </div>

        <form class="space-y-5" @submit.prevent="handleSubmit">
          <!-- 登录表单 -->
          <template v-if="pageMode === 'login'">
            <div class="flex bg-slate-100 p-1 rounded-lg">
              <button
                v-for="tab in loginTabs"
                :key="tab.value"
                type="button"
                class="flex-1 py-2 text-sm font-medium rounded-md transition-all"
                :class="accountType === tab.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'"
                @click="accountType = tab.value"
              >
                {{ tab.label }}
              </button>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700">
                {{ accountType === 'email' ? '邮箱' : '用户名' }}
              </label>
              <div class="relative">
                <component
                  :is="accountType === 'email' ? Mail : User"
                  class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                />
                <input
                  v-model="account"
                  :type="accountType === 'email' ? 'email' : 'text'"
                  :placeholder="accountType === 'email' ? '请输入邮箱' : '请输入用户名'"
                  class="auth-input"
                  required
                />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700">密码</label>
              <div class="relative">
                <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="请输入密码"
                  class="auth-input pr-10"
                  required
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabindex="-1"
                  @click="showPassword = !showPassword"
                >
                  <Eye v-if="!showPassword" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input
                v-model="isRemember"
                type="checkbox"
                class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm text-slate-600">记住我</span>
            </label>
          </template>

          <!-- 注册表单 -->
          <template v-else>
            <div
              v-for="field in registerFields"
              :key="field.key"
              class="space-y-2"
            >
              <label class="text-sm font-medium text-gray-700">
                {{ field.label }}
                <span v-if="field.optional" class="text-gray-400 font-normal">（可选）</span>
              </label>
              <div class="relative">
                <component
                  :is="field.icon"
                  class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                />
                <input
                  v-model="registerForm[field.key]"
                  :type="field.type === 'password'
                    ? (registerPasswordVisible[field.key] ? 'text' : 'password')
                    : field.type"
                  :placeholder="field.placeholder"
                  class="auth-input"
                  :class="field.type === 'password' ? 'pr-10' : ''"
                  :required="!field.optional"
                />
                <button
                  v-if="field.type === 'password'"
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabindex="-1"
                  @click="toggleRegisterPassword(field.key)"
                >
                  <Eye v-if="!registerPasswordVisible[field.key]" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
            </div>
          </template>

          <!-- 错误提示 -->
          <div
            v-if="authStore.error"
            class="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 text-red-600 text-sm"
          >
            <AlertCircle class="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{{ authStore.error }}</span>
          </div>

          <!-- 提交按钮 -->
          <button
            type="submit"
            class="auth-btn-primary"
            :disabled="authStore.isLoading"
          >
            <span v-if="authStore.isLoading" class="inline-flex items-center gap-2">
              <span class="auth-spinner" />
              {{ pageMode === 'login' ? '登录中...' : '注册中...' }}
            </span>
            <span v-else>{{ pageMode === 'login' ? '登录' : '注册' }}</span>
          </button>

          <!-- Kooboo 登录 -->
          <template v-if="pageMode === 'login'">
            <div class="relative flex items-center">
              <div class="flex-1 border-t border-gray-200" />
              <span class="px-3 text-sm text-gray-400">或</span>
              <div class="flex-1 border-t border-gray-200" />
            </div>

            <button
              type="button"
              class="auth-btn-outline"
              @click="handleKoobooLogin"
            >
              <span class="kooboo-mark">K</span>
              Kooboo 登录
            </button>

            <div class="flex items-center justify-between text-sm pt-1">
              <button
                type="button"
                class="font-medium text-slate-900 hover:text-slate-700 transition-colors"
                @click="togglePageMode('register')"
              >
                立即注册
              </button>
            </div>
          </template>

          <div v-else class="text-center text-sm pt-1">
            <button
              type="button"
              class="font-medium text-slate-900 hover:text-slate-700 transition-colors"
              @click="togglePageMode('login')"
            >
              已有账号？立即登录
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ClipboardList,
  AlertCircle,
  AtSign
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

type PageMode = 'login' | 'register'
type AccountType = 'username' | 'email'

const router = useRouter()
const authStore = useAuthStore()

const pageMode = ref<PageMode>('login')
const accountType = ref<AccountType>('username')
const account = ref('')
const password = ref('')
const isRemember = ref(false)
const showPassword = ref(false)

const registerForm = ref({
  username: '',
  email: '',
  displayName: '',
  password: '',
  confirmPassword: ''
})

const registerPasswordVisible = reactive<Record<string, boolean>>({
  password: false,
  confirmPassword: false
})

const loginTabs = [
  { value: 'username' as const, label: '用户名' },
  { value: 'email' as const, label: '邮箱' }
]

const registerFields = [
  { key: 'username' as const, label: '用户名', icon: User, type: 'text', placeholder: '2-20 位字母数字下划线' },
  { key: 'email' as const, label: '邮箱', icon: AtSign, type: 'email', placeholder: '请输入邮箱' },
  { key: 'displayName' as const, label: '显示名称', icon: User, type: 'text', placeholder: '默认同用户名', optional: true },
  { key: 'password' as const, label: '密码', icon: Lock, type: 'password', placeholder: '至少 6 位' },
  { key: 'confirmPassword' as const, label: '确认密码', icon: Lock, type: 'password', placeholder: '再次输入密码' }
]

onMounted(async () => {
  await authStore.checkAuth()
  if (authStore.isAuthenticated) {
    router.replace('/')
  }
})

function togglePageMode(mode: PageMode) {
  authStore.clearError()
  pageMode.value = mode
  password.value = ''
  showPassword.value = false
}

function toggleRegisterPassword(key: string) {
  registerPasswordVisible[key] = !registerPasswordVisible[key]
}

async function handleSubmit() {
  authStore.clearError()

  if (pageMode.value === 'login') {
    const success = await authStore.login({
      account: account.value.trim(),
      password: password.value,
      isRemember: isRemember.value
    })
    if (success) {
      ElMessage.success('登录成功')
      router.replace('/')
    }
    return
  }

  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    ElMessage.warning('两次密码输入不一致')
    return
  }

  const success = await authStore.register({
    username: registerForm.value.username.trim(),
    email: registerForm.value.email.trim(),
    password: registerForm.value.password,
    displayName: registerForm.value.displayName.trim() || undefined
  })

  if (success) {
    ElMessage.success('注册成功')
    router.replace('/')
  }
}

function handleKoobooLogin() {
  window.location.href = '/_Admin/login?returnurl=/__kbAuthCallback?type=koobooLogin'
}
</script>

<style scoped>
.auth-card {
  animation: auth-fade-in 0.35s ease-out;
}

@keyframes auth-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.auth-input {
  @apply w-full h-11 pl-10 pr-3 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg outline-none transition-all;
  @apply placeholder:text-gray-400;
  @apply focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20;
}

.auth-btn-primary {
  @apply w-full h-11 flex items-center justify-center text-sm font-medium text-white bg-blue-600 rounded-lg transition-all;
  @apply hover:bg-blue-700 active:bg-blue-800;
  @apply disabled:opacity-60 disabled:cursor-not-allowed;
}

.auth-btn-outline {
  @apply w-full h-11 flex items-center justify-center gap-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg transition-all;
  @apply hover:bg-gray-50 hover:border-gray-300;
}

.kooboo-mark {
  @apply w-5 h-5 flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-blue-500 to-indigo-600 rounded;
}

.auth-spinner {
  @apply w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin;
}
</style>
