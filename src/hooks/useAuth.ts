import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { getProfile, createProfile, updateProfileRole } from '@/lib/supabaseApi'
import { useNavigate } from 'react-router-dom'
import type { User, UserRole } from '@/types'
import { toast } from '@/store/toastStore'

export function useAuth() {
  const { token, user, isLoggedIn, setAuth, setUser, logout } = useAuthStore()
  const navigate = useNavigate()

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)
      if (!data.session) throw new Error('No session returned — please try again')

      const profile = await getProfile(data.user.id, data.user.email)
      if (!profile) throw new Error('Profile not found. Please contact support.')

      return { token: data.session.access_token, user: profile }
    },
    onSuccess: ({ token, user }) => setAuth(token, user),
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Login failed'
      if (!msg.includes('credentials') && !msg.includes('Invalid')) {
        toast.error(msg)
      }
    },
  })

  const registerMutation = useMutation({
    mutationFn: async ({
      name,
      email,
      password,
    }: {
      name: string
      email: string
      password: string
      role?: string
    }) => {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw new Error(error.message)
      if (!data.user) throw new Error('Signup failed — please try again')

      if (!data.session) {
        throw new Error('Check your email to confirm your account before logging in.')
      }

      // Insert profile without role so onboarding is triggered
      await createProfile({ id: data.user.id, name })

      const newUser: User = {
        id: data.user.id,
        email: data.user.email ?? email,
        name,
        role: undefined as unknown as UserRole,
        createdAt: new Date().toISOString(),
      }
      return { token: data.session.access_token, user: newUser }
    },
    onSuccess: ({ token, user }) => {
      // Force hasSelectedRole: false for new registrations so onboarding shows
      useAuthStore.setState({
        token,
        user,
        role: null,
        isLoggedIn: true,
        hasSelectedRole: false,
      })
      localStorage.setItem('cima_token', token)
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      if (!msg.includes('fetch') && !msg.includes('network') && !msg.includes('Failed')) {
        toast.error(msg)
      }
    },
  })

  const handleLogout = async () => {
    try { await supabase.auth.signOut() } catch { /* ignore */ }
    logout()
    navigate('/login')
  }

  // Sync role selection to Supabase profiles table
  const updateRoleMutation = useMutation({
    mutationFn: async (role: UserRole) => {
      if (!user?.id) return
      await updateProfileRole(user.id, role)
    },
  })

  return {
    token,
    user,
    isLoggedIn,
    isFilmmaker: user?.role === 'filmmaker',
    login:      loginMutation,
    register:   registerMutation,
    logout:     handleLogout,
    updateRole: updateRoleMutation,
    setUser,
  }
}

export function useMe() {
  const { token, user, setUser } = useAuthStore()
  return useQuery({
    queryKey: ['me', user?.id],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return null
      const profile = await getProfile(session.user.id, session.user.email)
      if (profile) setUser(profile)
      return profile
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  })
}
