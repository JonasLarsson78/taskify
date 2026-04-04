import { NextResponse } from 'next/server'
import { canWriteTasks } from '../../../lib/user-role'
import { forbidden, requireApiUser } from '../_lib/authorization'
import {
  getSpaceById,
  isSpaceMember,
  listSpacesForUser,
} from '../space/service'
import { listTasks } from '../task/service'
import { createGoal, listGoals } from './service'
import { normalizeCreateGoalInput, parseJsonBody } from './validator'

function parseQueryNumber(value: string | null): number | null {
  if (!value) return null
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? null : parsed
}

export async function GET(request: Request) {
  try {
    const auth = await requireApiUser(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const organizationIdRaw = parseQueryNumber(
      searchParams.get('organizationId')
    )
    const spaceId = parseQueryNumber(searchParams.get('spaceId'))

    const organizationId =
      organizationIdRaw !== null ? organizationIdRaw : auth.user.organizationId

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
        const member = await isSpaceMember(space.id, auth.user.id)
        if (!member) {
          return forbidden('You are not a member of this space')
        }
      }
    }

    const goals = await listGoals(organizationId, spaceId)

    if (auth.user.role === 'admin') {
      return NextResponse.json(goals)
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

    const filtered = goals.filter(
      (goal) => goal.spaceId !== null && allowedSpaceIds.has(goal.spaceId)
    )

    return NextResponse.json(filtered)
  } catch (e) {
    console.error('GET /api/goal error', e)
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const auth = await requireApiUser(request)
  if (!auth.ok) return auth.response
  if (!canWriteTasks(auth.user.role)) {
    return forbidden('Guests cannot create goals')
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

  const parsed = normalizeCreateGoalInput(body)
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
      return forbidden('Goals must belong to your organization')
    }

    if (auth.user.role !== 'admin' && input.spaceId === null) {
      return forbidden('User goals must belong to a space')
    }

    if (input.spaceId !== null) {
      const space = await getSpaceById(input.spaceId)
      if (!space) {
        return NextResponse.json({ error: 'Space not found' }, { status: 404 })
      }

      if (space.organizationId !== input.organizationId) {
        return forbidden('Goal space must belong to your organization')
      }

      if (auth.user.role !== 'admin') {
        const member = await isSpaceMember(input.spaceId, auth.user.id)
        if (!member) {
          return forbidden('You are not a member of this space')
        }
      }
    }

    if (input.organizationId !== null && input.taskIds.length > 0) {
      const orgTasks = await listTasks(input.organizationId, null, 'include')
      const validTaskIds = new Set(orgTasks.map((task) => task.id))
      input.taskIds = input.taskIds.filter((taskId) => validTaskIds.has(taskId))
    }

    const created = await createGoal(input)
    return NextResponse.json(created)
  } catch (e) {
    console.error('POST /api/goal error', e)
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    )
  }
}
