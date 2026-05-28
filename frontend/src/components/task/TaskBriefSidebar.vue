<template>
  <aside class="h-full flex flex-col border-l border-gray-200 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-900/50 w-[240px] flex-shrink-0">
    <div class="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        任务信息
      </h4>
    </div>

    <div class="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      <div class="space-y-3">
        <div>
          <label class="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">状态</label>
          <el-select
            v-if="!readonly"
            v-model="local.status"
            size="small"
            class="w-full"
            @change="emitUpdate({ status: local.status })"
          >
            <el-option label="待办" value="todo" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="待验收" value="review" />
            <el-option label="已完成" value="completed" />
          </el-select>
          <span
            v-else
            class="inline-flex px-2 py-0.5 rounded-md text-xs font-medium"
            :class="statusBadgeClass"
          >
            {{ statusLabel }}
          </span>
        </div>

        <div>
          <label class="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">优先级</label>
          <el-select
            v-if="!readonly"
            v-model="local.priority"
            size="small"
            class="w-full"
            @change="emitUpdate({ priority: local.priority })"
          >
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
          </el-select>
          <span v-else class="text-xs text-gray-800 dark:text-gray-200">{{ priorityLabel }}</span>
        </div>

        <div>
          <label class="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">指派人</label>
          <el-select
            v-if="!readonly"
            v-model="local.assigneeId"
            size="small"
            clearable
            class="w-full"
            placeholder="未指派"
            @change="emitUpdate({ assigneeId: local.assigneeId })"
          >
            <el-option
              v-for="m in members"
              :key="m.userId"
              :label="memberName(m)"
              :value="m.userId"
            />
          </el-select>
          <span v-else class="text-xs text-gray-800 dark:text-gray-200">{{ assigneeLabel }}</span>
        </div>

        <div>
          <label class="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">截止</label>
          <el-date-picker
            v-if="!readonly"
            :model-value="local.dueDate"
            type="date"
            size="small"
            class="w-full"
            placeholder="未设置"
            format="MM/DD"
            @update:model-value="onDueDate"
          />
          <span v-else class="text-xs text-gray-800 dark:text-gray-200">{{ dueLabel }}</span>
        </div>
      </div>

      <div v-if="moduleLabels.length" class="pt-2 border-t border-gray-200 dark:border-gray-700">
        <p class="text-[11px] text-gray-500 dark:text-gray-400 mb-1.5">模块</p>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="name in moduleLabels"
            :key="name"
            class="px-1.5 py-0.5 text-[10px] rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300"
          >
            {{ name }}
          </span>
        </div>
      </div>

      <div v-if="tagLabels.length" class="pt-2 border-t border-gray-200 dark:border-gray-700">
        <p class="text-[11px] text-gray-500 dark:text-gray-400 mb-1.5">标签</p>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="t in tagLabels"
            :key="t.id"
            class="px-1.5 py-0.5 text-[10px] rounded text-white truncate max-w-full"
            :style="{ backgroundColor: t.color || '#3762E3' }"
          >
            {{ t.name }}
          </span>
        </div>
      </div>

      <div class="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1 text-[11px] text-gray-500 dark:text-gray-400">
        <p><span class="text-gray-400">创建</span> {{ formatDate(local.createdAt || 0) }}</p>
        <p><span class="text-gray-400">更新</span> {{ formatDate(local.updatedAt || 0) }}</p>
      </div>

      <div class="pt-2 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-2">
          <p class="text-[11px] font-medium text-gray-500 dark:text-gray-400">最近变更</p>
          <button
            v-if="showViewAllChangelog"
            type="button"
            class="text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
            @click="emit('view-all-changelog')"
          >
            查看全部
          </button>
        </div>
        <ul v-if="recentChanges.length" class="space-y-2">
          <li
            v-for="item in recentChanges"
            :key="item.id"
            class="text-[11px] text-gray-600 dark:text-gray-400 leading-snug line-clamp-2"
          >
            {{ item.text }}
            <span class="block text-[10px] text-gray-400 mt-0.5">{{ formatRelativeTime(item.timestamp) }}</span>
          </li>
        </ul>
        <p v-else class="text-[11px] text-gray-400">暂无记录</p>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { getProjectMembers } from '@/api/project'
