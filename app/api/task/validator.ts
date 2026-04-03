export type CreateTaskInput = {
  title: string
  meta: string | null
  dueDate: string | null
  stage: 'Initiation' | 'Planning' | 'Execution'
  priority: 'High' | 'Normal' | 'Low'
  section: string
  color: string | null
  assigneeIds: number[]
  organizationId: number | null
  spaceId: number | null
}

export type UpdateTaskInput = Partial<CreateTaskInput>

export async function parseJsonBody(request: Request): Promise<unknown> {
  return request.json()
}

function normalizePriorityValue(raw: string): CreateTaskInput['priority'] {
  if (raw === 'High' || raw === 'Normal' || raw === 'Low') return raw
  if (raw === 'flag') return 'High'
  if (raw === 'low') return 'Low'
  return 'Normal'
}

export function normalizeCreateTaskInput(
  body: unknown
): { ok: true; data: CreateTaskInput } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>
  const title = typeof b.title === 'string' ? b.title.trim() : ''

  if (!title) {
    return { ok: false, error: 'title is required' }
  }

  const stageRaw = typeof b.stage === 'string' ? b.stage : 'Planning'
  const priorityRaw = typeof b.priority === 'string' ? b.priority : 'Normal'
  const sectionRaw = typeof b.section === 'string' ? b.section.trim() : 'Review'

  const stage: CreateTaskInput['stage'] =
    stageRaw === 'Initiation' || stageRaw === 'Execution'
      ? stageRaw
      : 'Planning'

  const priority: CreateTaskInput['priority'] =
    normalizePriorityValue(priorityRaw)

  const section = sectionRaw || 'Review'

  const assigneeIds = parseAssigneeIds(b)

  const dueDate = typeof b.dueDate === 'string' ? b.dueDate : null

  return {
    ok: true,
    data: {
      title,
      meta: typeof b.meta === 'string' ? b.meta : null,
      dueDate,
      stage,
      priority,
      section,
      color: typeof b.color === 'string' ? b.color : null,
      assigneeIds,
      organizationId:
        typeof b.organizationId === 'number' ? b.organizationId : null,
      spaceId: typeof b.spaceId === 'number' ? b.spaceId : null,
    },
  }
}

function parseAssigneeIds(body: Record<string, unknown>): number[] {
  if (Array.isArray(body.assigneeIds)) {
    return body.assigneeIds
      .filter((value): value is number => typeof value === 'number')
      .slice(0, 6)
  }

  // Backward compatibility for older clients that still send string assignees.
  if (Array.isArray(body.assignees)) {
    return body.assignees
      .map((value) => Number.parseInt(String(value), 10))
      .filter((value) => Number.isInteger(value))
      .slice(0, 6)
  }

  return []
}

export function normalizeUpdateTaskInput(
  body: unknown
): { ok: true; data: UpdateTaskInput } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>
  const patch: UpdateTaskInput = {}

  if (typeof b.title === 'string') {
    const title = b.title.trim()
    if (!title) return { ok: false, error: 'title cannot be empty' }
    patch.title = title
  }

  if (typeof b.meta === 'string' || b.meta === null) {
    patch.meta = (b.meta as string | null) ?? null
  }

  if (typeof b.dueDate === 'string' || b.dueDate === null) {
    patch.dueDate = (b.dueDate as string | null) ?? null
  }

  if (typeof b.stage === 'string') {
    const stage = b.stage
    if (
      stage !== 'Initiation' &&
      stage !== 'Planning' &&
      stage !== 'Execution'
    ) {
      return { ok: false, error: 'Invalid stage' }
    }
    patch.stage = stage
  }

  if (typeof b.priority === 'string') {
    const priority = b.priority
    if (
      priority !== 'High' &&
      priority !== 'Normal' &&
      priority !== 'Low' &&
      priority !== 'flag' &&
      priority !== 'muted' &&
      priority !== 'low'
    ) {
      return { ok: false, error: 'Invalid priority' }
    }
    patch.priority = normalizePriorityValue(priority)
  }

  if (typeof b.section === 'string') {
    const section = b.section.trim()
    if (!section) return { ok: false, error: 'section cannot be empty' }
    patch.section = section
  }

  if (typeof b.color === 'string' || b.color === null) {
    patch.color = (b.color as string | null) ?? null
  }

  if (Array.isArray(b.assigneeIds)) {
    patch.assigneeIds = b.assigneeIds
      .filter((value): value is number => typeof value === 'number')
      .slice(0, 6)
  } else if (Array.isArray(b.assignees)) {
    patch.assigneeIds = b.assignees
      .map((value) => Number.parseInt(String(value), 10))
      .filter((value) => Number.isInteger(value))
      .slice(0, 6)
  }

  if (typeof b.organizationId === 'number' || b.organizationId === null) {
    patch.organizationId = (b.organizationId as number | null) ?? null
  }

  if (typeof b.spaceId === 'number' || b.spaceId === null) {
    patch.spaceId = (b.spaceId as number | null) ?? null
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: 'No fields to update' }
  }

  return { ok: true, data: patch }
}
