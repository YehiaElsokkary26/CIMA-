import axios from 'axios'
import type { Film, User, Review, CimaRequest, CimaMember, Notification } from '@/types'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach the Supabase access_token (auto-refreshed by the Supabase client) to
// every request. Falls back to the legacy cima_token stored in localStorage so
// the demo fallback in OnboardingPage still works without a real Supabase project.
api.interceptors.request.use(async (config) => {
  try {
    // Lazy-import to avoid a circular dependency during module initialisation
    const { supabase } = await import('./supabase')
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
      return config
    }
  } catch { /* supabase not configured — fall through */ }

  // Legacy fallback
  const token = localStorage.getItem('cima_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
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

      // Couldn't refresh — clear everything and redirect to login
      localStorage.removeItem('cima_token')
      window.location.href = '/onboarding'
    }
    return Promise.reject(err)
  }
)

// ---- Auth -------------------------------------------------------------------
export const authApi = {
  register: (data: { name: string; email: string; password: string; role: string }) =>
    api.post<{ token: string; user: User }>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ token: string; user: User }>('/auth/login', data),
  me: () => api.get<User>('/auth/me'),
}

// ---- Films ------------------------------------------------------------------
export const filmsApi = {
  list: (params?: { genre?: string; sort?: string; filter?: string }) =>
    api.get<Film[]>('/films', { params }),
  featured: () => api.get<Film>('/films/featured/week'),
  get: (id: string) => api.get<Film>(`/films/${id}`),
  upload: (formData: FormData) =>
    api.post<Film>('/films', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  rate: (id: string, rating: number) => api.post(`/films/${id}/rate`, { rating }),
  reviews: (id: string) => api.get<Review[]>(`/films/${id}/reviews`),
  addReview: (id: string, data: { rating: number; body: string }) =>
    api.post<Review>(`/films/${id}/review`, data),
}

// ---- Users ------------------------------------------------------------------
export const usersApi = {
  get: (id: string) => api.get<User>(`/users/${id}`),
  update: (data: Partial<User>) => api.patch<User>('/users/me', data),
  films: (id: string) => api.get<Film[]>(`/users/${id}/films`),
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
