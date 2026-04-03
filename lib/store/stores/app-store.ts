import { create, StateCreator } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState, User } from './app-store.types'

export const useAppStore = create<AppState>()(
  persist(
    (set, _get, api) => ({
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
      name: 'app-storage',
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
