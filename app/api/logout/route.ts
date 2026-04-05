import { NextResponse } from 'next/server'

export async function POST() {
  // Clear the token cookie by setting it to expired
  const cookieValue =
    'token=; Path=/; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
  return NextResponse.json(
    { ok: true },
    { headers: { 'Set-Cookie': cookieValue } }
  )
}
