export type User = { id: number; name?: string; email?: string } | null

export interface AppState {
  user: User
  token: string | null
  rehydrated: boolean
  setUser: (u: User) => void
  setToken: (t: string | null) => void
  setRehydrated: (v: boolean) => void
  logout: () => void
}
