import { NextResponse } from 'next/server'
import { verifyAndLoadUser } from './service'
import {
  extractTokenFromAuthorizationHeader,
  extractTokenFromJsonBody,
} from './validator'

export async function GET(request: Request) {
  try {
    const token = extractTokenFromAuthorizationHeader(request)

    if (!token)
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })

    const result = await verifyAndLoadUser(token)
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    return NextResponse.json({ ok: true, user: result.user })
  } catch (e) {
    console.error('GET /api/verify error', e)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // allow token in JSON body as `token` for convenience
    const token = await extractTokenFromJsonBody(request)
    if (!token)
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })

    const result = await verifyAndLoadUser(token)
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    return NextResponse.json({ ok: true, user: result.user })
  } catch (e) {
    console.error('POST /api/verify error', e)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
