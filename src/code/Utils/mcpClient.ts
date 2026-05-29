/**
 * 从 MCP HTTP 请求头 / 工具参数解析客户端标识（对应 Cursor mcp.json 的 headers）
 */

export interface McpClientInfo {
  id: string
  label: string
}

const DEFAULT_CLIENT: McpClientInfo = { id: 'ai', label: 'AI' }

const KNOWN_LABELS: Record<string, string> = {
  ai: 'AI',
  cursor: 'Cursor',
  claude: 'Claude',
  deepseek: 'DeepSeek',
  codex: 'Codex'
}

const CLIENT_HEADER_NAMES = ['X-TaskBanner-Client', 'X-MCP-Client', 'X-Agent-Client']

function readHeader(name: string): string | undefined {
  try {
    const request = k.request
    if (!request) return undefined

    if (typeof request.get === 'function') {
      const viaGet = request.get(name) || request.get(name.toLowerCase())
      if (viaGet) return viaGet
    }

    const headers = request.headers
    if (!headers) return undefined
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

function readAnyClientHeader(): string | undefined {
  for (const name of CLIENT_HEADER_NAMES) {
    const value = readHeader(name)
    if (value) return value
  }
  return undefined
}

function parseRequestJson(): Record<string, unknown> | null {
  try {
    const raw = k.request?.body
    if (!raw) return null
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

/** 从 MCP JSON-RPC body（params._meta / params.client）兜底读取 */
function extractClientFromMcpBody(): string | undefined {
  const root = parseRequestJson()
  if (!root) return undefined

  const params = root.params as Record<string, unknown> | undefined
  if (!params) return undefined

  if (typeof params.client === 'string' && params.client.trim()) {
    return params.client.trim()
  }

  const meta = params._meta as Record<string, unknown> | undefined
  if (!meta) return undefined

  if (typeof meta.client === 'string' && meta.client.trim()) {
    return meta.client.trim()
  }

  const metaHeaders = meta.headers as Record<string, string> | undefined
  if (metaHeaders) {
    for (const name of CLIENT_HEADER_NAMES) {
      const value = metaHeaders[name] ?? metaHeaders[name.toLowerCase()]
      if (value) return value
    }
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

/** 当前 MCP 请求对应的客户端 */
export function resolveMcpClient(toolArgs?: Record<string, unknown>): McpClientInfo {
  const raw =
    readAnyClientHeader() ||
    (typeof toolArgs?.client === 'string' ? toolArgs.client : undefined) ||
    extractClientFromMcpBody()

  const id = normalizeMcpClientId(raw)
  return { id, label: getMcpClientLabel(id) }
}

/** @deprecated 使用 resolveMcpClient */
export function getMcpClientFromRequest(): McpClientInfo {
  return resolveMcpClient()
}

/** 写入评论等资源的 metadata */
export function buildMcpMetadata(
  toolArgs?: Record<string, unknown>,
  extra?: Record<string, unknown>
): Record<string, unknown> {
  const client = resolveMcpClient(toolArgs)
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
