import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, UserRole } from '@/types'

interface AuthStore {
  token: string | null
  user: User | null
  role: UserRole | null
  isLoggedIn: boolean
  hasSelectedRole: boolean

  setAuth: (token: string, user: User) => void
  setUser: (user: User) => void

  // Role selection (shown after first login when role is not yet set).
  // Persists to the server via useSetRole — this only mirrors the result locally.
  setRole: (role: UserRole) => void

  // Mirrors a server-confirmed profile update into local state.
  updateUser: (patch: Partial<User>) => void

  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      role: null,
      isLoggedIn: false,
      hasSelectedRole: false,

      setAuth: (token, user) => {
        const hasRole = !!user.role
        set({
          token,
          user,
          role: user.role ?? null,
          isLoggedIn: true,
          hasSelectedRole: hasRole,
        })
      },

      setUser: (user) => {
        set({ user, role: user.role ?? get().role })
      },

      setRole: (role) => {
        const user = get().user
        if (!user) return
        const updated = { ...user, role }
        set({ user: updated, role, hasSelectedRole: true })
      },

      updateUser: (patch) => {
        const user = get().user
        if (!user) return
        const updated = { ...user, ...patch }
        set({ user: updated, role: updated.role ?? get().role })
      },

      logout: () => {
        set({ token: null, user: null, role: null, isLoggedIn: false, hasSelectedRole: false })
      },
    }),
    {
      name: 'cima-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        role: state.role,
        isLoggedIn: state.isLoggedIn,
        hasSelectedRole: state.hasSelectedRole,
      }),
    }
  )
)
