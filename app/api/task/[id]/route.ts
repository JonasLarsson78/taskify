import { NextResponse } from 'next/server'
import { canWriteTasks } from '../../../../lib/user-role'
import { publishWorkspaceEvent } from '../../../../lib/realtime/workspace-events'
import { forbidden, requireApiUser } from '../../_lib/authorization'
import { getSpaceById, isSpaceMember } from '../../space/service'
import { deleteTask, getTaskById, updateTask } from '../service'
import { normalizeUpdateTaskInput, parseJsonBody } from '../validator'

function parseTaskId(params: { id: string }) {
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
    return forbidden('Guests cannot update tasks')
  }

  const resolvedParams = await params
  const taskId = parseTaskId(resolvedParams)

  if (taskId === null) {
    return NextResponse.json({ error: 'Invalid task id' }, { status: 400 })
  }

  const existingTask = await getTaskById(taskId)
  if (!existingTask) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  if (
    auth.user.organizationId !== null &&
    existingTask.organizationId !== auth.user.organizationId
  ) {
    return forbidden('You do not have access to this task')
  }

  if (auth.user.role !== 'admin' && existingTask.spaceId !== null) {
    const member = await isSpaceMember(existingTask.spaceId, auth.user.id)
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

  const parsed = normalizeUpdateTaskInput(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  if (auth.user.role !== 'admin') {
    if (parsed.data.organizationId !== undefined) {
      return forbidden('Only admins can change task organization')
    }

    if (parsed.data.spaceId !== undefined) {
      if (parsed.data.spaceId === null) {
        return forbidden('Tasks must remain in a space')
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
    const updated = await updateTask(taskId, parsed.data)
    if (!updated) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    publishWorkspaceEvent(updated.organizationId, 'task.changed')

    return NextResponse.json(updated)
  } catch (e) {
    console.error('PUT /api/task/[id] error', e)
    return NextResponse.json(
      { error: 'Failed to update task' },
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
    return forbidden('Guests cannot delete tasks')
  }

  const resolvedParams = await params
  const taskId = parseTaskId(resolvedParams)

  if (taskId === null) {
    return NextResponse.json({ error: 'Invalid task id' }, { status: 400 })
  }

  try {
    const existingTask = await getTaskById(taskId)
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (
      auth.user.organizationId !== null &&
      existingTask.organizationId !== auth.user.organizationId
    ) {
      return forbidden('You do not have access to this task')
    }

    if (auth.user.role !== 'admin' && existingTask.spaceId !== null) {
      const member = await isSpaceMember(existingTask.spaceId, auth.user.id)
      if (!member) {
        return forbidden('You are not a member of this space')
      }
    }

    const deleted = await deleteTask(taskId)
    if (!deleted) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    publishWorkspaceEvent(existingTask.organizationId, 'task.changed')

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/task/[id] error', e)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
