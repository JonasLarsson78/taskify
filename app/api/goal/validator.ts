export type CreateGoalInput = {
  title: string
  description: string | null
  targetDate: string | null
  organizationId: number | null
  spaceId: number | null
  taskIds: number[]
  manualProgress: number | null
}

export type UpdateGoalInput = Partial<CreateGoalInput>

export async function parseJsonBody(request: Request): Promise<unknown> {
  return request.json()
}

function parseTaskIds(raw: unknown): number[] {
  if (!Array.isArray(raw)) return []

  return raw
    .map((value) => {
      if (typeof value === 'number') return value
      if (typeof value === 'string') {
        const parsed = Number.parseInt(value, 10)
        return Number.isNaN(parsed) ? null : parsed
      }
      return null
    })
    .filter((value): value is number => value !== null)
    .slice(0, 200)
}

function parseManualProgress(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null

  const parsed =
    typeof raw === 'number'
      ? raw
      : typeof raw === 'string'
      ? Number.parseInt(raw, 10)
      : Number.NaN

  if (!Number.isFinite(parsed)) return null
  return Math.max(0, Math.min(100, Math.round(parsed)))
}

export function normalizeCreateGoalInput(
  body: unknown
): { ok: true; data: CreateGoalInput } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>
  const title = typeof b.title === 'string' ? b.title.trim() : ''

  if (!title) {
    return { ok: false, error: 'title is required' }
  }

  return {
    ok: true,
    data: {
      title,
      description:
        typeof b.description === 'string' ? b.description.trim() : null,
      targetDate: typeof b.targetDate === 'string' ? b.targetDate : null,
      organizationId:
        typeof b.organizationId === 'number' ? b.organizationId : null,
      spaceId: typeof b.spaceId === 'number' ? b.spaceId : null,
      taskIds: parseTaskIds(b.taskIds),
      manualProgress: parseManualProgress(b.manualProgress),
    },
  }
}

export function normalizeUpdateGoalInput(
  body: unknown
): { ok: true; data: UpdateGoalInput } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>
  const patch: UpdateGoalInput = {}

  if (typeof b.title === 'string') {
    const title = b.title.trim()
    if (!title) return { ok: false, error: 'title cannot be empty' }
    patch.title = title
  }

  if (typeof b.description === 'string' || b.description === null) {
    patch.description = (b.description as string | null) ?? null
  }

  if (typeof b.targetDate === 'string' || b.targetDate === null) {
    patch.targetDate = (b.targetDate as string | null) ?? null
  }

  if (typeof b.organizationId === 'number' || b.organizationId === null) {
    patch.organizationId = (b.organizationId as number | null) ?? null
  }

  if (typeof b.spaceId === 'number' || b.spaceId === null) {
    patch.spaceId = (b.spaceId as number | null) ?? null
  }

  if (b.taskIds !== undefined) {
    patch.taskIds = parseTaskIds(b.taskIds)
  }

  if (b.manualProgress !== undefined || b.manualProgress === null) {
    patch.manualProgress = parseManualProgress(b.manualProgress)
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: 'No fields to update' }
  }

  return { ok: true, data: patch }
}
