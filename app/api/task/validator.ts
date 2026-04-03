export type CreateTaskInput = {
  title: string
  meta: string | null
  dueDate: string | null
  stage: 'Initiation' | 'Planning' | 'Execution'
  priority: 'flag' | 'muted'
  section: 'Issues Found' | 'Review' | 'Ready'
  color: string | null
  assignees: string[]
  organizationId: number | null
}

export type UpdateTaskInput = Partial<CreateTaskInput>

export async function parseJsonBody(request: Request): Promise<unknown> {
  return request.json()
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
  const priorityRaw = typeof b.priority === 'string' ? b.priority : 'muted'
  const sectionRaw = typeof b.section === 'string' ? b.section : 'Review'

  const stage: CreateTaskInput['stage'] =
    stageRaw === 'Initiation' || stageRaw === 'Execution'
      ? stageRaw
      : 'Planning'

  const priority: CreateTaskInput['priority'] =
    priorityRaw === 'flag' ? 'flag' : 'muted'

  const section: CreateTaskInput['section'] =
    sectionRaw === 'Issues Found' || sectionRaw === 'Ready'
      ? sectionRaw
      : 'Review'

  const assignees = Array.isArray(b.assignees)
    ? b.assignees.filter((v): v is string => typeof v === 'string').slice(0, 6)
    : []

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
      assignees,
      organizationId:
        typeof b.organizationId === 'number' ? b.organizationId : null,
    },
  }
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
    if (priority !== 'flag' && priority !== 'muted') {
      return { ok: false, error: 'Invalid priority' }
    }
    patch.priority = priority
  }

  if (typeof b.section === 'string') {
    const section = b.section
    if (
      section !== 'Issues Found' &&
      section !== 'Review' &&
      section !== 'Ready'
    ) {
      return { ok: false, error: 'Invalid section' }
    }
    patch.section = section
  }

  if (typeof b.color === 'string' || b.color === null) {
    patch.color = (b.color as string | null) ?? null
  }

  if (Array.isArray(b.assignees)) {
    patch.assignees = b.assignees
      .filter((v): v is string => typeof v === 'string')
      .slice(0, 6)
  }

  if (typeof b.organizationId === 'number' || b.organizationId === null) {
    patch.organizationId = (b.organizationId as number | null) ?? null
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: 'No fields to update' }
  }

  return { ok: true, data: patch }
}
