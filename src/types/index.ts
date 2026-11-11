export type UserRole = 'filmmaker' | 'viewer'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
  bannerUrl?: string
  bio?: string
  school?: string
  city?: string
  lookingForCollaborators?: boolean
  openToCollab?: boolean
  favoriteGenres?: string[]
  crewRoles?: string[]
  filmsCount?: number
  cimaCount?: number
  reviewsCount?: number
  topGenre?: string
  createdAt: string
}

export interface Film {
  id: string
  title: string
  description: string
  thumbnailUrl?: string
  videoUrl?: string
  trailerUrl?: string
  aspectRatio?: '16:9' | '4:5' | '2:3'
  genre: string[]
  runtime?: number
  year: number
  uploaderRole?: string
  rating?: number
  ratingCount?: number
  uploaderId: string
  uploader?: User
  isFilmOfTheWeek?: boolean
  /** How many weeks this film has won Film of the Week */
  laurels?: number
  votes?: number
  /** Signed-in viewer's own stars, on GET /films/:id. */
  myRating?: number
  /** Whether the signed-in viewer saved it to their watchlist, on GET /films/:id. */
  isSaved?: boolean
  /** Votes that won Film of the Week, on GET /films/featured/week. */
  winningVotes?: number
  /** Next two films from the same ballot, on GET /films/featured/week. */
  runnerUps?: { id: string; title: string; votes: number }[]
  weekKey?: string
  createdAt: string
}

export interface Review {
  id: string
  filmId: string
  userId: string
  user?: User
  /** Notes can be posted without stars. */
  rating: number | null
  body: string
  createdAt: string
}

export interface CimaRequest {
  id: string
  fromUserId: string
  toUserId: string
  from?: User
  to?: User
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
}

/** A call sheet you sent that is still waiting. */
export interface SentCimaRequest {
  id: string
  toUserId: string
  createdAt: string
}

export interface CimaMember {
  id: string
  user: User
  joinedAt: string
}

export interface Notification {
  id: string
  userId: string
  type: 'review' | 'cima_request' | 'cima_accepted' | 'rating' | 'follower'
  message: string
  fromUser?: User
  filmId?: string
  read: boolean
  createdAt: string
}

export interface AuthState {
  token: string | null
  user: User | null
  isLoggedIn: boolean
}

export interface ApiError {
  message: string
  status?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
