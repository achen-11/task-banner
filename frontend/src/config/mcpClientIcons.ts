import { normalizeMcpClientId } from '@/utils/mcpClient'

/** Kooboo 媒体库 `images/mcp-clients/` 同步后的访问路径 */
export const MCP_CLIENT_ICON_BASE =
  (import.meta.env.VITE_MCP_CLIENT_ICON_BASE as string | undefined)?.replace(/\/$/, '') ||
  '/images/mcp-clients'

export function getMcpClientIconUrl(clientId?: string | null): string {
  const id = normalizeMcpClientId(clientId)
  return `${MCP_CLIENT_ICON_BASE}/${id}.svg`
}
