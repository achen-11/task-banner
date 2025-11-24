import { ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * 引导状态管理
 */
export const useTourStore = defineStore('tour', () => {
  // 是否已完成引导
  const hasCompletedTour = ref(false)
  
  // 是否正在引导中
  const isTourActive = ref(false)
  
  // 当前引导步骤
  const currentStep = ref(0)
  
  // 初始化：从 localStorage 读取完成状态
  const initTourState = () => {
    const stored = localStorage.getItem('tour_completed')
    hasCompletedTour.value = stored === 'true'
  }
  
  // 标记引导已完成
  const markTourCompleted = () => {
    hasCompletedTour.value = true
    isTourActive.value = false
    localStorage.setItem('tour_completed', 'true')
  }
  
  // 开始引导
  const startTour = () => {
    isTourActive.value = true
    currentStep.value = 0
  }
  
  // 结束引导
  const stopTour = () => {
    isTourActive.value = false
    currentStep.value = 0
  }
  
  // 重置引导状态（用于重新开始引导）
  const resetTour = () => {
    hasCompletedTour.value = false
    isTourActive.value = false
    currentStep.value = 0
    localStorage.removeItem('tour_completed')
  }
  
  // 更新当前步骤
  const setCurrentStep = (step: number) => {
    currentStep.value = step
  }
  
  // 初始化
  initTourState()
  
  return {
    hasCompletedTour,
    isTourActive,
    currentStep,
    startTour,
    stopTour,
    markTourCompleted,
    resetTour,
    setCurrentStep
  }
})

