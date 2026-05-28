/**
 * 从 MCP HTTP 请求头解析客户端标识（对应 Cursor mcp.json 的 headers）
 */

export interface McpClientInfo {
  id: string
  label: string
}

const DEFAULT_CLIENT: McpClientInfo = { id: 'ai', label: 'AI' }

const KNOWN_LABELS: Record<string, string> = {
  ai: 'AI',
  cursor: 'Cursor',
  codex: 'Codex'
}

function readHeader(name: string): string | undefined {
  try {
    const request = k.request
    if (!request?.headers) return undefined
    const headers = request.headers
    if (typeof headers.get === 'function') {
      return headers.get(name) ?? headers.get(name.toLowerCase()) ?? undefined
    }
    if (typeof headers === 'object') {
      const h = headers as Record<string, string>
      return h[name] ?? h[name.toLowerCase()]
    }
  } catch {
    /* MCP 等场景 */
  }
  return undefined
}

export function normalizeMcpClientId(raw: string | undefined | null): string {
  const id = String(raw || 'ai').trim().toLowerCase()
  return id || 'ai'
}

export function getMcpClientLabel(id: string): string {
  const normalized = normalizeMcpClientId(id)
  return KNOWN_LABELS[normalized] || normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

/** 当前 MCP 请求对应的客户端；无 header 时为 AI */
export function getMcpClientFromRequest(): McpClientInfo {
  const raw =
    readHeader('X-TaskBanner-Client') ||
    readHeader('X-MCP-Client') ||
    readHeader('X-Agent-Client')
  const id = normalizeMcpClientId(raw)
  return { id, label: getMcpClientLabel(id) }
}

/** 写入评论等资源的 metadata */
export function buildMcpMetadata(extra?: Record<string, unknown>): Record<string, unknown> {
  const client = getMcpClientFromRequest()
  return {
    source: 'mcp',
    client: client.id,
    clientLabel: client.label,
    ...(extra || {})
  }
}

export function resolveMcpClientFromMetadata(
  metadata?: Record<string, unknown> | null
): McpClientInfo {
  if (!metadata || metadata.source !== 'mcp') {
    return DEFAULT_CLIENT
  }
  const id = normalizeMcpClientId(metadata.client as string | undefined)
  const label =
    typeof metadata.clientLabel === 'string' && metadata.clientLabel.trim()
      ? metadata.clientLabel.trim()
      : getMcpClientLabel(id)
  return { id, label }
}
