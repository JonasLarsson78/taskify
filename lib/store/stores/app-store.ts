import { create, StateCreator } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState, Organization, User } from './app-store.types'

export const useAppStore = create<AppState>()(
  persist(
    (set, _get, api) => ({
      user: null,
      organization: null,
      token: null,
      rehydrated: false,
      setUser: (user: User) => set({ user }),
      setOrganization: (organization: Organization | null) =>
        set({ organization }),
      setToken: (token: string | null) => set({ token }),
      setRehydrated: (v: boolean) => set({ rehydrated: v }),
      logout: () => {
        set({ user: null, organization: null, token: null })
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
        organization: state.organization,
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
