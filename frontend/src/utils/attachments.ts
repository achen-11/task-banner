import type { Attachment } from '@/api/attachment'

/** 将 API/DB 返回的 attachments 规范为数组（兼容 JSON 字符串、非数组对象） */
export function normalizeAttachmentList(raw: unknown): Attachment[] {
  if (Array.isArray(raw)) {
    return raw as Attachment[]
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as Attachment[]) : []
    } catch {
      return []
    }
  }
  return []
}
