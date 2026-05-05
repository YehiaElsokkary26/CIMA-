import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { filmsApi } from '@/lib/api'

export function useFilms(params?: { genre?: string; sort?: string }) {
  return useQuery({
    queryKey: ['films', params],
    queryFn: async () => {
      const res = await filmsApi.list(params)
      return res.data
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useFeaturedFilm() {
  return useQuery({
    queryKey: ['films', 'featured'],
    queryFn: async () => {
      const res = await filmsApi.featured()
      return res.data
    },
    staleTime: 10 * 60 * 1000,
  })
}

export function useFilm(id: string) {
  return useQuery({
    queryKey: ['film', id],
    queryFn: async () => {
      const res = await filmsApi.get(id)
      return res.data
    },
    enabled: !!id,
  })
}

export function useFilmReviews(filmId: string) {
  return useQuery({
    queryKey: ['film-reviews', filmId],
    queryFn: async () => {
      const res = await filmsApi.reviews(filmId)
      return res.data
    },
    enabled: !!filmId,
  })
}

export function useAddReview(filmId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { rating: number; body: string }) => filmsApi.addReview(filmId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['film-reviews', filmId] }),
  })
}

export function useUploadFilm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => filmsApi.upload(formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['films'] }),
  })
}
