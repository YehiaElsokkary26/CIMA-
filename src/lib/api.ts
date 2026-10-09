import axios from 'axios'
import type { Film, User, Review, CimaRequest, CimaMember, Notification } from '@/types'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach the Supabase access_token (auto-refreshed by the Supabase client) to
// every request. Supabase Auth is the single source of truth for identity —
// Express only ever trusts req.userId as derived from this verified JWT,
// never anything the client sends in a request body.
api.interceptors.request.use(async (config) => {
  const { supabase } = await import('./supabase')
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
      // Try to refresh the Supabase session before giving up
      try {
        const { supabase } = await import('./supabase')
        const { data, error } = await supabase.auth.refreshSession()
        if (!error && data.session) {
          // Retry the failed request with the new token
          err.config.headers.Authorization = `Bearer ${data.session.access_token}`
          return axios(err.config)
        }
      } catch { /* ignore */ }
    }
    return Promise.reject(err)
  }
)

// ---- Films --------------------------------------------------------------------
export const filmsApi = {
  list: (params?: { genre?: string; sort?: string }) =>
    api.get<Film[]>('/films', { params }),
  featured: () => api.get<Film>('/films/featured/week'),
  get: (id: string) => api.get<Film>(`/films/${id}`),
  create: (data: {
    title: string; description?: string; genre: string[]; runtime?: number; year?: number
    thumbnailUrl?: string; videoUrl?: string; trailerUrl?: string; aspectRatio?: string
  }) => api.post<Film>('/films', data),
  vote: (id: string) => api.post<{ ok: true; votes: number }>(`/films/${id}/vote`),
  myVoteThisWeek: () => api.get<{ filmId: string | null }>('/films/votes/mine'),
  rate: (id: string, rating: number) => api.post(`/films/${id}/rate`, { rating }),
  reviews: (id: string) => api.get<Review[]>(`/films/${id}/reviews`),
  addReview: (id: string, data: { rating: number; body: string }) =>
    api.post<Review>(`/films/${id}/review`, data),
}

// ---- Users ------------------------------------------------------------------
export const usersApi = {
  get: (id: string) => api.get<User>(`/users/${id}`),
  films: (id: string) => api.get<Film[]>(`/users/${id}/films`),
  update: (data: Partial<{
    name: string; bio: string; school: string; city: string; topGenre: string
    lookingForCollaborators: boolean; favoriteGenres: string[]; crewRoles: string[]
    avatarUrl: string; bannerUrl: string
  }>) => api.patch<User>('/users/me', data),
  changeRole: (role: 'filmmaker' | 'viewer') =>
    api.post<User>('/users/me/role', { role }),
}

// ---- Cima -------------------------------------------------------------------
export const cimaApi = {
  mine: () => api.get<{ members: CimaMember[]; requests: CimaRequest[] }>('/cima/mine'),
  sendRequest: (targetUserId: string) => api.post(`/cima/request/${targetUserId}`),
  acceptRequest: (requestId: string) => api.post(`/cima/accept/${requestId}`),
  declineRequest: (requestId: string) => api.post(`/cima/decline/${requestId}`),
}

// ---- Discover ---------------------------------------------------------------
export const discoverApi = {
  filmmakers: (params?: { genre?: string; city?: string; school?: string }) =>
    api.get<User[]>('/discover/filmmakers', { params }),
}

// ---- Notifications ----------------------------------------------------------
export const notificationsApi = {
  list: () => api.get<Notification[]>('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
}

export default api
