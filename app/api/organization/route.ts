import { NextResponse } from 'next/server'
import { createOrganization, listOrganizations } from './service'
import { normalizeCreateOrganizationInput, parseJsonBody } from './validator'

export async function GET() {
  try {
    const organizations = await listOrganizations()
    return NextResponse.json(organizations)
  } catch (e) {
    console.error('GET /api/organization error', e)
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
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
