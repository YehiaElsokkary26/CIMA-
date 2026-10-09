import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { usersApi } from '@/lib/api'
import { useNavigate } from 'react-router-dom'
import type { User, UserRole } from '@/types'
import { toast } from '@/store/toastStore'

function apiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const msg = (err as any).response?.data?.message
    if (typeof msg === 'string') return msg
  }
  return err instanceof Error ? err.message : fallback
}

export function useAuth() {
  const { token, user, isLoggedIn, setAuth, setUser, logout } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)
      if (!data.session) throw new Error('No session returned — please try again')

      const profile = (await usersApi.get(data.user.id)).data
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
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
      if (error) throw new Error(error.message)
      if (!data.user) throw new Error('Signup failed — please try again')

      if (!data.session) {
        throw new Error('Check your email to confirm your account before logging in.')
      }

      // The DB trigger (handle_new_user) already created the profile row
      // from auth.users — no separate create call needed. Role is left
      // unset here on purpose so onboarding is triggered after signup.
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

  // Sync role selection to the profiles table via Express
  const updateRoleMutation = useMutation({
    mutationFn: async (role: UserRole) => (await usersApi.changeRole(role)).data,
    onSuccess: (updated) => setUser(updated),
    onError: (err) => toast.error(apiErrorMessage(err, 'Failed to update role')),
  })

  // Persist any profile field via Express
  const updateProfileMutation = useMutation({
    mutationFn: async (patch: Parameters<typeof usersApi.update>[0]) =>
      (await usersApi.update(patch)).data,
    onSuccess: (updated) => {
      setUser(updated)
      qc.invalidateQueries({ queryKey: ['profile', updated.id] })
      toast.success('Profile updated')
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Failed to update profile')),
  })

  return {
    token,
    user,
    isLoggedIn,
    isFilmmaker: user?.role === 'filmmaker',
    login:         loginMutation,
    register:      registerMutation,
    logout:        handleLogout,
    updateRole:    updateRoleMutation,
    updateProfile: updateProfileMutation,
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
      const profile = (await usersApi.get(session.user.id)).data
      setUser(profile)
      return profile
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  })
}
