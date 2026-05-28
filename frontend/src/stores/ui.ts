import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

const FOCUS_HINT_DISMISSED_KEY = 'task_banner_focus_hint_dismissed'

export const useUIStore = defineStore('ui', () => {
  // 侧边栏收起状态
  const sidebarCollapsed = ref(false)

  /** 页面级专注模式（项目看板 / 我的任务看板等） */
  const pageFocusMode = ref(false)
  const focusEnterHintVisible = ref(false)
  let focusHintTimer: ReturnType<typeof setTimeout> | null = null

  // 暗黑模式状态（从 localStorage 读取，默认为 false）
  const getInitialDarkMode = (): boolean => {
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) {
      return saved === 'true'
    }
    // 如果没有保存的偏好，使用系统偏好
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  const isDarkMode = ref<boolean>(getInitialDarkMode())

  // 切换侧边栏状态
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  // 设置侧边栏状态
  const setSidebarCollapsed = (collapsed: boolean) => {
    sidebarCollapsed.value = collapsed
  }

  // 切换暗黑模式
  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value
    localStorage.setItem('darkMode', String(isDarkMode.value))
    applyDarkMode()
  }

  // 设置暗黑模式
  const setDarkMode = (dark: boolean) => {
    isDarkMode.value = dark
    localStorage.setItem('darkMode', String(dark))
    applyDarkMode()
  }

  // 应用暗黑模式到 HTML 根元素
  const applyDarkMode = () => {
    const html = document.documentElement
    if (isDarkMode.value) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  // 监听暗黑模式变化，自动应用到 HTML
  watch(isDarkMode, () => {
    applyDarkMode()
  }, { immediate: true })

  // 初始化时应用暗黑模式
  applyDarkMode()

  const clearFocusHintTimer = () => {
    if (focusHintTimer) {
      clearTimeout(focusHintTimer)
      focusHintTimer = null
    }
  }

  const enterPageFocusMode = (options?: { showHint?: boolean }) => {
    if (pageFocusMode.value) return
    pageFocusMode.value = true
    setSidebarCollapsed(true)

    const showHint = options?.showHint !== false
    if (!showHint || localStorage.getItem(FOCUS_HINT_DISMISSED_KEY)) return

    focusEnterHintVisible.value = true
    clearFocusHintTimer()
    focusHintTimer = setTimeout(() => {
      focusEnterHintVisible.value = false
      focusHintTimer = null
    }, 5000)
  }

  const exitPageFocusMode = () => {
    pageFocusMode.value = false
    focusEnterHintVisible.value = false
    clearFocusHintTimer()
    setSidebarCollapsed(false)
  }

  const togglePageFocusMode = (options?: { showHint?: boolean }) => {
    if (pageFocusMode.value) {
      exitPageFocusMode()
    } else {
      enterPageFocusMode(options)
    }
  }

  const dismissFocusHintPermanent = () => {
    localStorage.setItem(FOCUS_HINT_DISMISSED_KEY, '1')
    focusEnterHintVisible.value = false
    clearFocusHintTimer()
  }

  /** 已在专注模式时仍可弹出一次进入提示（用于页面首次自动进入） */
  const triggerFocusEnterHint = () => {
    if (!pageFocusMode.value || localStorage.getItem(FOCUS_HINT_DISMISSED_KEY)) return
    focusEnterHintVisible.value = true
    clearFocusHintTimer()
    focusHintTimer = setTimeout(() => {
      focusEnterHintVisible.value = false
      focusHintTimer = null
    }, 5000)
  }

  const hideFocusEnterHint = () => {
    focusEnterHintVisible.value = false
    clearFocusHintTimer()
  }

  return {
    sidebarCollapsed,
    isDarkMode,
    pageFocusMode,
    focusEnterHintVisible,
    toggleSidebar,
    setSidebarCollapsed,
    toggleDarkMode,
    setDarkMode,
    enterPageFocusMode,
    exitPageFocusMode,
    togglePageFocusMode,
    dismissFocusHintPermanent,
    triggerFocusEnterHint,
    hideFocusEnterHint
  }
})