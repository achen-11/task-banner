/**
 * 页面标题管理 Composable
 * 用于在收到通知时改变页面标题，显示未读数量
 */
import { ref, onMounted, onUnmounted } from 'vue'

const originalTitle = ref<string>('')
const unreadCount = ref<number>(0)

/**
 * 初始化页面标题管理
 */
export function usePageTitle() {
  // 保存原始标题
  if (!originalTitle.value) {
    originalTitle.value = document.title
  }

  /**
   * 更新页面标题
   */
  function updateTitle(count: number) {
    unreadCount.value = count
    if (count > 0) {
      document.title = `(${count}) ${originalTitle.value}`
    } else {
      document.title = originalTitle.value
    }
  }

  /**
   * 增加未读数量
   */
  function incrementUnread() {
    updateTitle(unreadCount.value + 1)
  }

  /**
   * 减少未读数量
   */
  function decrementUnread() {
    updateTitle(Math.max(0, unreadCount.value - 1))
  }

  /**
   * 重置标题（恢复原始标题）
   */
  function resetTitle() {
    updateTitle(0)
  }

  /**
   * 设置未读数量
   */
  function setUnreadCount(count: number) {
    updateTitle(count)
  }

  return {
    incrementUnread,
    decrementUnread,
    resetTitle,
    setUnreadCount,
    unreadCount
  }
}
