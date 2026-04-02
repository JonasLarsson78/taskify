import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'
import bcrypt from 'bcryptjs'
import { signToken } from '../../../lib/auth'

export async function POST(request: Request) {
  let body = null
  try {
    body = await request.json()
  } catch (e: Error | unknown) {
    console.error('Failed to parse JSON body:', e instanceof Error ? e.message : String(e))
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const email = body?.email
  const password = body?.password

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }
  if (!password || typeof password !== 'string') {
    return NextResponse.json({ error: 'Password is required' }, { status: 400 })
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.password) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const token = signToken({ userId: user.id })
    const { password: _, ...safe } = user
    void _
    return NextResponse.json({ ok: true, user: safe, token })
  } catch (e) {
    console.error('POST /api/login error', e)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ info: 'POST to this endpoint with {"email":"..."} to login' })
}
