import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'
import bcrypt from 'bcryptjs'
import type { User } from '@prisma/client'

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
    const plain = typeof body?.password === 'string' ? body.password : null
    const hashed = plain ? await bcrypt.hash(plain, 10) : null

    const created = await prisma.user.create({
      data: {
        name: body.name ?? null,
        email: body.email ?? null,
        password: hashed,
      },
    })

    // Do not return the password hash in the response
    const { password: _, ...safe } = created as User
    void _
    return NextResponse.json(safe)
  } catch (e) {
    console.error('POST /api/user error', e)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
