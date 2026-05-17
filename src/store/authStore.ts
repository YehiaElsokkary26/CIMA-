import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthStore {
  token: string | null
  user:  User | null
  isLoggedIn: boolean
  setAuth: (token: string, user: User) => void
  setUser: (user: User) => void
  logout:  () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token:     null,
      user:      null,
      isLoggedIn: false,

      setAuth: (token, user) => {
        // Keep a legacy copy in localStorage so the axios interceptor fallback works
        localStorage.setItem('cima_token', token)
        set({ token, user, isLoggedIn: true })
      },

      setUser: (user) => set({ user }),

      logout: () => {
        localStorage.removeItem('cima_token')
        set({ token: null, user: null, isLoggedIn: false })
      },
    }),
    {
      name: 'cima-auth',
      partialize: (state) => ({
        token:     state.token,
        user:      state.user,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
)
