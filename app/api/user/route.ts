import { NextResponse } from 'next/server'
import { createUser, ensureOrganizationExists, listUsers } from './service'
import { normalizeCreateUserInput, parseJsonBody } from './validator'

export async function GET() {
  try {
    const users = await listUsers()
    return NextResponse.json(users)
  } catch (e) {
    console.error('GET /api/user error', e)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  let body: unknown = null
  try {
    body = await parseJsonBody(request)
  } catch (e: Error | unknown) {
    console.error(
      'Failed to parse JSON body:',
      e instanceof Error ? e.message : String(e)
    )
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const input = normalizeCreateUserInput(body)
    await ensureOrganizationExists(input.organizationId)
    const safe = await createUser(input)

    return NextResponse.json(safe)
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('Organization with id')) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }

    console.error('POST /api/user error', e)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
