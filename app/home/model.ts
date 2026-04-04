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

export type Space = {
  id: number
  organizationId: number
  name: string
  taskSections: string[]
  taskSectionColors: Record<string, string>
}

export type ApiTask = {
  id: number
  title: string
  meta: string | null
  assigneeIds: number[]
  dueDate: string | null
  archivedAt: string | null
  stage: 'Initiation' | 'Planning' | 'Execution'
  priority: 'High' | 'Normal' | 'Low'
  section: string
  color: string | null
  organizationId: number | null
  spaceId: number | null
  createdAt: string
}

export type UiTask = {
  id?: number
  title: string
  meta: string
  assigneeIds: number[]
  dueDate: string
  stage: 'Initiation' | 'Planning' | 'Execution'
  priority: 'High' | 'Normal' | 'Low'
  section: string
  color: string
}

export type BoardGroup = {
  label: string
  color: string
  items: UiTask[]
}

export type ViewMode = 'list' | 'board' | 'box'

export type AssigneeOption = {
  id: number
  label: string
}

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

export function groupedTasksFromApi(
  tasks: ApiTask[],
  sectionLabels: string[],
  sectionColors: Record<string, string>
): BoardGroup[] {
  const configuredSections = sectionLabels
    .map((label) => label.trim())
    .filter(
      (label, index, arr) => label.length > 0 && arr.indexOf(label) === index
    )

  const taskOnlySections = tasks
    .map((task) => task.section.trim())
    .filter(
      (label, index, arr) =>
        label.length > 0 &&
        arr.indexOf(label) === index &&
        !configuredSections.includes(label)
    )

  const allSections = [...configuredSections, ...taskOnlySections]
  const fallbackColors = [
    '#ff5f98',
    '#ffb000',
    '#6259ff',
    '#2dbdb8',
    '#49a4ff',
    '#a35cff',
  ]

  return allSections.map((label, index) => ({
    label,
    color:
      sectionColors[label] || fallbackColors[index % fallbackColors.length],
    items: tasks
      .filter((t) => t.section === label)
      .map((t) => ({
        id: t.id,
        title: t.title,
        meta: t.meta?.trim() || `${t.stage} task`,
        assigneeIds: t.assigneeIds,
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

export function getBusiestSection(tasks: ApiTask[]): string {
  if (tasks.length === 0) return 'Review'

  const sectionCount = tasks.reduce((acc, task) => {
    const section = task.section || 'Review'
    acc[section] = (acc[section] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    Object.entries(sectionCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Review'
  )
}
