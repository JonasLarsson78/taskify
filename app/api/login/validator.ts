export type LoginInput = {
  email: string
  password: string
}

export async function parseJsonBody(request: Request): Promise<unknown> {
  return request.json()
}

export function validateLoginInput(
  body: unknown
): { ok: true; data: LoginInput } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>
  const email = b.email
  const password = b.password

  if (!email || typeof email !== 'string') {
    return { ok: false, error: 'Email is required' }
  }

  if (!password || typeof password !== 'string') {
    return { ok: false, error: 'Password is required' }
  }

  return {
    ok: true,
    data: { email, password },
  }
}
