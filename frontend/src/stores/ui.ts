import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui', () => {
  // 侧边栏收起状态
  const sidebarCollapsed = ref(false)

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

  return {
    sidebarCollapsed,
    isDarkMode,
    toggleSidebar,
    setSidebarCollapsed,
    toggleDarkMode,
    setDarkMode
  }
})