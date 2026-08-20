import axios, { AxiosError } from 'axios'
import { supabase } from './supabase'
import type {
  Film, User, Review, CimaRequest, CimaConnection, Notification,
  PaginatedResponse, WatchlistItem, Follow, ApiError,
} from '@/types'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Every request carries the current Supabase session's access token.
// Supabase Auth is the single source of truth for identity — there is no
// separate app-issued token to manage.
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      try {
        const { data, error } = await supabase.auth.refreshSession()
        if (!error && data.session) {
          err.config.headers.Authorization = `Bearer ${data.session.access_token}`
          return axios(err.config)
        }
      } catch { /* ignore */ }
    }
    return Promise.reject(err)
  }
)

/** Extracts a human-readable message from the API's { error: { code, message } } shape. */
export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof AxiosError) {
    const apiErr = err.response?.data?.error as ApiError | undefined
    if (apiErr?.message) return apiErr.message
    if (err.message) return err.message
  }
  if (err instanceof Error) return err.message
  return fallback
}

export function apiErrorCode(err: unknown): string | undefined {
  if (err instanceof AxiosError) {
    return (err.response?.data?.error as ApiError | undefined)?.code
  }
  return undefined
}

// ---- Auth --------------------------------------------------------------------
// Registration/login themselves go through Supabase Auth directly (see
// src/hooks/useAuth.ts) — these exist only for parity with the REST surface.
export const authApi = {
  me: () => api.get<User>('/auth/me'),
}

// ---- Films --------------------------------------------------------------------
export interface FilmListParams {
  genre?: string
  sort?: 'newest' | 'top' | 'trending'
  q?: string
  filmmakerId?: string
  page?: number
  limit?: number
}

export const filmsApi = {
  list: (params?: FilmListParams) =>
    api.get<PaginatedResponse<Film>>('/films', { params }),
  featured: () => api.get<Film>('/films/featured/week'),
  get: (id: string) => api.get<Film>(`/films/${id}`),
  create: (data: {
    title: string; description: string; genre: string[]; runtime?: number; year?: number
    thumbnailUrl?: string; videoUrl?: string; trailerUrl?: string; aspectRatio?: string
  }) => api.post<Film>('/films', data),
  update: (id: string, data: Partial<{
    title: string; description: string; genre: string[]; runtime: number; year: number
    thumbnailUrl: string; videoUrl: string; trailerUrl: string; aspectRatio: string; status: string
  }>) => api.patch<Film>(`/films/${id}`, data),
  remove: (id: string) => api.delete(`/films/${id}`),
  vote: (id: string) => api.post<{ ok: true; votes: number }>(`/films/${id}/vote`),
  myVoteThisWeek: () => api.get<{ filmId: string | null; weekKey: string }>('/films/votes/mine'),
  rate: (id: string, rating: number) => api.post(`/films/${id}/rating`, { rating }),
  reviews: (id: string, page = 1) => api.get<PaginatedResponse<Review>>(`/films/${id}/reviews`, { params: { page } }),
  addReview: (id: string, data: { rating: number; body: string }) =>
    api.post<Review>(`/films/${id}/reviews`, data),
}

// ---- Profiles -----------------------------------------------------------------
export const profilesApi = {
  get: (id: string) => api.get<User>(`/profiles/${id}`),
  films: (id: string, page = 1) => api.get<PaginatedResponse<Film>>(`/profiles/${id}/films`, { params: { page } }),
  update: (id: string, data: Partial<{
    name: string; bio: string; school: string; city: string; topGenre: string
    lookingForCollaborators: boolean; favoriteGenres: string[]; crewRoles: string[]
    avatarUrl: string; bannerUrl: string
  }>) => api.patch<User>(`/profiles/${id}`, data),
  changeRole: (id: string, role: 'filmmaker' | 'viewer') =>
    api.post<User>(`/profiles/${id}/role`, { role }),
}

// ---- Cima -------------------------------------------------------------------
export const cimaApi = {
  mine: () => api.get<{ members: CimaConnection[]; requests: CimaRequest[] }>('/cima'),
  crewOf: (userId: string) => api.get<{ members: CimaConnection[] }>(`/cima/${userId}`),
  sendRequest: (toUserId: string) => api.post('/cima/requests', { toUserId }),
  acceptRequest: (requestId: string) => api.post(`/cima/requests/${requestId}/accept`),
  declineRequest: (requestId: string) => api.post(`/cima/requests/${requestId}/decline`),
  cancelRequest: (requestId: string) => api.post(`/cima/requests/${requestId}/cancel`),
}

// ---- Discover ---------------------------------------------------------------
export const discoverApi = {
  filmmakers: (params?: { genre?: string; city?: string; school?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<User>>('/discover/filmmakers', { params }),
}

// ---- Search -------------------------------------------------------------------
export const searchApi = {
  films: (q: string) => api.get<{ data: Film[] }>('/search', { params: { q, type: 'films' } }),
  filmmakers: (q: string) => api.get<{ data: User[] }>('/search', { params: { q, type: 'filmmakers' } }),
}

// ---- Watchlist ------------------------------------------------------------------
export const watchlistApi = {
  list: () => api.get<{ data: WatchlistItem[] }>('/watchlist'),
  add: (filmId: string) => api.post(`/watchlist/${filmId}`),
  remove: (filmId: string) => api.delete(`/watchlist/${filmId}`),
}

// ---- Follows -------------------------------------------------------------------
export const followsApi = {
  get: (userId: string) => api.get<{ followers: Follow[]; following: Follow[]; followerCount: number; followingCount: number }>(`/follows/${userId}`),
  follow: (userId: string) => api.post(`/follows/${userId}`),
  unfollow: (userId: string) => api.delete(`/follows/${userId}`),
}

// ---- Notifications ----------------------------------------------------------
export const notificationsApi = {
  list: (page = 1) => api.get<PaginatedResponse<Notification>>('/notifications', { params: { page } }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
}

export default api
