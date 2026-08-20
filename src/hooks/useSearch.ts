import { useQuery } from '@tanstack/react-query'
import { searchApi } from '@/lib/api'

export function useSearch(query: string, type: 'films' | 'filmmakers' = 'films') {
  const q = query.trim()
  return useQuery({
    queryKey: ['search', type, q],
    queryFn: async () => (type === 'films' ? (await searchApi.films(q)).data : (await searchApi.filmmakers(q)).data),
    enabled: q.length > 0,
    staleTime: 30 * 1000,
  })
}
