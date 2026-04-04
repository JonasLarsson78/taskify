import { NextResponse } from 'next/server'
import { canWriteTasks } from '../../../lib/user-role'
import { forbidden, requireApiUser } from '../_lib/authorization'
import {
  getSpaceById,
  isSpaceMember,
  listSpacesForUser,
} from '../space/service'
import { publishWorkspaceEvent } from '../../../lib/realtime/workspace-events'
import { createTask, listTasks } from './service'
import { normalizeCreateTaskInput, parseJsonBody } from './validator'

export async function GET(request: Request) {
  try {
    const auth = await requireApiUser(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const organizationIdRaw = searchParams.get('organizationId')
    const spaceIdRaw = searchParams.get('spaceId')
    const archivedRaw = searchParams.get('archived')
    const parsedId = organizationIdRaw
      ? Number.parseInt(organizationIdRaw, 10)
      : null
    const parsedSpaceId = spaceIdRaw ? Number.parseInt(spaceIdRaw, 10) : null
    const organizationId =
      parsedId !== null && !Number.isNaN(parsedId)
        ? parsedId
        : auth.user.organizationId
    const spaceId =
      parsedSpaceId !== null && !Number.isNaN(parsedSpaceId)
        ? parsedSpaceId
        : null
    const archivedMode =
      archivedRaw === 'only'
        ? 'only'
        : archivedRaw === 'include'
        ? 'include'
        : 'exclude'

    if (
      auth.user.organizationId !== null &&
      organizationId !== auth.user.organizationId
    ) {
      return forbidden('You do not have access to this organization')
    }

    if (spaceId !== null) {
      const space = await getSpaceById(spaceId)
      if (!space) {
        return NextResponse.json({ error: 'Space not found' }, { status: 404 })
      }

      if (space.organizationId !== organizationId) {
        return forbidden('You do not have access to this space')
      }

      if (auth.user.role !== 'admin') {
        const member = await isSpaceMember(spaceId, auth.user.id)
        if (!member) {
          return forbidden('You are not a member of this space')
        }
      }

      const tasks = await listTasks(organizationId, spaceId, archivedMode)
      return NextResponse.json(tasks)
    }

    const tasks = await listTasks(organizationId, null, archivedMode)
    if (auth.user.role === 'admin') {
      return NextResponse.json(tasks)
    }

    if (organizationId === null) {
      return NextResponse.json([])
    }

    const accessibleSpaces = await listSpacesForUser({
      organizationId,
      userId: auth.user.id,
      role: auth.user.role,
    })
    const allowedSpaceIds = new Set(accessibleSpaces.map((space) => space.id))

    const filtered = tasks.filter(
      (task) => task.spaceId !== null && allowedSpaceIds.has(task.spaceId)
    )

    return NextResponse.json(filtered)
  } catch (e) {
    console.error('GET /api/task error', e)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const auth = await requireApiUser(request)
  if (!auth.ok) return auth.response
  if (!canWriteTasks(auth.user.role)) {
    return forbidden('Guests cannot create tasks')
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

  const parsed = normalizeCreateTaskInput(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  try {
    const input = {
      ...parsed.data,
      organizationId: auth.user.organizationId ?? parsed.data.organizationId,
    }

    if (
      auth.user.organizationId !== null &&
      input.organizationId !== auth.user.organizationId
    ) {
      return forbidden('Tasks must belong to your organization')
    }

    if (auth.user.role !== 'admin' && input.spaceId === null) {
      return forbidden('User and guest tasks must belong to a space')
    }

    if (input.spaceId !== null) {
      const space = await getSpaceById(input.spaceId)
      if (!space) {
        return NextResponse.json({ error: 'Space not found' }, { status: 404 })
      }

      if (space.organizationId !== input.organizationId) {
        return forbidden('Task space must belong to your organization')
      }

      if (auth.user.role !== 'admin') {
        const member = await isSpaceMember(input.spaceId, auth.user.id)
        if (!member) {
          return forbidden('You are not a member of this space')
        }
      }
    }

    const created = await createTask(input)
    if (!created) {
      return NextResponse.json(
        { error: 'Failed to create task' },
        { status: 500 }
      )
    }

    publishWorkspaceEvent(created.organizationId, 'task.changed')
    return NextResponse.json(created)
  } catch (e) {
    console.error('POST /api/task error', e)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
