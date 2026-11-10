import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { filmsApi, usersApi, discoverApi } from '@/lib/api'
import { uploadFile } from '@/lib/storage'
import { toast } from '@/store/toastStore'
import type { Film } from '@/types'

function apiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = err.response
    if (response && typeof response === 'object' && 'status' in response && response.status === 422 &&
        'data' in response && response.data && typeof response.data === 'object' && 'errors' in response.data) {
      const errors = response.data.errors
      if (errors && typeof errors === 'object') {
        for (const messages of Object.values(errors)) {
          if (Array.isArray(messages) && typeof messages[0] === 'string') return messages[0]
        }
      }
    }
    const msg = response && typeof response === 'object' && 'data' in response &&
      response.data && typeof response.data === 'object' && 'message' in response.data
      ? response.data.message
      : undefined
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
    mutationFn: (data: { rating?: number; body: string }) =>
      filmsApi.addReview(filmId, data).then((res) => res.data),
    onSuccess: (_res, data) => {
      qc.invalidateQueries({ queryKey: ['film-reviews', filmId] })
      if (data.rating) {
        qc.invalidateQueries({ queryKey: ['film', filmId] })
        qc.invalidateQueries({ queryKey: ['films'] })
      }
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Failed to post review')),
  })
}

/** Saves your stars for a film (one rating per person; tapping again changes it). */
export function useRateFilm(filmId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rating: number) => filmsApi.rate(filmId, rating),
    onMutate: async (rating) => {
      // Show the new stars straight away; roll back if the save fails.
      await qc.cancelQueries({ queryKey: ['film', filmId] })
      const before = qc.getQueryData<Film>(['film', filmId])
      if (before) qc.setQueryData<Film>(['film', filmId], { ...before, myRating: rating })
      return { before }
    },
    onError: (err, _rating, ctx) => {
      if (ctx?.before) qc.setQueryData(['film', filmId], ctx.before)
      toast.error(apiErrorMessage(err, 'Couldn’t save your rating. Try again.'))
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['film', filmId] })
      qc.invalidateQueries({ queryKey: ['films'] })
    },
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
      uploaderRole?: string
      onProgress?: (progress: number, status: string) => void
    }) => {
      let videoUrl: string | undefined
      let thumbnailUrl: string | undefined
      let trailerUrl: string | undefined
      const uploadCount = [params.videoFile, params.thumbFile, params.trailerFile].filter(Boolean).length
      const totalStages = uploadCount + 1
      let completedStages = 0
      const updateProgress = (status: string) =>
        params.onProgress?.(Math.round((completedStages / totalStages) * 100), status)

      if (params.videoFile) {
        updateProgress('Uploading film video…')
        videoUrl = await uploadFile('films', params.videoFile, `${params.uploaderId}/${Date.now()}-${params.videoFile.name}`)
        completedStages += 1
      }
      if (params.thumbFile) {
        updateProgress('Uploading thumbnail…')
        thumbnailUrl = await uploadFile('thumbnails', params.thumbFile, `${params.uploaderId}/${Date.now()}-thumb-${params.thumbFile.name}`)
        completedStages += 1
      }
      if (params.trailerFile) {
        updateProgress('Uploading trailer…')
        trailerUrl = await uploadFile('trailers', params.trailerFile, `${params.uploaderId}/${Date.now()}-trailer-${params.trailerFile.name}`)
        completedStages += 1
      }

      updateProgress('Publishing film…')
      const { data } = await filmsApi.create({
        title: params.title,
        description: params.description,
        genre: params.genre,
        runtime: params.runtime,
        year: params.year,
        thumbnailUrl,
        videoUrl,
        trailerUrl,
        uploaderRole: params.uploaderRole,
      })
      params.onProgress?.(100, 'Film published')
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['films'] }),
    onError: (err) => toast.error(apiErrorMessage(err, 'Upload failed')),
  })
}
