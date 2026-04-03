export type CreateOrganizationInput = {
  name: string | null
  address: string | null
  city: string | null
  zip: string | null
  phone: string | null
  email: string | null
}

export async function parseJsonBody(request: Request): Promise<unknown> {
  return request.json()
}

export function normalizeCreateOrganizationInput(
  body: unknown
): CreateOrganizationInput {
  const b = (body ?? {}) as Record<string, unknown>

  return {
    name: typeof b.name === 'string' ? b.name : null,
    address: typeof b.address === 'string' ? b.address : null,
    city: typeof b.city === 'string' ? b.city : null,
    zip: typeof b.zip === 'string' ? b.zip : null,
    phone: typeof b.phone === 'string' ? b.phone : null,
    email: typeof b.email === 'string' ? b.email : null,
  }
}
