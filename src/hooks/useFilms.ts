import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import {
  getFilms,
  getFilmById,
  getFilmOfTheWeek,
  getReviews,
  insertReview,
  uploadFile,
  insertFilm,
} from '@/lib/supabaseApi'
import { getCurrentWeekKey } from '@/lib/votingUtils'
import { toast } from '@/store/toastStore'

export function useFilms(params?: { genre?: string; sort?: string }) {
  return useQuery({
    queryKey: ['films', params],
    queryFn: getFilms,
    staleTime: 2 * 60 * 1000,
  })
}

export function useFeaturedFilm() {
  return useQuery({
    queryKey: ['films', 'featured'],
    queryFn: getFilmOfTheWeek,
    staleTime: 10 * 60 * 1000,
  })
}

export function useFilm(id: string) {
  return useQuery({
    queryKey: ['film', id],
    queryFn: () => getFilmById(id),
    enabled: !!id,
  })
}

export function useFilmReviews(filmId: string) {
  return useQuery({
    queryKey: ['film-reviews', filmId],
    queryFn: () => getReviews(filmId),
    enabled: !!filmId,
  })
}

export function useAddReview(filmId: string) {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  return useMutation({
    mutationFn: (data: { rating: number; body: string }) =>
      insertReview({ filmId, userId: user!.id, rating: data.rating, body: data.body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['film-reviews', filmId] }),
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to post review'),
  })
}

export function useUploadFilm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      videoFile?: File | null
      thumbFile?: File | null
      trailerFile?: File | null
      title: string
      description: string
      genre: string[]
      runtime?: number
      year: number
      uploaderId: string
      uploaderName: string
    }) => {
      let videoUrl: string | undefined
      let thumbnailUrl: string | undefined
      let trailerUrl: string | undefined

      if (params.videoFile) {
        videoUrl = await uploadFile(
          'films',
          params.videoFile,
          `${params.uploaderId}/${Date.now()}-${params.videoFile.name}`,
        )
      }
      if (params.thumbFile) {
        thumbnailUrl = await uploadFile(
          'thumbnails',
          params.thumbFile,
          `${params.uploaderId}/${Date.now()}-thumb-${params.thumbFile.name}`,
        )
      }
      if (params.trailerFile) {
        trailerUrl = await uploadFile(
          'trailers',
          params.trailerFile,
          `${params.uploaderId}/${Date.now()}-trailer-${params.trailerFile.name}`,
        )
      }

      return insertFilm({
        title: params.title,
        description: params.description,
        genre: params.genre,
        runtime: params.runtime,
        year: params.year,
        thumbnailUrl,
        videoUrl,
        trailerUrl,
        uploaderId: params.uploaderId,
        uploaderName: params.uploaderName,
        weekKey: getCurrentWeekKey(),
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['films'] }),
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Upload failed'),
  })
}
