import { NextResponse } from 'next/server'
import { loginWithEmailPassword } from './service'
import { parseJsonBody, validateLoginInput } from './validator'

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

  const parsed = validateLoginInput(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const { email, password } = parsed.data

  try {
    const result = await loginWithEmailPassword(email, password)
    if (!result)
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )

    return NextResponse.json({
      ok: true,
      user: result.user,
      token: result.token,
    })
  } catch (e) {
    console.error('POST /api/login error', e)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    info: 'POST to this endpoint with {"email":"..."} to login',
  })
}
