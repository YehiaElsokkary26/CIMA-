import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { usersApi } from '@/lib/api'
import { useNavigate } from 'react-router-dom'
import type { User, UserRole } from '@/types'
import { toast } from '@/store/toastStore'

/** Thrown when someone signs up with an email that already has an account. */
export class AccountExistsError extends Error {
  constructor() {
    super('An account with this email already exists. Sign in instead.')
    this.name = 'AccountExistsError'
  }
}

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
      if (!data.session) throw new Error('No session returned. Please try again.')

      try {
        const profile = (await usersApi.get(data.user.id)).data
        return { token: data.session.access_token, user: profile }
      } catch {
        // Password was right but the Klaket API is unreachable. Don't leave a
        // half-signed-in Supabase session behind.
        await supabase.auth.signOut().catch(() => {})
        throw new Error('Signed in, but the Klaket server isn’t responding. Make sure the backend is running, then try again.')
      }
    },
    onSuccess: ({ token, user }) => setAuth(token, user),
    // Errors are shown inline on the form, so no toast here.
  })

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
      role?: UserRole
    }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role },
          // Where the confirmation link in the email lands. Must be listed under
          // Supabase → Authentication → URL Configuration → Redirect URLs.
          emailRedirectTo: `${window.location.origin}/login`,
        },
      })
      if (error) throw new Error(error.message)
      if (!data.user) throw new Error('Signup failed. Please try again.')

      // Supabase does not error for an email that is already registered (so
      // attackers can't probe which emails exist). It returns a placeholder
      // user with no identities and no session instead.
      if (!data.session && (data.user.identities?.length ?? 0) === 0) {
        throw new AccountExistsError()
      }

      // Email confirmation is switched on for the project: the account exists,
      // but there is no session until the link in the email is clicked.
      if (!data.session) {
        return { status: 'confirm-email' as const, email }
      }

      // The DB trigger (handle_new_user) creates the profile row from the
      // name/role metadata above, so no separate create call is needed.
      const newUser: User = {
        id: data.user.id,
        email: data.user.email ?? email,
        name,
        role: role as UserRole,
        createdAt: new Date().toISOString(),
      }
      return { status: 'signed-in' as const, token: data.session.access_token, user: newUser }
    },
    onSuccess: (result) => {
      if (result.status !== 'signed-in') return
      useAuthStore.setState({
        token: result.token,
        user: result.user,
        role: result.user.role ?? null,
        isLoggedIn: true,
        hasSelectedRole: !!result.user.role,
      })
      localStorage.setItem('klaket_token', result.token)
    },
    // Errors are shown inline on the form, so no toast here.
  })

  // Send the sign-up confirmation email again.
  const resendConfirmation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${window.location.origin}/login` },
      })
      if (error) throw new Error(error.message)
    },
  })

  const handleLogout = async () => {
    try { await supabase.auth.signOut() } catch { /* ignore */ }
    logout()
    navigate('/welcome')
  }

  // Sync role selection to the profiles table via Express
  const updateRoleMutation = useMutation({
    mutationFn: async (role: UserRole) => (await usersApi.changeRole(role)).data,
    onSuccess: (updated) => {
      setUser(updated)
      if (updated.role === 'filmmaker') {
        toast.success("You’re a filmmaker now — you can upload films from the tab bar.")
      }
    },
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
    resendConfirmation,
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
