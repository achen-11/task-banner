export function parseMcpRequestArgs(body: unknown): Record<string, unknown> {
  const parsed =
    typeof body === 'string'
      ? JSON.parse(body || '{}')
      : body && typeof body === 'object'
        ? body
        : {}
  const args = (parsed as Record<string, unknown>).arguments ?? parsed
  return args && typeof args === 'object' && !Array.isArray(args)
    ? (args as Record<string, unknown>)
    : {}
}
