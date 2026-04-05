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

    // Set an HttpOnly cookie so the server can detect authenticated users
    const maxAge = 60 * 60 * 24 * 30 // 30 days
    const secure = process.env.NODE_ENV === 'production' ? 'Secure; ' : ''
    const cookieValue = `token=${encodeURIComponent(
      result.token
    )}; Path=/; HttpOnly; SameSite=Lax; ${secure}Max-Age=${maxAge}`

    return NextResponse.json(
      {
        ok: true,
        user: result.user,
        token: result.token,
      },
      { headers: { 'Set-Cookie': cookieValue } }
    )
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
