import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'
import { verifyToken } from '../../../lib/auth'

export async function GET(request: Request) {
  try {
    const auth = request.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth || null

    if (!token)
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // expect payload to contain userId (number or numeric string)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const rawUserId = (payload as Record<string, unknown>).userId
    const userId =
      typeof rawUserId === 'number'
        ? rawUserId
        : typeof rawUserId === 'string'
        ? parseInt(rawUserId, 10)
        : null
    if (!userId || Number.isNaN(userId))
      return NextResponse.json(
        { error: 'Invalid token payload' },
        { status: 401 }
      )

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { password: _, ...safe } = user
    void _
    return NextResponse.json({ ok: true, user: safe })
  } catch (e) {
    console.error('GET /api/verify error', e)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  // allow token in JSON body as `token` for convenience
  try {
    const body = await request.json().catch(() => null)
    const token = body?.token || null
    if (!token)
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    const payload = verifyToken(token)
    if (!payload || typeof payload !== 'object')
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const rawUserId = (payload as Record<string, unknown>).userId
    const userId =
      typeof rawUserId === 'number'
        ? rawUserId
        : typeof rawUserId === 'string'
        ? parseInt(rawUserId, 10)
        : null
    if (!userId || Number.isNaN(userId))
      return NextResponse.json(
        { error: 'Invalid token payload' },
        { status: 401 }
      )

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { password: _, ...safe } = user
    void _
    return NextResponse.json({ ok: true, user: safe })
  } catch (e) {
    console.error('POST /api/verify error', e)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
