import { NextResponse } from 'next/server'
import { canManageWorkspace } from '../../../lib/user-role'
import { forbidden, requireApiUser } from '../_lib/authorization'
import {
  createUser,
  ensureOrganizationExists,
  listUsers,
  listUsersByOrganization,
} from './service'
import { normalizeCreateUserInput, parseJsonBody } from './validator'

export async function GET(request: Request) {
  try {
    const auth = await requireApiUser(request)
    if (!auth.ok) return auth.response

    const users = canManageWorkspace(auth.user.role)
      ? auth.user.organizationId === null
        ? await listUsers()
        : await listUsersByOrganization(auth.user.organizationId)
      : await listUsersByOrganization(auth.user.organizationId)

    const safeUsers = users.map(({ password: _password, ...safe }) => {
      void _password
      return safe
    })
    return NextResponse.json(safeUsers)
  } catch (e) {
    console.error('GET /api/user error', e)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const auth = await requireApiUser(request)
  if (!auth.ok) return auth.response
  if (!canManageWorkspace(auth.user.role)) {
    return forbidden('Only admins can create users')
  }

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
    if (
      auth.user.organizationId !== null &&
      input.organizationId !== auth.user.organizationId
    ) {
      return NextResponse.json(
        { error: 'Users must belong to your organization' },
        { status: 403 }
      )
    }

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
