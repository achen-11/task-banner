export type TaskStatusValue = 'todo' | 'in_progress' | 'review' | 'completed'

export interface UserPreferences {
  myTasksDefaultStatuses?: TaskStatusValue[]
}

export const DEFAULT_MY_TASKS_STATUSES: TaskStatusValue[] = ['todo', 'review']

const VALID_STATUSES = new Set<string>(['todo', 'in_progress', 'review', 'completed'])

export function normalizeUserPreferences(raw: unknown): UserPreferences {
  if (!raw || typeof raw !== 'object') return {}
  const input = raw as UserPreferences
  const statuses = input.myTasksDefaultStatuses
  if (!Array.isArray(statuses)) return {}

  const filtered = statuses.filter((s): s is TaskStatusValue =>
    typeof s === 'string' && VALID_STATUSES.has(s)
  )
  return filtered.length > 0 ? { myTasksDefaultStatuses: filtered } : {}
}

export function getMyTasksDefaultStatuses(preferences?: UserPreferences | null): TaskStatusValue[] {
  const statuses = preferences?.myTasksDefaultStatuses
  if (!statuses?.length) return [...DEFAULT_MY_TASKS_STATUSES]

  const filtered = statuses.filter((s): s is TaskStatusValue => VALID_STATUSES.has(s))
  return filtered.length > 0 ? filtered : [...DEFAULT_MY_TASKS_STATUSES]
}
