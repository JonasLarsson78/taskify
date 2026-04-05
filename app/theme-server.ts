import { cookies } from 'next/headers'

export async function getServerTheme(): Promise<'light' | 'dark' | 'system'> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('taskify-theme')?.value
  if (cookie === 'light' || cookie === 'dark') return cookie
  return 'system'
}
