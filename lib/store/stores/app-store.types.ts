export type User = {
  id: number
  name?: string
  email?: string
  organizationId?: number | null
} | null

export type Organization = {
  id: number
  name?: string
  address?: string
  city?: string
  zip?: string
  phone?: string
  email?: string
}

export interface AppState {
  user: User
  organization: Organization | null
  token: string | null
  rehydrated: boolean
  setUser: (u: User) => void
  setOrganization: (o: Organization | null) => void
  setToken: (t: string | null) => void
  setRehydrated: (v: boolean) => void
  logout: () => void
}
