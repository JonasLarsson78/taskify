import { NextResponse } from 'next/server'
import { canManageWorkspace } from '../../../lib/user-role'
import { publishWorkspaceEvent } from '../../../lib/realtime/workspace-events'
import { forbidden, requireApiUser } from '../_lib/authorization'
import { addSpaceMember, createSpace, listSpacesForUser } from './service'

export async function GET(request: Request) {
  try {
    const auth = await requireApiUser(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const organizationIdRaw = searchParams.get('organizationId')
    const requestedOrganizationId = organizationIdRaw
      ? Number.parseInt(organizationIdRaw, 10)
      : Number.NaN
    const organizationId = auth.user.organizationId ?? requestedOrganizationId

    if (Number.isNaN(organizationId)) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      )
    }

    if (
      auth.user.organizationId !== null &&
      organizationId !== auth.user.organizationId
    ) {
      return forbidden('You do not have access to this organization')
    }

    const spaces = await listSpacesForUser({
      organizationId,
      userId: auth.user.id,
      role: auth.user.role,
    })
    return NextResponse.json(spaces)
  } catch (e) {
    console.error('GET /api/space error', e)
    return NextResponse.json(
      { error: 'Failed to fetch spaces' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiUser(request)
    if (!auth.ok) return auth.response
    if (!canManageWorkspace(auth.user.role)) {
      return forbidden('Only admins can create spaces')
    }

    const body = (await request.json().catch(() => null)) as {
      organizationId?: unknown
      name?: unknown
      memberIds?: unknown
    } | null

    const organizationId =
      typeof body?.organizationId === 'number'
        ? body.organizationId
        : Number.NaN
    const name = typeof body?.name === 'string' ? body.name.trim() : ''

    if (Number.isNaN(organizationId)) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      )
    }

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    if (
      auth.user.organizationId !== null &&
      organizationId !== auth.user.organizationId
    ) {
      return forbidden('Spaces must belong to your organization')
    }

    const created = await createSpace({
      organizationId,
      name: name.slice(0, 191),
    })

    if (created?.id) {
      await addSpaceMember(created.id, auth.user.id)
      const requestedMemberIds = Array.isArray(body?.memberIds)
        ? body.memberIds
            .filter((value): value is number => typeof value === 'number')
            .slice(0, 100)
        : []

      await Promise.all(
        requestedMemberIds.map((memberId) =>
          addSpaceMember(created.id, memberId)
        )
      )

      publishWorkspaceEvent(created.organizationId, 'space.changed')
    }

    return NextResponse.json(created)
  } catch (e) {
    console.error('POST /api/space error', e)
    return NextResponse.json(
      { error: 'Failed to create space' },
      { status: 500 }
    )
  }
}
