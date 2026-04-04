export type Goal = {
  id: number
  title: string
  description: string | null
  targetDate: string | null
  organizationId: number | null
  spaceId: number | null
  taskIds: number[]
  linkedTaskCount: number
  autoProgress: number
  progress: number
  manualProgress: number | null
  atRisk: boolean
  createdAt: string
}

export type TaskItem = {
  id: number
  title: string
  section: string
  spaceId: number | null
  archivedAt: string | null
}

export type SpaceItem = {
  id: number
  name: string
}

export type VerifiedUser = {
  id: number
  role?: 'admin' | 'user' | 'guest'
  organizationId?: number | null
}