import { getProjectTags } from '@/api/tag'
import { getModuleList } from '@/api/module'
import { getTaskActivities } from '@/api/task'
import { formatRelativeTime } from '@/utils/time'
import type { ProjectMember } from '@/types/project'
import type { Tag } from '@/types/tag'
import type { Module } from '@/types/module'
import type { Task } from '@/types/task'

const props = withDefaults(defineProps<{
  task: Task | null
  projectId?: string
  readonly?: boolean
  /** 当前主区 Tab 为讨论时显示「查看全部」 */
  showViewAllChangelog?: boolean
}>(), {
  showViewAllChangelog: true
})

const emit = defineEmits<{
  (e: 'update', payload: Partial<Task>): void
  (e: 'view-all-changelog'): void
}>()

const local = ref<Partial<Task>>({
  _id: '',
  status: 'todo',
  priority: 'medium',
  createdAt: Date.now(),
  updatedAt: Date.now()
})

const members = ref<ProjectMember[]>([])
const tags = ref<Tag[]>([])
const modules = ref<Module[]>([])
const recentChanges = ref<{ id: string; text: string; timestamp: number }[]>([])

const STATUS: Record<string, string> = {
  todo: '待办',
  in_progress: '进行中',
  review: '待验收',
  completed: '已完成'
}
const PRIORITY: Record<string, string> = { low: '低', medium: '中', high: '高' }

const statusLabel = computed(() => STATUS[local.value.status || 'todo'] || local.value.status)
const priorityLabel = computed(() => PRIORITY[local.value.priority || 'medium'] || local.value.priority)

const statusBadgeClass = computed(() => {
  const m: Record<string, string> = {
    todo: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    in_progress: 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    review: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
  }
  return m[local.value.status || 'todo'] || m.todo
})

const assigneeLabel = computed(() => {
  const m = members.value.find(x => x.userId === local.value.assigneeId)
  return m ? memberName(m) : '未指派'
})

const dueLabel = computed(() => {
  if (!local.value.dueDate) return '未设置'
  return new Date(local.value.dueDate).toLocaleDateString('zh-CN')
})

const moduleLabels = computed(() =>
  (local.value.moduleIds || [])
    .map(id => modules.value.find(m => m._id === id)?.name)
    .filter((n): n is string => !!n)
)

const tagLabels = computed(() => {
  const out: { id: string; name: string; color?: string }[] = []
  for (const id of local.value.tagIds || []) {
    const t = tags.value.find(x => x._id === id)
    if (t) out.push({ id, name: t.name, color: t.color })
  }
  return out
})

const memberName = (m: ProjectMember) => m.displayName || m.username || m.email || m.userId

const formatDate = (ts: number) =>
  new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })

const emitUpdate = (payload: Partial<Task>) => emit('update', payload)

const onDueDate = (v: number | null) => {
  local.value.dueDate = v || undefined
  emitUpdate({ dueDate: v || undefined })
}

const loadMeta = async () => {
  const pid = props.projectId || props.task?.projectId
  if (!pid) return
  const [mem, tagRes, modRes] = await Promise.all([
    getProjectMembers(pid),
    getProjectTags(pid),
    getModuleList(pid)
  ])
  members.value = mem.items
  tags.value = tagRes.items
  modules.value = modRes.items
}

const FIELD_LABELS: Record<string, string> = {
  title: '标题',
  content: '描述',
  status: '状态',
  priority: '优先级',
  assigneeId: '处理人',
  dueDate: '截止日期'
}

const loadRecentChanges = async () => {
  if (!props.task?._id) {
    recentChanges.value = []
    return
  }
  try {
    const data = await getTaskActivities(props.task._id)
    recentChanges.value = data
      .filter(a => a.type === 'field_change' || a.type === 'system')
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 3)
      .map(a => {
        if (a.type === 'field_change') {
          const label = a.field ? (FIELD_LABELS[a.field] || a.field) : '字段'
          const text = a.summary || (a.oldValue && a.newValue
            ? `${label}：${a.oldValue} → ${a.newValue}`
            : `更新了${label}`)
          return { id: a.id, text, timestamp: a.timestamp }
        }
        return { id: a.id, text: a.content || '系统事件', timestamp: a.timestamp }
      })
  } catch {
    recentChanges.value = []
  }
}

watch(() => props.task, (t) => {
  if (t) local.value = { ...t }
  loadRecentChanges()
}, { immediate: true, deep: true })

watch(() => props.projectId, loadMeta, { immediate: true })

defineExpose({ reloadChanges: loadRecentChanges })

onMounted(loadMeta)
</script>
