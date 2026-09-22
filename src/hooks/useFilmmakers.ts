import { useQuery } from '@tanstack/react-query'
import { discoverApi } from '@/lib/api'

export function useFilmmakers(params?: { genre?: string; city?: string; school?: string; page?: number }) {
  return useQuery({
    queryKey: ['filmmakers', params],
    queryFn: async () => (await discoverApi.filmmakers(params)).data.data,
    staleTime: 5 * 60 * 1000,
  })
}
