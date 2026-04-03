import { NextResponse } from 'next/server'
import { deleteTask, updateTask } from '../service'
import { normalizeUpdateTaskInput, parseJsonBody } from '../validator'

function parseTaskId(params: { id: string }) {
  const id = Number.parseInt(params.id, 10)
  return Number.isNaN(id) ? null : id
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const taskId = parseTaskId(resolvedParams)

  if (taskId === null) {
    return NextResponse.json({ error: 'Invalid task id' }, { status: 400 })
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

  try {
    const updated = await updateTask(taskId, parsed.data)
    if (!updated) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

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
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const taskId = parseTaskId(resolvedParams)

  if (taskId === null) {
    return NextResponse.json({ error: 'Invalid task id' }, { status: 400 })
  }

  try {
    const deleted = await deleteTask(taskId)
    if (!deleted) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/task/[id] error', e)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
