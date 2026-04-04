export type UserRole = 'admin' | 'user' | 'guest'

export function normalizeUserRole(raw: unknown): UserRole {
  if (raw === 'admin' || raw === 'guest') return raw
  return 'user'
}

export function canManageWorkspace(role: UserRole): boolean {
  return role === 'admin'
}

export function canWriteTasks(role: UserRole): boolean {
  return role === 'admin' || role === 'user'
}
