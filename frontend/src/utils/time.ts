/**
 * 时间格式化工具函数
 */

/**
 * 格式化相对时间显示
 * @param timestamp 时间戳（毫秒）
 * @returns 相对时间字符串
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) {
    const date = new Date(timestamp)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } else if (days > 0) {
    return `${days} 天前`
  } else if (hours > 0) {
    return `${hours} 小时前`
  } else if (minutes > 0) {
    return `${minutes} 分钟前`
  } else {
    return '刚刚'
  }
}

/**
 * 格式化日期显示（智能相对时间）
 * @param timestamp 时间戳（毫秒）
 * @returns 格式化的日期字符串
 */
export function formatDate(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    const minutes = Math.floor(diff / minute)
    return `${minutes}分钟前`
  } else if (diff < day) {
    const hours = Math.floor(diff / hour)
    return `${hours}小时前`
  } else {
    // 计算今天0点的时间
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTime = today.getTime()

    // 计算 timestamp 是哪一天，和今天的天数差
    const inputDate = new Date(timestamp)
    inputDate.setHours(0, 0, 0, 0)
    const inputTime = inputDate.getTime()
    const dayDiff = Math.floor((todayTime - inputTime) / day)

    if (dayDiff === 0) {
      // 今天，但是前面已判断过 <day，不会到这里
      return '今天'
    } else if (dayDiff === 1) {
      return '昨天'
    } else if (dayDiff === 2) {
      return '前天'
    } else {
      // 超过前天显示具体日期
      return new Date(timestamp).toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit'
      })
    }
  }
}