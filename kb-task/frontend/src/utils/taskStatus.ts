/**
 * 任务状态和优先级工具函数
 */

/**
 * 获取状态徽章样式类名
 * @param status 任务状态
 * @returns CSS类名字符串
 */
export function getStatusBadgeClass(status: string): string {
  const classMap: { [key: string]: string } = {
    todo: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    review: 'bg-orange-100 text-orange-700',
    completed: 'bg-green-100 text-green-700'
  }
  return classMap[status] || classMap.todo!
}

/**
 * 获取状态显示文本
 * @param status 任务状态
 * @returns 状态文本字符串
 */
export function getStatusText(status: string): string {
  const textMap: { [key: string]: string } = {
    todo: '待办',
    in_progress: '进行中',
    review: '待验收',
    completed: '已完成'
  }
  return textMap[status] ?? status
}

/**
 * 获取状态图标样式类名
 * @param status 任务状态
 * @returns CSS类名字符串
 */
export function getStatusIconClass(status: string): string {
  const classMap: { [key: string]: string } = {
    todo: 'border-2 border-gray-300 text-gray-300',
    in_progress: 'bg-blue-500 text-white',
    review: 'bg-orange-500 text-white',
    completed: 'bg-green-500 text-white'
  }
  return classMap[status] || classMap.todo!
}

/**
 * 获取优先级徽章样式类名
 * @param priority 任务优先级
 * @returns CSS类名字符串
 */
export function getPriorityBadgeClass(priority: string): string {
  const classMap: { [key: string]: string } = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700'
  }
  return classMap[priority] || classMap.medium!
}

/**
 * 获取优先级显示文本
 * @param priority 任务优先级
 * @returns 优先级文本字符串
 */
export function getPriorityText(priority: string): string {
  const textMap: { [key: string]: string } = {
    low: '低',
    medium: '中',
    high: '高'
  }
  return textMap[priority] ?? priority
}