import { normalizeMcpClientId } from '@/utils/mcpClient'

/** 远程站点上传目录对应 URL；本地 dev 用 public/mcp-clients */
export const MCP_CLIENT_ICON_BASE =
  (import.meta.env.VITE_MCP_CLIENT_ICON_BASE as string | undefined)?.replace(/\/$/, '') ||
  '/mcp-clients'

export function getMcpClientIconUrl(clientId?: string | null): string {
  const id = normalizeMcpClientId(clientId)
  return `${MCP_CLIENT_ICON_BASE}/${id}.svg`
}
