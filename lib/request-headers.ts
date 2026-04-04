export function buildAuthHeaders(
  token: string | null
): Record<string, string> | undefined {
  return token ? { Authorization: `Bearer ${token}` } : undefined
}

export function buildJsonAuthHeaders(
  token: string | null
): Record<string, string> {
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' }
}
