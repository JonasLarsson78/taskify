import { NextResponse } from 'next/server'
import { createSpace, listSpaces } from './service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationIdRaw = searchParams.get('organizationId')
    const organizationId = organizationIdRaw
      ? Number.parseInt(organizationIdRaw, 10)
      : Number.NaN

    if (Number.isNaN(organizationId)) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      )
    }

    const spaces = await listSpaces(organizationId)
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
    const body = (await request.json().catch(() => null)) as {
      organizationId?: unknown
      name?: unknown
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

    const created = await createSpace({
      organizationId,
      name: name.slice(0, 191),
    })
    return NextResponse.json(created)
  } catch (e) {
    console.error('POST /api/space error', e)
    return NextResponse.json(
      { error: 'Failed to create space' },
      { status: 500 }
    )
  }
}
