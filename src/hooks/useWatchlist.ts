import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { watchlistApi, apiErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/toastStore'

export function useWatchlist() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  return useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => (await watchlistApi.list()).data.data,
    enabled: isLoggedIn,
  })
}

export function useToggleWatchlist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ filmId, inWatchlist }: { filmId: string; inWatchlist: boolean }) =>
      inWatchlist ? watchlistApi.remove(filmId) : watchlistApi.add(filmId),
    onSuccess: (_res, { inWatchlist }) => {
      qc.invalidateQueries({ queryKey: ['watchlist'] })
      toast.success(inWatchlist ? 'Removed from watchlist' : 'Added to watchlist')
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not update watchlist')),
  })
}
