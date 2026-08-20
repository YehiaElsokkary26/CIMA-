import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profilesApi, apiErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import type { User } from '@/types'

export function useProfile(id: string) {
  return useQuery({
    queryKey: ['profile', id],
    queryFn: async () => (await profilesApi.get(id)).data,
    enabled: !!id,
  })
}

export function useProfileFilms(id: string) {
  return useQuery({
    queryKey: ['profile-films', id],
    queryFn: async () => (await profilesApi.films(id)).data,
    enabled: !!id,
  })
}

export function useUpdateProfile(id: string) {
  const qc = useQueryClient()
  const setUser = useAuthStore((s) => s.setUser)
  const currentUserId = useAuthStore((s) => s.user?.id)

  return useMutation({
    mutationFn: (data: Partial<Pick<User,
      'name' | 'bio' | 'school' | 'city' | 'topGenre' | 'lookingForCollaborators' | 'favoriteGenres' | 'crewRoles' | 'avatarUrl' | 'bannerUrl'
    >>) => profilesApi.update(id, data),
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ['profile', id] })
      if (id === currentUserId) setUser(data)
      toast.success('Profile updated')
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not update profile')),
  })
}
