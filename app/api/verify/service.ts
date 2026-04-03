import prisma from '../../../lib/prisma'
import { verifyToken } from '../../../lib/auth'

type VerifyResult =
  | { ok: true; user: Record<string, unknown> }
  | { ok: false; status: number; error: string }

function getUserIdFromPayload(payload: unknown): number | null {
  if (!payload || typeof payload !== 'object') return null

  const rawUserId = (payload as Record<string, unknown>).userId
  const userId =
    typeof rawUserId === 'number'
      ? rawUserId
      : typeof rawUserId === 'string'
      ? parseInt(rawUserId, 10)
      : null

  if (!userId || Number.isNaN(userId)) return null
  return userId
}

export async function verifyAndLoadUser(token: string): Promise<VerifyResult> {
  const payload = verifyToken(token)
  if (!payload || typeof payload !== 'object') {
    return { ok: false, status: 401, error: 'Invalid token' }
  }

  const userId = getUserIdFromPayload(payload)
  if (!userId) {
    return { ok: false, status: 401, error: 'Invalid token payload' }
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return { ok: false, status: 404, error: 'User not found' }
  }

  const { password: _, ...safe } = user
  void _

  return { ok: true, user: safe as Record<string, unknown> }
}
