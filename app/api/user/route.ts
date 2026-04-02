import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'

export async function GET() {
  try {
    const users = await prisma.user.findMany()
    return NextResponse.json(users)
  } catch (e) {
    console.error('GET /api/user error', e)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  let body = null
  try {
    body = await request.json()
  } catch (e: Error | unknown) {
    console.error('Failed to parse JSON body:', e instanceof Error ? e.message : String(e))
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const user = await prisma.user.create({ data: { name: body.name ?? null, email: body.email ?? null } })
    return NextResponse.json(user)
  } catch (e) {
    console.error('POST /api/user error', e)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
