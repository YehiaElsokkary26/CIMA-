import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { profilesApi, apiErrorMessage } from '@/lib/api'
import { useNavigate } from 'react-router-dom'
import type { User, UserRole } from '@/types'
import { toast } from '@/store/toastStore'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Fetches the profile row via Express, retrying once — the DB trigger that
 * creates it runs in the same transaction as the Supabase Auth signup, but
 * we allow one bounded retry rather than assuming zero replication lag. */
async function fetchProfileWithRetry(userId: string): Promise<User> {
  try {
    const { data } = await profilesApi.get(userId)
    return data
  } catch {
    await sleep(400)
    const { data } = await profilesApi.get(userId)
    return data
  }
}

export function useAuth() {
  const { token, user, isLoggedIn, setAuth, setUser, logout } = useAuthStore()
  const navigate = useNavigate()

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)
      if (!data.session) throw new Error('No session returned — please try again')

      const profile = await fetchProfileWithRetry(data.user.id)
      return { token: data.session.access_token, user: profile }
    },
    onSuccess: ({ token, user }) => setAuth(token, user),
    onError: (err) => {
      const msg = apiErrorMessage(err, 'Login failed')
      if (!msg.includes('credentials') && !msg.includes('Invalid')) {
        toast.error(msg)
      }
    },
  })

  const registerMutation = useMutation({
    mutationFn: async ({ name, email, password }: { name: string; email: string; password: string }) => {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
      if (error) throw new Error(error.message)
      if (!data.user) throw new Error('Signup failed — please try again')

      if (!data.session) {
        throw new Error('Check your email to confirm your account before logging in.')
      }

      const profile = await fetchProfileWithRetry(data.user.id)
      return { token: data.session.access_token, user: profile }
    },
    onSuccess: ({ token, user }) => {
      // New registrations always land on 'viewer' — force onboarding to run
      // so the person explicitly picks their role via the safe role endpoint.
      useAuthStore.setState({
        token,
        user,
        role: null,
        isLoggedIn: true,
        hasSelectedRole: false,
      })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Registration failed')),
  })

  const handleLogout = async () => {
    try { await supabase.auth.signOut() } catch { /* ignore */ }
    logout()
    navigate('/login')
  }

  const updateRoleMutation = useMutation({
    mutationFn: async (role: UserRole) => {
      if (!user?.id) throw new Error('Not signed in')
      const { data } = await profilesApi.changeRole(user.id, role)
      return data
    },
    onSuccess: (updated) => setUser(updated),
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not update role')),
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
      const profile = await fetchProfileWithRetry(session.user.id)
      setUser(profile)
      return profile
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  })
}
