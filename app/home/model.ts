export type StoreUser = {
  id: number
  name?: string
  email?: string
  organizationId?: number | null
}

export type Organization = {
  id: number
  name?: string
  address?: string
  city?: string
  zip?: string
  phone?: string
  email?: string
}

export type ApiTask = {
  id: number
  title: string
  meta: string | null
  assignees: string[]
  dueDate: string | null
  stage: 'Initiation' | 'Planning' | 'Execution'
  priority: 'flag' | 'muted'
  section: 'Issues Found' | 'Review' | 'Ready'
  color: string | null
  organizationId: number | null
  createdAt: string
}

export type UiTask = {
  id?: number
  title: string
  meta: string
  assignees: string[]
  dueDate: string
  stage: 'Initiation' | 'Planning' | 'Execution'
  priority: 'flag' | 'muted'
  section: 'Issues Found' | 'Review' | 'Ready'
  color: string
}

export type BoardGroup = {
  label: 'Issues Found' | 'Review' | 'Ready'
  tone: 'pink' | 'yellow' | 'purple'
  items: UiTask[]
}

export type ViewMode = 'list' | 'board' | 'box'

export function getInitial(
  value: string | undefined,
  fallback: string
): string {
  const v = value?.trim()
  return v && v.length > 0 ? v[0]!.toUpperCase() : fallback
}

export function formatDueDate(raw: string | null): string {
  if (!raw) return 'No date'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return 'No date'
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  })
}

export function groupedTasksFromApi(tasks: ApiTask[]): BoardGroup[] {
  const sections: Array<{
    label: 'Issues Found' | 'Review' | 'Ready'
    tone: 'pink' | 'yellow' | 'purple'
  }> = [
    { label: 'Issues Found', tone: 'pink' },
    { label: 'Review', tone: 'yellow' },
    { label: 'Ready', tone: 'purple' },
  ]

  return sections.map((section) => ({
    label: section.label,
    tone: section.tone,
    items: tasks
      .filter((t) => t.section === section.label)
      .map((t) => ({
        id: t.id,
        title: t.title,
        meta: t.meta?.trim() || `${t.stage} task`,
        assignees: t.assignees,
        dueDate: formatDueDate(t.dueDate),
        stage: t.stage,
        priority: t.priority,
        section: t.section,
        color: t.color || '#716bff',
      })),
  }))
}

export function countDueThisWeek(tasks: ApiTask[]): number {
  const now = new Date()
  const weekAhead = new Date(now)
  weekAhead.setDate(now.getDate() + 7)

  return tasks.filter((t) => {
    if (!t.dueDate) return false
    const due = new Date(t.dueDate)
    if (Number.isNaN(due.getTime())) return false
    return due >= now && due <= weekAhead
  }).length
}

export function getBusiestSection(
  tasks: ApiTask[]
): 'Issues Found' | 'Review' | 'Ready' {
  const sectionCount = tasks.reduce(
    (acc, t) => {
      acc[t.section] += 1
      return acc
    },
    { 'Issues Found': 0, Review: 0, Ready: 0 } as Record<
      'Issues Found' | 'Review' | 'Ready',
      number
    >
  )

  return (
    (Object.entries(sectionCount).sort((a, b) => b[1] - a[1])[0]?.[0] as
      | 'Issues Found'
      | 'Review'
      | 'Ready'
      | undefined) || 'Review'
  )
}
