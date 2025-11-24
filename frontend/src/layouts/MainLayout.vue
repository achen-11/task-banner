<template>
  <div class="flex h-screen bg-gray-50">
    <!-- 侧边栏 -->
    <Sidebar :is-collapsed="uiStore.sidebarCollapsed" />

    <!-- 主内容区域 -->
    <div class="flex-1 flex flex-col min-h-screen overflow-hidden">
      <!-- Header -->
      <AppHeader @toggle-sidebar="toggleSidebar" />

      <!-- 页面内容 -->
      <main class="flex-1 overflow-auto">
        <div class="w-full px-4 py-4 mx-auto h-full">
          <router-view />
        </div>
      </main>
    </div>

    <!-- 快捷键说明面板 -->
    <KeyboardShortcutsPanel ref="shortcutsPanelRef" />
    
    <!-- 全局搜索面板 -->
    <GlobalSearchModal ref="globalSearchRef" />
    
    <!-- 漫游式引导 -->
    <el-tour
      v-if="tourSteps.length > 0"
      ref="tourRef"
      v-model="tourVisible"
      :current="tourCurrent"
      :show-close="true"
      :show-arrow="true"
      @finish="handleTourFinish"
      @close="handleTourClose"
      @change="handleTourChange"
    >
      <el-tour-step
        v-for="(step, index) in tourSteps"
        :key="index"
        :target="step.target"
        :title="step.title"
        :description="step.description"
        :placement="step.placement"
        :mask="step.mask"
        :show-arrow="step.showArrow"
        :show-close="step.showClose"
        :content-style="step.contentStyle"
      />
    </el-tour>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElTour, ElTourStep } from 'element-plus'
import { useRoute } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'
import AppHeader from '@/components/AppHeader.vue'
import KeyboardShortcutsPanel from '@/components/common/KeyboardShortcutsPanel.vue'
import GlobalSearchModal from '@/components/common/GlobalSearchModal.vue'
import { useKeyboard, registerShortcut } from '@/composables/useKeyboard'
import { useUIStore } from '@/stores/ui'
import { useTour } from '@/composables/useTour'
import { useTourStore } from '@/stores/tour'

// UI状态管理
const uiStore = useUIStore()
const tourStore = useTourStore()

// 快捷键面板引用
const shortcutsPanelRef = ref<InstanceType<typeof KeyboardShortcutsPanel> | null>(null)
// 全局搜索面板引用
const globalSearchRef = ref<InstanceType<typeof GlobalSearchModal> | null>(null)

// 引导相关
const { tourRef, getTourSteps, getProjectTourSteps, checkAndStartTour, triggerTour } = useTour()
const route = useRoute()
const tourSteps = ref(getTourSteps())
const tourVisible = ref(false)

// 根据路由动态切换引导步骤
watch(() => route.path, (path) => {
  // 如果是项目详情页，使用项目引导步骤
  if (path.match(/^\/projects\/[^/]+$/)) {
    tourSteps.value = getProjectTourSteps()
  } else {
    // 其他页面使用侧边栏引导步骤
    tourSteps.value = getTourSteps()
  }
}, { immediate: true })

// 监听引导状态变化，同步 Tour 显示
watch(() => tourStore.isTourActive, (isActive) => {
  console.log('[Tour] isTourActive 变化:', isActive)
  if (isActive) {
    // 延迟一下确保 DOM 更新完成
    nextTick(() => {
      console.log('[Tour] 设置 tourVisible = true')
      tourVisible.value = true
      console.log('[Tour] tourVisible 当前值:', tourVisible.value)
    })
  } else {
    tourVisible.value = false
  }
}, { immediate: true })

// 监听 tourVisible 变化，同步到 store
watch(tourVisible, (visible) => {
  if (!visible && tourStore.isTourActive) {
    tourStore.stopTour()
  }
})
const tourCurrent = ref(0)

// 切换侧边栏
const toggleSidebar = () => {
  uiStore.toggleSidebar()
}

// 处理引导完成
const handleTourFinish = () => {
  console.log('[Tour] 引导完成')
  // 如果是项目详情页，标记项目引导完成
  const projectId = route.params.projectId || route.params.id
  if (projectId && typeof projectId === 'string') {
    const { markProjectTourCompleted } = useTour()
    markProjectTourCompleted(projectId)
  } else {
    // 否则标记侧边栏引导完成
    tourStore.markTourCompleted()
  }
  tourCurrent.value = 0
  tourVisible.value = false
}

// 处理引导关闭
const handleTourClose = () => {
  console.log('[Tour] 引导关闭')
  tourStore.stopTour()
  tourCurrent.value = 0
  tourVisible.value = false
}

// 处理引导步骤变化
const handleTourChange = (current: number) => {
  console.log('[Tour] 步骤变化:', current)
  tourCurrent.value = current
  tourStore.setCurrentStep(current)
}

// 初始化快捷键系统
useKeyboard()

// 监听重新开始引导事件
const handleStartTourEvent = async () => {
  // 确保侧边栏展开
  if (uiStore.sidebarCollapsed) {
    uiStore.setSidebarCollapsed(false)
    await new Promise(resolve => setTimeout(resolve, 300))
  }
  
  await triggerTour()
  tourVisible.value = true
  tourCurrent.value = 0
}

// 注册全局快捷键和初始化引导
onMounted(() => {
  // Cmd/Ctrl + B: 切换侧边栏
  registerShortcut({
    key: 'b',
    meta: true,
    description: '展开/收起左侧菜单栏',
    category: '导航',
    handler: toggleSidebar
  })

  // Cmd/Ctrl + Shift + .: 查看快捷键说明
  registerShortcut({
    key: '.',
    meta: true,
    shift: true,
    description: '查看快捷键说明',
    category: '帮助',
    handler: () => {
      shortcutsPanelRef.value?.toggle()
    }
  })

  // Cmd/Ctrl + K: 全局搜索
  registerShortcut({
    key: 'k',
    meta: true,
    description: '全局搜索',
    category: '搜索',
    handler: () => {
      globalSearchRef.value?.show()
    }
  })
  
  // 检查并启动引导
  checkAndStartTour()
  
  // 监听重新开始引导事件
  window.addEventListener('start-tour', handleStartTourEvent)
})

onUnmounted(() => {
  window.removeEventListener('start-tour', handleStartTourEvent)
})
</script>
