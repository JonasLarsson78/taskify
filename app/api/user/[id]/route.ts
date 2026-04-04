import { NextResponse } from 'next/server'
import { canManageWorkspace, canWriteTasks } from '../../../../lib/user-role'
import { publishWorkspaceEvent } from '../../../../lib/realtime/workspace-events'
import { forbidden, requireApiUser } from '../../_lib/authorization'
import { getUserById, updateUser } from '../service'
import { normalizeUpdateUserInput, parseJsonBody } from '../validator'

function parseUserId(id: string) {
  const userId = Number.parseInt(id, 10)
  return Number.isNaN(userId) ? null : userId
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireApiUser(request)
    if (!auth.ok) return auth.response

    const { id } = await params
    const userId = parseUserId(id)

    if (userId === null) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
    }

    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const sameOrg = auth.user.organizationId === user.organizationId
    const isSelf = auth.user.id === user.id
    if (!isSelf && !sameOrg) {
      return forbidden('You do not have access to this user')
    }

    const { password: _, ...safe } = user
    void _
    return NextResponse.json(safe)
  } catch (error) {
    console.error('GET /api/user/[id] error', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireApiUser(request)
    if (!auth.ok) return auth.response
    if (!canWriteTasks(auth.user.role)) {
      return forbidden('Guests cannot update users')
    }

    const { id } = await params
    const userId = parseUserId(id)

    if (userId === null) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
    }

    const existingUser = await getUserById(userId)
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isSelf = auth.user.id === existingUser.id
    const sameOrg = auth.user.organizationId === existingUser.organizationId
    if (!isSelf && !sameOrg) {
      return forbidden('You do not have access to this user')
    }

    let body: unknown = null
    try {
      body = await parseJsonBody(request)
    } catch (error) {
      console.error('Failed to parse user update body', error)
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = normalizeUpdateUserInput(body)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const patch = { ...parsed.data }

    if (!canManageWorkspace(auth.user.role)) {
      if (!isSelf) {
        return forbidden('Only admins can edit other users')
      }

      if ('role' in patch || 'organizationId' in patch) {
        return forbidden('Only admins can change roles or organization')
      }
    }

    if (
      canManageWorkspace(auth.user.role) &&
      auth.user.organizationId !== null &&
      patch.organizationId !== undefined &&
      patch.organizationId !== auth.user.organizationId
    ) {
      return forbidden('Users must stay within your organization')
    }

    const updated = await updateUser(userId, patch)
    publishWorkspaceEvent(updated.organizationId, 'user.changed')
    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/user/[id] error', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}
