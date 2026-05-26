import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'

export function useAuth() {
  const { token, user, isLoggedIn, setAuth, setUser, logout } = useAuthStore()
  const navigate = useNavigate()

  // Login via Supabase Auth directly — gets auto-refreshing session,
  // then fetches the full profile from our Express /api/auth/me endpoint.
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)
      if (!data.session) throw new Error('No session returned — please try again')

      // Fetch full profile (including role, bio, school, etc.)
      const profileRes = await authApi.me()
      return { token: data.session.access_token, user: profileRes.data }
    },
    onSuccess: ({ token, user }) => setAuth(token, user),
  })

  // Register via Supabase Auth, then fetch the auto-created profile.
  const registerMutation = useMutation({
    mutationFn: async ({
      name,
      email,
      password,
      role,
    }: {
      name: string
      email: string
      password: string
      role: string
    }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role } },
      })
      if (error) throw new Error(error.message)
      if (!data.session) {
        // Supabase email confirmation is enabled — the user must confirm first
        throw new Error('Check your email to confirm your account before logging in.')
      }

      // Small delay for the DB trigger to create the profile row
      await new Promise((r) => setTimeout(r, 400))

      const profileRes = await authApi.me()
      return { token: data.session.access_token, user: profileRes.data }
    },
    onSuccess: ({ token, user }) => setAuth(token, user),
  })

  const handleLogout = async () => {
    try { await supabase.auth.signOut() } catch { /* ignore */ }
    logout()
    navigate('/login')
  }

  return {
    token,
    user,
    isLoggedIn,
    isFilmmaker: user?.role === 'filmmaker',
    login:    loginMutation,
    register: registerMutation,
    logout:   handleLogout,
    setUser,
  }
}

export function useMe() {
  const { token, setUser } = useAuthStore()
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await authApi.me()
      setUser(res.data)
      return res.data
    },
    enabled:   !!token,
    staleTime: 5 * 60 * 1000,
  })
}
