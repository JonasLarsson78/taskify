import { create, StateCreator } from 'zustand'
import { persist } from 'zustand/middleware'

export type User = { id: number; name?: string; email?: string } | null

interface AppState {
  user: User
  token: string | null
  rehydrated: boolean
  setUser: (u: User) => void
  setToken: (t: string | null) => void
  setRehydrated: (v: boolean) => void
  logout: () => void
}

const useStore = create<AppState>()(
  persist(
    (set, get, api) => ({
      user: null,
      token: null,
      rehydrated: false,
      setUser: (user: User) => set({ user }),
      setToken: (token: string | null) => set({ token }),
      setRehydrated: (v: boolean) => set({ rehydrated: v }),
      logout: () => {
        set({ user: null, token: null })
        try {
          api?.persist?.clearStorage?.()
        } catch {
          // ignore
        }
      },
    }),
    {
      name: 'app-storage', // localStorage key
      partialize: (state: AppState) => ({
        token: state.token,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        try {
          state?.setRehydrated?.(true)
        } catch {
          // ignore
        }
      },
    }
  ) as unknown as StateCreator<AppState>
)

export default useStore
