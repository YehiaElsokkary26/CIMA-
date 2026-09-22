export type UserRole = 'filmmaker' | 'viewer'
export type FilmStatus = 'draft' | 'uploading' | 'processing' | 'ready' | 'published' | 'failed' | 'archived'
export type NotificationType = 'review' | 'cima_request' | 'cima_accepted' | 'rating' | 'follower'
export type CimaRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled'
export type AspectRatio = '16:9' | '4:5' | '2:3'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  avatarUrl?: string
  bannerUrl?: string
  bio?: string
  school?: string
  city?: string
  lookingForCollaborators?: boolean
  openToCollab?: boolean
  favoriteGenres?: string[]
  crewRoles?: string[]
  topGenre?: string
  filmsCount?: number
  cimaCount?: number
  reviewsCount?: number
  createdAt: string
}

export type Profile = User

export interface Film {
  id: string
  title: string
  description: string
  thumbnailUrl?: string
  videoUrl?: string
  trailerUrl?: string
  aspectRatio?: AspectRatio
  genre: string[]
  runtime?: number
  year: number
  status?: FilmStatus
  rating?: number
  ratingCount?: number
  votes?: number
  isFilmOfTheWeek?: boolean
  filmmakerId: string
  /** @deprecated use filmmakerId — kept for older component props during the migration */
  uploaderId?: string
  filmmaker?: User
  /** @deprecated use filmmaker — kept for older component props during the migration */
  uploader?: User
  createdAt: string
}

export interface FilmCredit {
  id: string
  filmId: string
  userId: string
  user?: User
  role: string
  createdAt: string
}

export interface Rating {
  id: string
  filmId: string
  userId: string
  rating: number
  createdAt: string
}

export interface Review {
  id: string
  filmId: string
  userId: string
  user?: User
  rating: number
  body: string
  createdAt: string
}

export interface FeaturedFilm {
  filmId: string
  weekStart: string
  film?: Film
}

export interface CimaRequest {
  id: string
  fromUserId: string
  toUserId: string
  from?: User
  to?: User
  status: CimaRequestStatus
  createdAt: string
}

export interface CimaConnection {
  id: string
  user: User
  joinedAt: string
}

export type CimaMember = CimaConnection

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  message: string
  fromUser?: User
  filmId?: string
  read: boolean
  createdAt: string
}

export interface WatchlistItem {
  id: string
  addedAt: string
  film: Pick<Film, 'id' | 'title' | 'thumbnailUrl' | 'genre' | 'runtime' | 'year'>
}

export interface Follow {
  id: string
  name: string
  avatarUrl?: string
  role: UserRole
}

export interface List {
  id: string
  userId: string
  name: string
  description?: string
  isPublic: boolean
  createdAt: string
}

export interface ListItem {
  id: string
  listId: string
  filmId: string
  position: number
  createdAt: string
}

export interface ActivityEvent {
  id: string
  userId: string
  type: string
  filmId?: string
  targetUserId?: string
  metadata: Record<string, unknown>
  createdAt: string
}

export interface AuthState {
  token: string | null
  user: User | null
  isLoggedIn: boolean
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, string[] | undefined>
}

export interface Pagination {
  page: number
  hasMore: boolean
  total: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: Pagination
}
