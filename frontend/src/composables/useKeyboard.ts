/**
 * 全局快捷键管理
 */
import { onMounted, onUnmounted } from 'vue'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  meta?: boolean  // Cmd on Mac, Ctrl on Windows
  shift?: boolean
  alt?: boolean
  description: string
  handler: () => void
  category?: string
}

// 快捷键配置
export const shortcuts: KeyboardShortcut[] = []

/**
 * 注册全局快捷键
 */
export function useKeyboard() {
  const handleKeyDown = (event: KeyboardEvent) => {
    for (const shortcut of shortcuts) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
      const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey
      const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
      const altMatch = shortcut.alt ? event.altKey : !event.altKey

      if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
        // 检查是否在输入框中
        const target = event.target as HTMLElement
        const isInput = target.tagName === 'INPUT' ||
                       target.tagName === 'TEXTAREA' ||
                       target.contentEditable === 'true'

        // ESC键是特殊情况，即使在输入框中也应该工作
        const isEscapeKey = event.key === 'Escape'

        // 如果在输入框中，只允许特定的快捷键（Cmd+S, Cmd+E 等）和ESC键
        if (isInput && !shortcut.meta && !shortcut.ctrl && !isEscapeKey) {
          continue
        }

        event.preventDefault()
        shortcut.handler()
        break
      }
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })

  return {
    shortcuts
  }
}

/**
 * 注册快捷键
 */
export function registerShortcut(shortcut: KeyboardShortcut) {
  shortcuts.push(shortcut)
}

/**
 * 取消注册快捷键
 */
export function unregisterShortcut(key: string) {
  const index = shortcuts.findIndex(s => s.key === key)
  if (index > -1) {
    shortcuts.splice(index, 1)
  }
}

/**
 * 格式化快捷键显示
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = []

  // 检测操作系统
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0

  if (shortcut.ctrl) parts.push(isMac ? '⌃' : 'Ctrl')
  if (shortcut.meta) parts.push(isMac ? '⌘' : 'Ctrl')
  if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift')
  if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt')

  parts.push(shortcut.key.toUpperCase())

  return parts.join(isMac ? '' : '+')
}
