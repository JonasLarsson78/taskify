import { NextResponse } from 'next/server'
import { verifyAndLoadUser } from '../verify/service'
import { normalizeUserRole } from '../../../lib/user-role'
import { subscribeWorkspaceEvents } from '../../../lib/realtime/workspace-events'

export const dynamic = 'force-dynamic'

function parseOrganizationId(raw: string | null): number | null {
  if (!raw) return null
  const parsed = Number.parseInt(raw, 10)
  return Number.isNaN(parsed) ? null : parsed
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 })
  }

  const result = await verifyAndLoadUser(token)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  const raw = result.user as Record<string, unknown>
  const userOrganizationId =
    typeof raw.organizationId === 'number' ? raw.organizationId : null
  const requestedOrganizationId = parseOrganizationId(
    searchParams.get('organizationId')
  )

  const organizationId = requestedOrganizationId ?? userOrganizationId
  if (!organizationId) {
    return NextResponse.json(
      { error: 'organizationId is required' },
      { status: 400 }
    )
  }

  if (userOrganizationId !== null && userOrganizationId !== organizationId) {
    return NextResponse.json(
      { error: 'You do not have access to this organization' },
      { status: 403 }
    )
  }

  const role = normalizeUserRole(raw.role)
  if (role === 'guest') {
    return NextResponse.json(
      { error: 'Guests cannot subscribe to workspace updates' },
      { status: 403 }
    )
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder()
      let closed = false

      const send = (payload: unknown) => {
        if (closed) return
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
        )
      }

      const unsubscribe = subscribeWorkspaceEvents(organizationId, send)
      const heartbeat = setInterval(() => {
        if (closed) return
        controller.enqueue(encoder.encode(': heartbeat\n\n'))
      }, 25000)

      send({ organizationId, type: 'connected', at: Date.now() })

      const close = () => {
        if (closed) return
        closed = true
        clearInterval(heartbeat)
        unsubscribe()
        controller.close()
      }

      request.signal.addEventListener('abort', close)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
