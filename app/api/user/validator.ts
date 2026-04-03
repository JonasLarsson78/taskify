export type CreateUserInput = {
  name: string | null
  email: string | null
  password: string | null
  organizationId: number | null
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
    organizationId:
      typeof b.organizationId === 'number' ? b.organizationId : null,
  }
}
