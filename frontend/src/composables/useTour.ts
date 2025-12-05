import { ref, nextTick } from 'vue'
import { useTourStore } from '@/stores/tour'

// Element Plus Tour 步骤类型
interface TourStep {
  target: string | HTMLElement | (() => HTMLElement | null)
  title: string
  description?: string
  placement?: 'left' | 'right' | 'top' | 'bottom' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'right-start' | 'right-end' | 'left-start' | 'left-end'
  mask?: boolean | { style?: Record<string, any>; color?: string }
  showArrow?: boolean
  showClose?: boolean
  contentStyle?: Record<string, any>
}

/**
 * 引导功能 Composable
 * 使用 Element Plus Tour 组件
 */
export function useTour() {
  const tourStore = useTourStore()
  const tourRef = ref<InstanceType<typeof import('element-plus').ElTour> | null>(null)
  
  // 引导步骤配置 - 侧边栏导航引导
  const getSidebarTourSteps = (): TourStep[] => {
    return [
      {
        target: () => {
          // 查找首页的 router-link - 通过查找包含"首页"文本的元素
          const links = document.querySelectorAll('a.sidebar-menu')
          for (const link of links) {
            const text = link.textContent?.trim() || ''
            if (text.includes('首页') || link.getAttribute('href') === '/' || 
                (link as any).__vueParentComponent?.props?.to === '/') {
              return link as HTMLElement
            }
          }
          // 如果找不到，尝试通过位置（第一个 sidebar-menu）
          const firstLink = document.querySelector('a.sidebar-menu')
          return firstLink as HTMLElement | null
        },
        title: '欢迎使用任务管理系统！',
        description: '这里是首页，你可以查看项目概览和统计数据。让我们开始探索吧！',
        placement: 'right'
      },
      {
        target: () => {
          // 查找我的任务的 router-link - 通过查找包含"我的任务"文本的元素
          const links = document.querySelectorAll('a.sidebar-menu')
          for (const link of links) {
            const text = link.textContent?.trim() || ''
            if (text.includes('我的任务') || link.getAttribute('href') === '/my-tasks' ||
                (link as any).__vueParentComponent?.props?.to === '/my-tasks') {
              return link as HTMLElement
            }
          }
          // 如果找不到，尝试通过位置（第二个 sidebar-menu）
          const linksArray = Array.from(document.querySelectorAll('a.sidebar-menu'))
          return linksArray[1] as HTMLElement | null
        },
        title: '我的任务',
        description: '在这里可以查看分配给你的所有任务，支持多种视图和筛选方式。',
        placement: 'right'
      },
      {
        target: () => {
          // 查找消息的 router-link - 通过查找包含"消息"文本的元素
          const links = document.querySelectorAll('a.sidebar-menu')
          for (const link of links) {
            const text = link.textContent?.trim() || ''
            if (text.includes('消息') || link.getAttribute('href') === '/messages' ||
                (link as any).__vueParentComponent?.props?.to === '/messages') {
              return link as HTMLElement
            }
          }
          // 如果找不到，尝试通过位置（第三个 sidebar-menu）
          const linksArray = Array.from(document.querySelectorAll('a.sidebar-menu'))
          return linksArray[2] as HTMLElement | null
        },
        title: '消息通知',
        description: '接收任务指派、内容更新等通知，及时了解项目动态。',
        placement: 'right'
      },
      {
        target: () => {
          // 项目列表入口 - 查找 tour-projects-button
          const btn = document.querySelector('.tour-projects-button')
          if (btn) return btn as HTMLElement
          // 如果找不到，尝试查找包含"Projects"文本的按钮
          const buttons = document.querySelectorAll('button')
          for (const btn of buttons) {
            if (btn.textContent?.includes('Projects')) {
              return btn as HTMLElement
            }
          }
          return null
        },
        title: '项目管理',
        description: '点击这里可以查看所有项目，创建新项目或管理现有项目。',
        placement: 'right'
      },
      {
        target: () => {
          // 创建项目按钮 - 查找 tour-create-project-button
          const btn = document.querySelector('.tour-create-project-button')
          if (btn) return btn as HTMLElement
          // 如果找不到，尝试查找侧边栏中的加号按钮
          const sidebar = document.querySelector('aside')
          if (sidebar) {
            const plusBtn = sidebar.querySelector('button[title="创建项目"]')
            if (plusBtn) return plusBtn as HTMLElement
          }
          return null
        },
        title: '创建项目',
        description: '点击这个按钮可以快速创建新项目，开始你的任务管理之旅。',
        placement: 'bottom'
      },
      {
        target: () => {
          // 全局搜索 - 查找顶部搜索框或快捷键提示
          // 首先尝试查找 AppHeader 中的搜索框
          const searchInput = document.querySelector('header input[type="text"][placeholder*="搜索"]')
          if (searchInput) return searchInput as HTMLElement
          
          // 如果找不到，尝试查找快捷键面板中的 Cmd+K 提示
          const shortcutsPanel = document.querySelector('.keyboard-shortcuts-panel')
          if (shortcutsPanel) {
            const searchShortcut = Array.from(shortcutsPanel.querySelectorAll('div')).find(el => 
              el.textContent?.includes('Cmd+K') || el.textContent?.includes('全局搜索')
            )
            if (searchShortcut) return searchShortcut as HTMLElement
          }
          
          // 如果都找不到，返回 header 区域
          const header = document.querySelector('header')
          return header as HTMLElement | null
        },
        title: '全局搜索',
        description: '使用 Cmd+K（Mac）或 Ctrl+K（Windows）可以快速打开全局搜索，搜索任务、评论和文档内容。',
        placement: 'bottom',
        mask: true
      }
    ]
  }

  // 项目详情页引导步骤配置
  const getProjectTourSteps = (): TourStep[] => {
    return [
      {
        target: () => {
          // 查找 Tab 栏 - 查找包含"概览"、"列表"、"看板"等标签的导航栏
          const nav = document.querySelector('nav.flex.px-6.space-x-8.bg-white')
          if (nav) return nav as HTMLElement
          
          // 备用：查找包含 Tab 按钮的容器
          const tabContainer = document.querySelector('nav[class*="flex"]')
          return tabContainer as HTMLElement | null
        },
        title: '项目视图切换',
        description: '这里可以切换不同的视图：概览查看项目统计、列表和看板管理任务、文档编写项目文档、模块组织任务结构等。',
        placement: 'bottom',
        mask: true
      },
      {
        target: () => {
          // 查找"新建任务"按钮 - 查找包含"新建任务"文本的按钮
          const buttons = document.querySelectorAll('button, .el-button')
          for (const btn of buttons) {
            const text = btn.textContent?.trim() || ''
            if (text.includes('新建任务') || text.includes('创建任务')) {
              return btn as HTMLElement
            }
          }
          // 备用：查找包含 Plus 图标的按钮
          const plusBtn = document.querySelector('button:has(svg), .el-button:has(svg)')
          return plusBtn as HTMLElement | null
        },
        title: '创建任务',
        description: '点击这里可以快速创建新任务。你也可以在看板视图中按 N 键快速创建任务。',
        placement: 'bottom',
        mask: true
      },
      {
        target: () => {
          // 查找"看板"Tab - 查找包含"看板"文本的按钮
          const tabButtons = document.querySelectorAll('nav button')
          for (const btn of tabButtons) {
            const text = btn.textContent?.trim() || ''
            if (text.includes('看板')) {
              return btn as HTMLElement
            }
          }
          return null
        },
        title: '看板视图',
        description: '看板视图以卡片形式展示任务，支持拖拽排序。按 N 键快速创建任务，按 F1 进入专注模式。',
        placement: 'bottom',
        mask: true
      },
      {
        target: () => {
          // 查找"列表"Tab - 查找包含"列表"文本的按钮
          const tabButtons = document.querySelectorAll('nav button')
          for (const btn of tabButtons) {
            const text = btn.textContent?.trim() || ''
            if (text.includes('列表')) {
              return btn as HTMLElement
            }
          }
          return null
        },
        title: '列表视图',
        description: '列表视图以表格形式展示任务，支持排序、筛选和批量操作。按 Cmd+I 导入任务，按 Cmd+E 导出任务。',
        placement: 'bottom',
        mask: true
      },
      {
        target: () => {
          // 查找"文档"Tab - 查找包含"文档"文本的按钮
          const tabButtons = document.querySelectorAll('nav button')
          for (const btn of tabButtons) {
            const text = btn.textContent?.trim() || ''
            if (text.includes('文档')) {
              return btn as HTMLElement
            }
          }
          return null
        },
        title: '文档管理',
        description: '在这里可以创建和管理项目文档，支持 Markdown 格式。按 F1 进入专注模式，专注于文档编写。',
        placement: 'bottom',
        mask: true
      },
      {
        target: () => {
          // 查找"项目设置"按钮 - 查找包含"项目设置"文本的按钮
          const buttons = document.querySelectorAll('button')
          for (const btn of buttons) {
            const text = btn.textContent?.trim() || ''
            if (text.includes('项目设置') || text.includes('设置')) {
              return btn as HTMLElement
            }
          }
          return null
        },
        title: '项目设置',
        description: '点击这里可以修改项目信息、管理成员、设置项目状态等。',
        placement: 'bottom',
        mask: true
      }
    ]
  }
  
  // 开始引导
  const startTour = async () => {
    console.log('[Tour] startTour 被调用')
    await nextTick()
    
    // 确保侧边栏展开
    const sidebar = document.querySelector('aside')
    console.log('[Tour] 侧边栏状态:', { 
      exists: !!sidebar, 
      collapsed: sidebar?.classList.contains('w-14') 
    })
    
    if (sidebar?.classList.contains('w-14')) {
      // 侧边栏收起时，先展开
      console.log('[Tour] 侧边栏收起，先展开...')
      const { useUIStore } = await import('@/stores/ui')
      const uiStore = useUIStore()
      uiStore.setSidebarCollapsed(false)
      await new Promise(resolve => setTimeout(resolve, 400))
    }
    
    // 等待 DOM 完全渲染，确保目标元素存在
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 检查目标元素是否存在
    const steps = getProjectTourSteps()
    console.log('[Tour] 项目引导步骤数量:', steps.length)
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      if (step && step.target) {
        const target = typeof step.target === 'string' 
          ? document.querySelector(step.target)
          : typeof step.target === 'function'
          ? step.target()
          : step.target
        
        console.log(`[Tour] 步骤 ${i + 1} 目标元素:`, {
          selector: typeof step.target === 'string' ? step.target : 'function/element',
          found: !!target,
          title: step.title,
          element: target ? {
            tagName: target.tagName,
            className: target.className,
            textContent: target.textContent?.substring(0, 50)
          } : null
        })
        
        if (!target) {
          console.warn(`[Tour] 步骤 ${i + 1} 的目标元素未找到:`, step.title)
          if (i === 0) {
            console.log('[Tour] 可用的 sidebar-menu 元素:', 
              Array.from(document.querySelectorAll('.sidebar-menu')).map(el => ({
                tagName: el.tagName,
                className: el.className,
                textContent: el.textContent?.trim().substring(0, 30),
                href: el.getAttribute('href'),
                to: (el as any).__vueParentComponent?.props?.to
              })))
          }
        }
      }
    }
    
    console.log('[Tour] 调用 tourStore.startTour()')
    tourStore.startTour()
    console.log('[Tour] tourStore.isTourActive:', tourStore.isTourActive)
  }
  
  // 停止引导
  const stopTour = () => {
    tourStore.stopTour()
  }
  
  // 检查是否需要自动开始引导
  const checkAndStartTour = async () => {
    // 暂时关闭引导功能，保留代码以便后续优化
    return
    
    /* eslint-disable */
    // console.log('[Tour] 检查引导状态:', { 
    //   hasCompletedTour: tourStore.hasCompletedTour,
    //   localStorage: localStorage.getItem('tour_completed')
    // })
    // 
    // if (!tourStore.hasCompletedTour) {
    //   console.log('[Tour] 首次访问，准备启动引导...')
    //   // 首次访问，延迟一下让页面完全加载
    //   await new Promise(resolve => setTimeout(resolve, 2000))
    //   console.log('[Tour] 开始启动引导...')
    //   await startTour()
    //   console.log('[Tour] 引导启动完成，isTourActive:', tourStore.isTourActive)
    // } else {
    //   console.log('[Tour] 引导已完成，跳过自动启动')
    // }
    /* eslint-enable */
  }
  
  // 暴露启动引导的方法，供外部调用
  const triggerTour = async () => {
    await startTour()
    // 返回一个 Promise，等待 Tour 组件响应
    return new Promise<void>((resolve) => {
      setTimeout(resolve, 100)
    })
  }
  
  // 检查是否需要自动开始项目详情页引导
  const checkAndStartProjectTour = async (projectId: string) => {
    // 暂时关闭引导功能，保留代码以便后续优化
    return
    
    const key = `project_tour_completed_${projectId}`
    const hasCompleted = localStorage.getItem(key) === 'true'
    
    console.log('[Tour] 检查项目引导状态:', { 
      projectId,
      hasCompleted,
      localStorage: localStorage.getItem(key)
    })
    
    if (!hasCompleted) {
      console.log('[Tour] 首次进入项目详情页，准备启动引导...')
      // 延迟一下让页面完全加载
      await new Promise(resolve => setTimeout(resolve, 1500))
      await startProjectTour(projectId)
    } else {
      console.log('[Tour] 项目引导已完成，跳过自动启动')
    }
  }

  // 开始项目详情页引导
  const startProjectTour = async (projectId: string) => {
    console.log('[Tour] startProjectTour 被调用，projectId:', projectId)
    await nextTick()
    
    // 等待 DOM 完全渲染
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 检查目标元素是否存在
    const steps = getProjectTourSteps()
    console.log('[Tour] 项目引导步骤数量:', steps.length)
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      if (step && step.target) {
        const target = typeof step.target === 'string' 
          ? document.querySelector(step.target)
          : typeof step.target === 'function'
          ? step.target()
          : step.target
        
        console.log(`[Tour] 项目步骤 ${i + 1} 目标元素:`, {
          selector: typeof step.target === 'string' ? step.target : 'function/element',
          found: !!target,
          title: step.title
        })
      }
    }
    
    console.log('[Tour] 调用 tourStore.startTour()')
    tourStore.startTour()
    console.log('[Tour] tourStore.isTourActive:', tourStore.isTourActive)
  }

  // 标记项目引导已完成
  const markProjectTourCompleted = (projectId: string) => {
    const key = `project_tour_completed_${projectId}`
    localStorage.setItem(key, 'true')
    tourStore.markTourCompleted()
  }

  // 重置项目引导状态
  const resetProjectTour = (projectId: string) => {
    const key = `project_tour_completed_${projectId}`
    localStorage.removeItem(key)
    tourStore.resetTour()
  }

  return {
    tourRef,
    getTourSteps: getSidebarTourSteps, // 侧边栏引导步骤
    getProjectTourSteps, // 项目详情页引导步骤
    startTour,
    stopTour,
    checkAndStartTour,
    checkAndStartProjectTour,
    startProjectTour,
    markProjectTourCompleted,
    resetProjectTour,
    triggerTour,
    isTourActive: () => tourStore.isTourActive
  }
}

