import { NextResponse } from 'next/server'
import { getSpaceById, updateSpace } from '../service'

function parseSpaceId(params: { id: string }) {
  const id = Number.parseInt(params.id, 10)
  return Number.isNaN(id) ? null : id
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolved = await params
    const spaceId = parseSpaceId(resolved)
    if (spaceId === null) {
      return NextResponse.json({ error: 'Invalid space id' }, { status: 400 })
    }

    const space = await getSpaceById(spaceId)
    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
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
    const resolved = await params
    const spaceId = parseSpaceId(resolved)
    if (spaceId === null) {
      return NextResponse.json({ error: 'Invalid space id' }, { status: 400 })
    }

    const body = (await request.json().catch(() => null)) as {
      name?: unknown
      taskSections?: unknown
      taskSectionColors?: unknown
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

    const updated = await updateSpace(spaceId, patch)
    if (!updated) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (e) {
    console.error('PUT /api/space/[id] error', e)
    return NextResponse.json(
      { error: 'Failed to update space' },
      { status: 500 }
    )
  }
}
