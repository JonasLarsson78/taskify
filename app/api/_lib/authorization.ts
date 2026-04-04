import { NextResponse } from 'next/server'
import { normalizeUserRole, type UserRole } from '../../../lib/user-role'
import { verifyAndLoadUser } from '../verify/service'
import { extractTokenFromAuthorizationHeader } from '../verify/validator'

export type AuthenticatedApiUser = {
  id: number
  name: string | null
  email: string | null
  organizationId: number | null
  role: UserRole
}

type AuthResult =
  | { ok: true; user: AuthenticatedApiUser }
  | { ok: false; response: NextResponse }

export async function requireApiUser(request: Request): Promise<AuthResult> {
  const token = extractTokenFromAuthorizationHeader(request)
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      ),
    }
  }

  const result = await verifyAndLoadUser(token)
  if (!result.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: result.error },
        { status: result.status }
      ),
    }
  }

  const raw = result.user as Record<string, unknown>
  const id =
    typeof raw.id === 'number'
      ? raw.id
      : Number.parseInt(String(raw.id ?? ''), 10)

  if (!Number.isInteger(id)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Invalid user payload' },
        { status: 401 }
      ),
    }
  }

  return {
    ok: true,
    user: {
      id,
      name: typeof raw.name === 'string' ? raw.name : null,
      email: typeof raw.email === 'string' ? raw.email : null,
      organizationId:
        typeof raw.organizationId === 'number' ? raw.organizationId : null,
      role: normalizeUserRole(raw.role),
    },
  }
}

export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 })
}

export function isSameOrganization(
  user: AuthenticatedApiUser,
  organizationId: number | null | undefined
) {
  return organizationId !== null && organizationId !== undefined
    ? user.organizationId === organizationId
    : false
}
