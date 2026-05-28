export interface McpClientInfo {
  id: string
  label: string
}

export const DEFAULT_MCP_CLIENT: McpClientInfo = { id: 'ai', label: 'AI' }

export interface McpClientStyle {
  label: string
  avatarClass: string
  initials: string
}

export const MCP_CLIENT_STYLES: Record<string, McpClientStyle> = {
  ai: {
    label: 'AI',
    avatarClass: 'bg-[#3762E3] text-white',
    initials: 'AI'
  },
  cursor: {
    label: 'Cursor',
    avatarClass: 'bg-neutral-900 text-white',
    initials: 'Cu'
  },
  codex: {
    label: 'Codex',
    avatarClass: 'bg-emerald-700 text-white',
    initials: 'Cx'
  },
  claude: {
    label: 'Claude',
    avatarClass: 'bg-[#D97757] text-white',
    initials: 'Cl'
  },
  deepseek: {
    label: 'DeepSeek',
    avatarClass: 'bg-[#0066FF] text-white',
    initials: 'DS'
  }
}

export function normalizeMcpClientId(raw?: string | null): string {
  const id = String(raw || 'ai').trim().toLowerCase()
  return id || 'ai'
}

export function getMcpClientStyle(id: string): McpClientStyle {
  const key = normalizeMcpClientId(id)
  const known = MCP_CLIENT_STYLES[key]
  if (known) return known
  const label = key.charAt(0).toUpperCase() + key.slice(1)
  return {
    label,
    avatarClass: 'bg-slate-600 text-white',
    initials: label.slice(0, 2)
  }
}

export function resolveMcpClientFromMetadata(
  metadata?: Record<string, unknown> | null
): McpClientInfo {
  if (!metadata || metadata.source !== 'mcp') {
    return DEFAULT_MCP_CLIENT
  }
  const id = normalizeMcpClientId(metadata.client as string | undefined)
  const label =
    typeof metadata.clientLabel === 'string' && metadata.clientLabel.trim()
      ? metadata.clientLabel.trim()
      : getMcpClientStyle(id).label
  return { id, label }
}

export function isMcpAgentMetadata(metadata?: Record<string, unknown> | null): boolean {
  return Boolean(metadata && metadata.source === 'mcp')
}

export function isMcpAgentComment(
  commentType?: string,
  metadata?: Record<string, unknown> | null
): boolean {
  if (isMcpAgentMetadata(metadata)) return true
  return commentType === 'ai_completion' || commentType === 'ai_revision' || commentType === 'system'
}
