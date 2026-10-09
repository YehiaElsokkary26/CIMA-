import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { filmsApi, usersApi, discoverApi } from '@/lib/api'
import { uploadFile } from '@/lib/storage'
import { toast } from '@/store/toastStore'

function apiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const msg = (err as any).response?.data?.message
    if (typeof msg === 'string') return msg
  }
  return err instanceof Error ? err.message : fallback
}

export function useFilms(params?: { genre?: string; sort?: string }) {
  return useQuery({
    queryKey: ['films', params],
    queryFn: async () => (await filmsApi.list(params)).data,
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

export function useFilmmakers() {
  return useQuery({
    queryKey: ['filmmakers'],
    queryFn: async () => (await discoverApi.filmmakers()).data,
    staleTime: 5 * 60 * 1000,
  })
}

export function useFilmsByUser(userId: string | undefined) {
  return useQuery({
    queryKey: ['films', 'by-user', userId],
    queryFn: async () => (await usersApi.films(userId!)).data,
    enabled: !!userId,
  })
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => (await usersApi.get(userId!)).data,
    enabled: !!userId,
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
    mutationFn: (data: { rating: number; body: string }) =>
      filmsApi.addReview(filmId, data).then((res) => res.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['film-reviews', filmId] }),
    onError: (err) => toast.error(apiErrorMessage(err, 'Failed to post review')),
  })
}

export function useVoteFilm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (filmId: string) => filmsApi.vote(filmId).then((res) => res.data),
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

      if (params.videoFile) {
        videoUrl = await uploadFile('films', params.videoFile, `${params.uploaderId}/${Date.now()}-${params.videoFile.name}`)
      }
      if (params.thumbFile) {
        thumbnailUrl = await uploadFile('thumbnails', params.thumbFile, `${params.uploaderId}/${Date.now()}-thumb-${params.thumbFile.name}`)
      }
      if (params.trailerFile) {
        trailerUrl = await uploadFile('trailers', params.trailerFile, `${params.uploaderId}/${Date.now()}-trailer-${params.trailerFile.name}`)
      }

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
