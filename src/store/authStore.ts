import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, UserRole } from '@/types'
import { authenticateUser } from '@/lib/mockData'

interface AuthStore {
  token: string | null
  user: User | null
  role: UserRole | null
  isLoggedIn: boolean
  hasSelectedRole: boolean

  // Supabase / server path (keeps legacy callers working)
  setAuth: (token: string, user: User) => void
  setUser: (user: User) => void

  // Mock / offline path
  loginWithMock: (email: string, password: string) => boolean

  // Role selection (shown after first login when role is not yet set)
  setRole: (role: UserRole) => void

  // Update profile fields
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
        localStorage.setItem('cima_token', token)
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

      loginWithMock: (email, password) => {
        const user = authenticateUser(email, password)
        if (!user) return false
        localStorage.setItem('cima_token', 'mock_token')
        set({
          token: 'mock_token',
          user,
          role: user.role,
          isLoggedIn: true,
          hasSelectedRole: !!user.role,
        })
        return true
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
        localStorage.removeItem('cima_token')
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
