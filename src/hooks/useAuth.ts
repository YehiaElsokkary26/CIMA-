import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/lib/api'
import { useNavigate } from 'react-router-dom'

export function useAuth() {
  const { token, user, isLoggedIn, setAuth, setUser, logout } = useAuthStore()

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (res) => setAuth(res.data.token, res.data.user),
  })

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (res) => setAuth(res.data.token, res.data.user),
  })

  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/onboarding')
  }

  return {
    token,
    user,
    isLoggedIn,
    isFilmmaker: user?.role === 'filmmaker',
    login: loginMutation,
    register: registerMutation,
    logout: handleLogout,
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
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  })
}
