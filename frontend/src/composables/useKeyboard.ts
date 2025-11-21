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
  description?: string
  handler?: () => void
  category?: string
}

// 快捷键配置
export const shortcuts: KeyboardShortcut[] = []

// 文档快捷键配置
export const documentShortcuts: KeyboardShortcut[] = [
  {
    key: 'F1',
    description: '专注模式',
    handler: () => {
      // 将在组件中动态设置
    },
    category: '文档'
  },
  {
    key: 'F2',
    description: '左侧目录',
    handler: () => {
      // 将在组件中动态设置
    },
    category: '文档'
  },
  {
    key: 'F3',
    description: '右侧目录',
    handler: () => {
      // 将在组件中动态设置
    },
    category: '文档'
  },
  {
    key: 'F4',
    description: '编辑模式',
    handler: () => {
      // 将在组件中动态设置
    },
    category: '文档'
  },
  {
    key: 'F5',
    description: '刷新列表',
    handler: () => {
      // 将在组件中动态设置
    },
    category: '文档'
  },
  {
    key: 'n',
    ctrl: true,
    meta: true,
    description: '新建文档',
    handler: () => {
      // 将在组件中动态设置
    },
    category: '文档'
  }
]

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
        if (shortcut.handler) {
          shortcut.handler()
        }
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
 * @param key 快捷键key
 * @param meta 是否包含meta键（可选，用于精确匹配）
 */
export function unregisterShortcut(key: string, meta?: boolean) {
  const index = shortcuts.findIndex(s => {
    if (meta !== undefined) {
      // 如果指定了meta，需要精确匹配
      return s.key === key && s.meta === meta
    }
    // 否则只匹配key
    return s.key === key
  })
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

/**
 * 文档快捷键管理
 */
export function useDocumentKeyboard(handlers: {
  toggleFocusMode?: () => void
  toggleLeftSidebar?: () => void
  toggleRightToc?: () => void
  toggleEditMode?: () => void
  refreshDocuments?: () => void
  createDocument?: () => void
}) {
  // 创建快捷键副本，避免修改原始配置
  const shortcutsToRegister = documentShortcuts.map(shortcut => ({ ...shortcut }))

  // 动态设置处理函数
  if (handlers?.toggleFocusMode) {
    shortcutsToRegister[0]!.handler = handlers.toggleFocusMode
  }
  if (handlers?.toggleLeftSidebar) {
    shortcutsToRegister[1]!.handler = handlers.toggleLeftSidebar
  }
  if (handlers.toggleRightToc) {
    shortcutsToRegister[2]!.handler = handlers.toggleRightToc
  }
  if (handlers.toggleEditMode) {
    shortcutsToRegister[3]!.handler = handlers.toggleEditMode
  }
  if (handlers.refreshDocuments) {
    shortcutsToRegister[4]!.handler = handlers.refreshDocuments
  }
  if (handlers.createDocument) {
    shortcutsToRegister[5]!.handler = handlers.createDocument
  }

  onMounted(() => {
    // 注册文档快捷键
    shortcutsToRegister.forEach(shortcut => {
      registerShortcut(shortcut)
    })
  })

  onUnmounted(() => {
    // 取消注册文档快捷键
    shortcutsToRegister.forEach(shortcut => {
      unregisterShortcut(shortcut.key)
    })
  })

  return {
    shortcuts: shortcutsToRegister
  }
}
