import type { UserPreferences } from '@/types/auth'

export const TASK_STATUS_OPTIONS = [
  { value: 'todo', label: '待办' },
  { value: 'in_progress', label: '进行中' },
  { value: 'review', label: '待验收' },
  { value: 'completed', label: '已完成' }
] as const

export type TaskStatusValue = typeof TASK_STATUS_OPTIONS[number]['value']

export const DEFAULT_MY_TASKS_STATUSES: TaskStatusValue[] = ['todo', 'review']

const VALID_STATUSES = new Set<string>(TASK_STATUS_OPTIONS.map(o => o.value))

export function getMyTasksDefaultStatuses(preferences?: UserPreferences | null): TaskStatusValue[] {
  const statuses = preferences?.myTasksDefaultStatuses
  if (!statuses?.length) return [...DEFAULT_MY_TASKS_STATUSES]

  const filtered = statuses.filter((s): s is TaskStatusValue => VALID_STATUSES.has(s))
  return filtered.length > 0 ? filtered : [...DEFAULT_MY_TASKS_STATUSES]
}
