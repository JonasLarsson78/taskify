export function extractTokenFromAuthorizationHeader(
  request: Request
): string | null {
  const auth = request.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth
  const normalized = token.trim()
  return normalized.length > 0 ? normalized : null
}

export async function extractTokenFromJsonBody(
  request: Request
): Promise<string | null> {
  const body = await request.json().catch(() => null)
  const token =
    body && typeof body === 'object' && 'token' in body
      ? (body as Record<string, unknown>).token
      : null

  return typeof token === 'string' && token.trim().length > 0 ? token : null
}
