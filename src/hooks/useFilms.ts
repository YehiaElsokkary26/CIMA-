import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { filmsApi, apiErrorMessage, type FilmListParams } from '@/lib/api'
import { uploadToBucket } from '@/lib/storage'
import { toast } from '@/store/toastStore'

export function useFilms(params?: FilmListParams) {
  return useQuery({
    queryKey: ['films', params],
    queryFn: async () => (await filmsApi.list(params)).data,
    staleTime: 2 * 60 * 1000,
  })
}

/** Infinite-scroll / "load more" variant of useFilms. */
export function useInfiniteFilms(params?: Omit<FilmListParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: ['films', 'infinite', params],
    queryFn: async ({ pageParam }) => (await filmsApi.list({ ...params, page: pageParam })).data,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined),
    staleTime: 2 * 60 * 1000,
  })
}

export function useFeaturedFilm() {
  return useQuery({
    queryKey: ['films', 'featured'],
    queryFn: async () => {
      try {
        return (await filmsApi.featured()).data
      } catch {
        return null
      }
    },
    staleTime: 10 * 60 * 1000,
  })
}

export function useFilm(id: string) {
  return useQuery({
    queryKey: ['film', id],
    queryFn: async () => (await filmsApi.get(id)).data,
    enabled: !!id,
  })
}

export function useFilmReviews(filmId: string) {
  return useQuery({
    queryKey: ['film-reviews', filmId],
    queryFn: async () => (await filmsApi.reviews(filmId)).data,
    enabled: !!filmId,
  })
}

export function useAddReview(filmId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { rating: number; body: string }) => filmsApi.addReview(filmId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['film-reviews', filmId] }),
    onError: (err) => toast.error(apiErrorMessage(err, 'Failed to post review')),
  })
}

export function useRateFilm(filmId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rating: number) => filmsApi.rate(filmId, rating),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['film', filmId] })
      qc.invalidateQueries({ queryKey: ['films'] })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Failed to rate film')),
  })
}

export function useVoteFilm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (filmId: string) => filmsApi.vote(filmId),
    onSuccess: (_res, filmId) => {
      qc.invalidateQueries({ queryKey: ['films'] })
      qc.invalidateQueries({ queryKey: ['film', filmId] })
      qc.invalidateQueries({ queryKey: ['films', 'votes', 'mine'] })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Vote failed. Try again.')),
  })
}

export function useMyVoteThisWeek() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  return useQuery({
    queryKey: ['films', 'votes', 'mine'],
    queryFn: async () => (await filmsApi.myVoteThisWeek()).data,
    enabled: isLoggedIn,
    staleTime: 60 * 1000,
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
    }) => {
      let videoUrl: string | undefined
      let thumbnailUrl: string | undefined
      let trailerUrl: string | undefined

      if (params.videoFile) videoUrl = await uploadToBucket('films', params.videoFile, params.uploaderId)
      if (params.thumbFile) thumbnailUrl = await uploadToBucket('thumbnails', params.thumbFile, params.uploaderId)
      if (params.trailerFile) trailerUrl = await uploadToBucket('trailers', params.trailerFile, params.uploaderId)

      const { data } = await filmsApi.create({
        title: params.title,
        description: params.description,
        genre: params.genre,
        runtime: params.runtime,
        year: params.year,
        thumbnailUrl,
        videoUrl,
        trailerUrl,
      })
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['films'] }),
    onError: (err) => toast.error(apiErrorMessage(err, 'Upload failed')),
  })
}
