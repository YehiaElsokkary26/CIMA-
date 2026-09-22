import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { followsApi, apiErrorMessage } from '@/lib/api'
import { toast } from '@/store/toastStore'

export function useFollows(userId: string) {
  return useQuery({
    queryKey: ['follows', userId],
    queryFn: async () => (await followsApi.get(userId)).data,
    enabled: !!userId,
  })
}

export function useToggleFollow(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (isFollowing: boolean) => (isFollowing ? followsApi.unfollow(userId) : followsApi.follow(userId)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['follows', userId] }),
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not update follow status')),
  })
}
