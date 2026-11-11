import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { filmsApi, usersApi, discoverApi, type FilmListParams } from '@/lib/api'
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

export function useFilms(params?: FilmListParams, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['films', params],
    queryFn: async () => (await filmsApi.list(params)).data,
    staleTime: 2 * 60 * 1000,
    enabled: options.enabled ?? true,
  })
}

/** The film list one page at a time, for "Load more". */
export function useFilmPages(params: Omit<FilmListParams, 'limit' | 'offset'>, pageSize = 24) {
  return useInfiniteQuery({
    queryKey: ['films', 'pages', params, pageSize],
    queryFn: async ({ pageParam }) => (await filmsApi.list({ ...params, limit: pageSize, offset: pageParam })).data,
    initialPageParam: 0,
    getNextPageParam: (last, all) => (last.length < pageSize ? undefined : all.length * pageSize),
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
      // Progress follows bytes sent, so a big film moves the bar steadily.
      // The last 5% is publishing the film record once the files are up.
      const files = [params.videoFile, params.thumbFile, params.trailerFile].filter((x): x is File => !!x)
      const totalBytes = files.reduce((n, file) => n + file.size, 0) || 1
      let doneBytes = 0
      const report = (status: string, fileBytes = 0) =>
        params.onProgress?.(Math.min(95, Math.floor(((doneBytes + fileBytes) / totalBytes) * 95)), status)
      const send = async (bucket: string, file: File, name: string, status: string) => {
        report(status)
        const url = await uploadFile(bucket, file, `${params.uploaderId}/${Date.now()}-${name}`, (fraction) =>
          report(status, fraction * file.size),
        )
        doneBytes += file.size
        return url
      }

      if (params.videoFile) videoUrl = await send('films', params.videoFile, params.videoFile.name, 'Uploading film video…')
      if (params.thumbFile) thumbnailUrl = await send('thumbnails', params.thumbFile, `thumb-${params.thumbFile.name}`, 'Uploading thumbnail…')
      if (params.trailerFile) trailerUrl = await send('trailers', params.trailerFile, `trailer-${params.trailerFile.name}`, 'Uploading trailer…')

      const updateProgress = (status: string) => params.onProgress?.(95, status)
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

/** Your watchlist, newest save first. */
export function useSavedFilms(enabled = true) {
  const userId = useAuthStore((s) => s.user?.id)
  return useQuery({
    queryKey: ['films', 'saved', userId],
    queryFn: async () => (await filmsApi.saved()).data,
    enabled: enabled && !!userId,
  })
}

/** Save or unsave a film. Pass the state you want it to end up in. */
export function useToggleSave(filmId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (save: boolean): Promise<boolean> => {
      await (save ? filmsApi.save(filmId) : filmsApi.unsave(filmId))
      return save
    },
    onMutate: async (save) => {
      await qc.cancelQueries({ queryKey: ['film', filmId] })
      const before = qc.getQueryData<Film>(['film', filmId])
      if (before) qc.setQueryData<Film>(['film', filmId], { ...before, isSaved: save })
      return { before }
    },
    onError: (err, _save, ctx) => {
      if (ctx?.before) qc.setQueryData(['film', filmId], ctx.before)
      toast.error(apiErrorMessage(err, 'Couldn’t update your watchlist. Try again.'))
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['film', filmId] })
      qc.invalidateQueries({ queryKey: ['films', 'saved'] })
    },
  })
}

export function useUpdateFilm(filmId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Parameters<typeof filmsApi.update>[1]) => (await filmsApi.update(filmId, data)).data,
    onSuccess: (film) => {
      qc.setQueryData<Film>(['film', filmId], (before) => ({ ...before, ...film }))
      qc.invalidateQueries({ queryKey: ['films'] })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Couldn’t save your changes. Try again.')),
  })
}

export function useDeleteFilm(filmId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => filmsApi.remove(filmId),
    onSuccess: () => {
      qc.removeQueries({ queryKey: ['film', filmId] })
      qc.invalidateQueries({ queryKey: ['films'] })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Couldn’t delete the film. Try again.')),
  })
}

export function useUpdateReview(filmId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reviewId, ...data }: { reviewId: string; body: string; rating?: number | null }) =>
      filmsApi.updateReview(filmId, reviewId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['film-reviews', filmId] })
      qc.invalidateQueries({ queryKey: ['film', filmId] })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Couldn’t save your note. Try again.')),
  })
}

export function useDeleteReview(filmId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reviewId: string) => filmsApi.deleteReview(filmId, reviewId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['film-reviews', filmId] }),
    onError: (err) => toast.error(apiErrorMessage(err, 'Couldn’t delete your note. Try again.')),
  })
}
