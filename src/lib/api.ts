import axios from 'axios'
import type { Film, User, Review, CimaRequest, CimaMember, Notification } from '@/types'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cima_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cima_token')
      window.location.href = '/onboarding'
    }
    return Promise.reject(err)
  }
)

// Auth
export const authApi = {
  register: (data: { name: string; email: string; password: string; role: string }) =>
    api.post<{ token: string; user: User }>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ token: string; user: User }>('/auth/login', data),
  me: () => api.get<User>('/auth/me'),
}

// Films
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

// Users
export const usersApi = {
  get: (id: string) => api.get<User>(`/users/${id}`),
  update: (data: Partial<User>) => api.patch<User>('/users/me', data),
  films: (id: string) => api.get<Film[]>(`/users/${id}/films`),
}

// Cima
export const cimaApi = {
  mine: () => api.get<{ members: CimaMember[]; requests: CimaRequest[] }>('/cima/mine'),
  sendRequest: (targetUserId: string) => api.post(`/cima/request/${targetUserId}`),
  acceptRequest: (requestId: string) => api.post(`/cima/accept/${requestId}`),
  declineRequest: (requestId: string) => api.post(`/cima/decline/${requestId}`),
}

// Discover
export const discoverApi = {
  filmmakers: (params?: { genre?: string; city?: string; school?: string }) =>
    api.get<User[]>('/discover/filmmakers', { params }),
}

// Notifications
export const notificationsApi = {
  list: () => api.get<Notification[]>('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
}

export default api
