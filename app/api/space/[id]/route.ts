import { NextResponse } from 'next/server'
import { canManageWorkspace } from '../../../../lib/user-role'
import { publishWorkspaceEvent } from '../../../../lib/realtime/workspace-events'
import { forbidden, requireApiUser } from '../../_lib/authorization'
import {
  getSpaceById,
  isSpaceMember,
  setSpaceMembers,
  updateSpace,
} from '../service'

function parseSpaceId(params: { id: string }) {
  const id = Number.parseInt(params.id, 10)
  return Number.isNaN(id) ? null : id
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireApiUser(request)
    if (!auth.ok) return auth.response

    const resolved = await params
    const spaceId = parseSpaceId(resolved)
    if (spaceId === null) {
      return NextResponse.json({ error: 'Invalid space id' }, { status: 400 })
    }

    const space = await getSpaceById(spaceId)
    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    if (
      auth.user.organizationId !== null &&
      space.organizationId !== auth.user.organizationId
    ) {
      return forbidden('You do not have access to this space')
    }

    if (auth.user.role !== 'admin') {
      const member = await isSpaceMember(space.id, auth.user.id)
      if (!member) {
        return forbidden('You are not a member of this space')
      }
    }

    return NextResponse.json(space)
  } catch (e) {
    console.error('GET /api/space/[id] error', e)
    return NextResponse.json(
      { error: 'Failed to fetch space' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireApiUser(request)
    if (!auth.ok) return auth.response
    if (!canManageWorkspace(auth.user.role)) {
      return forbidden('Only admins can update spaces')
    }

    const resolved = await params
    const spaceId = parseSpaceId(resolved)
    if (spaceId === null) {
      return NextResponse.json({ error: 'Invalid space id' }, { status: 400 })
    }

    const existingSpace = await getSpaceById(spaceId)
    if (!existingSpace) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    if (
      auth.user.organizationId !== null &&
      existingSpace.organizationId !== auth.user.organizationId
    ) {
      return forbidden('You do not have access to this space')
    }

    const body = (await request.json().catch(() => null)) as {
      name?: unknown
      taskSections?: unknown
      taskSectionColors?: unknown
      memberIds?: unknown
    } | null

    const patch: {
      name?: string
      taskSections?: string[]
      taskSectionColors?: Record<string, string>
    } = {}

    if (typeof body?.name === 'string') {
      const trimmed = body.name.trim()
      if (!trimmed) {
        return NextResponse.json(
          { error: 'name cannot be empty' },
          { status: 400 }
        )
      }
      patch.name = trimmed.slice(0, 191)
    }

    if (Array.isArray(body?.taskSections)) {
      patch.taskSections = body.taskSections
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    }

    if (
      body?.taskSectionColors &&
      typeof body.taskSectionColors === 'object' &&
      !Array.isArray(body.taskSectionColors)
    ) {
      patch.taskSectionColors = Object.fromEntries(
        Object.entries(
          body.taskSectionColors as Record<string, unknown>
        ).filter(
          (entry): entry is [string, string] =>
            typeof entry[0] === 'string' && typeof entry[1] === 'string'
        )
      )
    }

    const memberIds = Array.isArray(body?.memberIds)
      ? body.memberIds
          .filter((value): value is number => typeof value === 'number')
          .slice(0, 100)
      : undefined

    const updated = await updateSpace(spaceId, patch)
    if (!updated) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    if (memberIds) {
      await setSpaceMembers(spaceId, memberIds)
      updated.memberIds = memberIds
    }

    publishWorkspaceEvent(existingSpace.organizationId, 'space.changed')

    return NextResponse.json(updated)
  } catch (e) {
    console.error('PUT /api/space/[id] error', e)
    return NextResponse.json(
      { error: 'Failed to update space' },
      { status: 500 }
    )
  }
}
