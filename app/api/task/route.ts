import { NextResponse } from 'next/server'
import { createTask, listTasks } from './service'
import { normalizeCreateTaskInput, parseJsonBody } from './validator'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationIdRaw = searchParams.get('organizationId')
    const spaceIdRaw = searchParams.get('spaceId')
    const parsedId = organizationIdRaw
      ? Number.parseInt(organizationIdRaw, 10)
      : null
    const parsedSpaceId = spaceIdRaw ? Number.parseInt(spaceIdRaw, 10) : null
    const organizationId =
      parsedId !== null && !Number.isNaN(parsedId) ? parsedId : null
    const spaceId =
      parsedSpaceId !== null && !Number.isNaN(parsedSpaceId)
        ? parsedSpaceId
        : null

    const tasks = await listTasks(organizationId, spaceId)
    return NextResponse.json(tasks)
  } catch (e) {
    console.error('GET /api/task error', e)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
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

  const parsed = normalizeCreateTaskInput(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  try {
    const created = await createTask(parsed.data)
    return NextResponse.json(created)
  } catch (e) {
    console.error('POST /api/task error', e)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
