import { normalizeUserRole, type UserRole } from '../../../lib/user-role'

export type CreateUserInput = {
  name: string | null
  email: string | null
  password: string | null
  role: UserRole
  organizationId: number | null
}

export type UpdateUserInput = {
  name?: string | null
  email?: string | null
  password?: string | null
  role?: UserRole
  organizationId?: number | null
}

export async function parseJsonBody(request: Request): Promise<unknown> {
  return request.json()
}

export function normalizeCreateUserInput(body: unknown): CreateUserInput {
  const b = (body ?? {}) as Record<string, unknown>

  return {
    name: typeof b.name === 'string' ? b.name : null,
    email: typeof b.email === 'string' ? b.email : null,
    password: typeof b.password === 'string' ? b.password : null,
    role: normalizeUserRole(b.role),
    organizationId:
      typeof b.organizationId === 'number' ? b.organizationId : null,
  }
}

export function normalizeUpdateUserInput(
  body: unknown
): { ok: true; data: UpdateUserInput } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>
  const patch: UpdateUserInput = {}

  if (typeof b.name === 'string' || b.name === null) {
    patch.name = typeof b.name === 'string' ? b.name.trim() : null
  }

  if (typeof b.email === 'string' || b.email === null) {
    const email = typeof b.email === 'string' ? b.email.trim() : null
    if (email && !email.includes('@')) {
      return { ok: false, error: 'Valid email is required' }
    }
    patch.email = email
  }

  if (typeof b.password === 'string' || b.password === null) {
    const password = typeof b.password === 'string' ? b.password : null
    if (password && password.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters' }
    }
    patch.password = password && password.length > 0 ? password : null
  }

  if (typeof b.role === 'string') {
    patch.role = normalizeUserRole(b.role)
  }

  if (typeof b.organizationId === 'number' || b.organizationId === null) {
    patch.organizationId =
      typeof b.organizationId === 'number' ? b.organizationId : null
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: 'No fields to update' }
  }

  return { ok: true, data: patch }
}
