import { NextResponse } from 'next/server'
import { canWriteTasks } from '../../../../lib/user-role'
import { publishWorkspaceEvent } from '../../../../lib/realtime/workspace-events'
import { forbidden, requireApiUser } from '../../_lib/authorization'
import { getSpaceById, isSpaceMember } from '../../space/service'
import { deleteGoal, getGoalById, updateGoal } from '../service'
import { normalizeUpdateGoalInput, parseJsonBody } from '../validator'

function parseGoalId(params: { id: string }) {
  const id = Number.parseInt(params.id, 10)
  return Number.isNaN(id) ? null : id
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser(request)
  if (!auth.ok) return auth.response
  if (!canWriteTasks(auth.user.role)) {
    return forbidden('Guests cannot update goals')
  }

  const resolvedParams = await params
  const goalId = parseGoalId(resolvedParams)

  if (goalId === null) {
    return NextResponse.json({ error: 'Invalid goal id' }, { status: 400 })
  }

  const existingGoal = await getGoalById(goalId)
  if (!existingGoal) {
    return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
  }

  if (
    auth.user.organizationId !== null &&
    existingGoal.organizationId !== auth.user.organizationId
  ) {
    return forbidden('You do not have access to this goal')
  }

  if (auth.user.role !== 'admin' && existingGoal.spaceId !== null) {
    const member = await isSpaceMember(existingGoal.spaceId, auth.user.id)
    if (!member) {
      return forbidden('You are not a member of this space')
    }
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

  const parsed = normalizeUpdateGoalInput(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  if (auth.user.role !== 'admin') {
    if (parsed.data.organizationId !== undefined) {
      return forbidden('Only admins can change goal organization')
    }

    if (parsed.data.spaceId !== undefined) {
      if (parsed.data.spaceId === null) {
        return forbidden('Goals must remain in a space')
      }

      const nextSpace = await getSpaceById(parsed.data.spaceId)
      if (!nextSpace) {
        return NextResponse.json({ error: 'Space not found' }, { status: 404 })
      }

      if (
        auth.user.organizationId !== null &&
        nextSpace.organizationId !== auth.user.organizationId
      ) {
        return forbidden('You do not have access to this space')
      }

      const isMemberOfTarget = await isSpaceMember(
        parsed.data.spaceId,
        auth.user.id
      )
      if (!isMemberOfTarget) {
        return forbidden('You are not a member of the target space')
      }
    }
  }

  try {
    const updated = await updateGoal(goalId, parsed.data)
    if (!updated) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    publishWorkspaceEvent(updated.organizationId, 'goal.changed')

    return NextResponse.json(updated)
  } catch (e) {
    console.error('PUT /api/goal/[id] error', e)
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser(request)
  if (!auth.ok) return auth.response
  if (!canWriteTasks(auth.user.role)) {
    return forbidden('Guests cannot delete goals')
  }

  const resolvedParams = await params
  const goalId = parseGoalId(resolvedParams)

  if (goalId === null) {
    return NextResponse.json({ error: 'Invalid goal id' }, { status: 400 })
  }

  try {
    const existingGoal = await getGoalById(goalId)
    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    if (
      auth.user.organizationId !== null &&
      existingGoal.organizationId !== auth.user.organizationId
    ) {
      return forbidden('You do not have access to this goal')
    }

    if (auth.user.role !== 'admin' && existingGoal.spaceId !== null) {
      const member = await isSpaceMember(existingGoal.spaceId, auth.user.id)
      if (!member) {
        return forbidden('You are not a member of this space')
      }
    }

    const deleted = await deleteGoal(goalId)
    if (!deleted) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    publishWorkspaceEvent(existingGoal.organizationId, 'goal.changed')

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/goal/[id] error', e)
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    )
  }
}
