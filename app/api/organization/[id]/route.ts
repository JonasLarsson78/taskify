import { NextResponse } from 'next/server'
import { getOrganizationById } from '../service'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const organizationId = Number.parseInt(id, 10)

    if (Number.isNaN(organizationId)) {
      return NextResponse.json(
        { error: 'Invalid organization id' },
        { status: 400 }
      )
    }

    const organization = await getOrganizationById(organizationId)
    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(organization)
  } catch (e) {
    console.error('GET /api/organization/[id] error', e)
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    )
  }
}
