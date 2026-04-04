import { NextResponse } from 'next/server'
import { canManageWorkspace } from '../../../lib/user-role'
import { forbidden, requireApiUser } from '../_lib/authorization'
import { createOrganization, listOrganizations } from './service'
import { normalizeCreateOrganizationInput, parseJsonBody } from './validator'

export async function GET(request: Request) {
  try {
    const auth = await requireApiUser(request)
    if (!auth.ok) return auth.response

    const organizations = await listOrganizations()
    const scopedOrganizations =
      auth.user.organizationId === null && canManageWorkspace(auth.user.role)
        ? organizations
        : organizations.filter((org) => org.id === auth.user.organizationId)

    return NextResponse.json(scopedOrganizations)
  } catch (e) {
    console.error('GET /api/organization error', e)
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const auth = await requireApiUser(request)
  if (!auth.ok) return auth.response
  if (!canManageWorkspace(auth.user.role)) {
    return forbidden('Only admins can create organizations')
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

  try {
    const input = normalizeCreateOrganizationInput(body)
    const created = await createOrganization(input)
    return NextResponse.json(created)
  } catch (e) {
    console.error('POST /api/organization error', e)
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    )
  }
}
