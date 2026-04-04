import { NextResponse } from 'next/server'
import { canManageWorkspace } from '../../../../lib/user-role'
import { publishWorkspaceEvent } from '../../../../lib/realtime/workspace-events'
import {
  forbidden,
  isSameOrganization,
  requireApiUser,
} from '../../_lib/authorization'
import { getOrganizationById, updateOrganizationName } from '../service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireApiUser(request)
    if (!auth.ok) return auth.response

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

    if (
      auth.user.organizationId !== null &&
      !isSameOrganization(auth.user, organization.id)
    ) {
      return forbidden('You do not have access to this organization')
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireApiUser(request)
    if (!auth.ok) return auth.response
    if (!canManageWorkspace(auth.user.role)) {
      return forbidden('Only admins can update the organization')
    }

    const { id } = await params
    const organizationId = Number.parseInt(id, 10)

    if (Number.isNaN(organizationId)) {
      return NextResponse.json(
        { error: 'Invalid organization id' },
        { status: 400 }
      )
    }

    const body = (await request.json().catch(() => null)) as {
      name?: unknown
    } | null

    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const organization = await getOrganizationById(organizationId)
    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    if (
      auth.user.organizationId !== null &&
      !isSameOrganization(auth.user, organization.id)
    ) {
      return forbidden('You do not have access to this organization')
    }

    const updated = await updateOrganizationName(organizationId, name)
    publishWorkspaceEvent(organizationId, 'organization.changed')
    return NextResponse.json(updated)
  } catch (e) {
    console.error('PUT /api/organization/[id] error', e)
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    )
  }
}
