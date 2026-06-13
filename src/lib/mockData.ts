import type { User, Film } from '@/types'
import { getCurrentWeekKey, getUserVoteThisWeek, setUserVote } from './votingUtils'

// ─── Demo users ────────────────────────────────────────────────────────────

export const ALEX: User = {
  id: 'u_alex',
  name: 'Alex Reyes',
  email: 'demo@cima.film',
  role: 'filmmaker',
  avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=alexreyes',
  bio: 'Final year film student. I shoot on 16mm when I can.',
  filmsCount: 2,
  createdAt: '2023-09-01T00:00:00Z',
}

export const SARA: User = {
  id: 'u_sara',
  name: 'Sara El-Amin',
  email: 'sara@cimafilms.com',
  role: 'viewer',
  avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=saraelamin',
  bio: 'Film lover. Always looking for hidden gems.',
  createdAt: '2023-10-15T00:00:00Z',
}

const OMAR: User = {
  id: 'u_omar',
  name: 'Omar Khalil',
  email: 'omar@cimafilms.com',
  role: 'filmmaker',
  avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=omarkhalil',
  bio: 'Experimental filmmaker based in Cairo.',
  filmsCount: 1,
  createdAt: '2023-08-20T00:00:00Z',
}

const LAYLA: User = {
  id: 'u_layla',
  name: 'Layla Hassan',
  email: 'layla@cimafilms.com',
  role: 'filmmaker',
  avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=laylahassan',
  bio: 'Genre films with a local flavour.',
  filmsCount: 1,
  createdAt: '2024-01-10T00:00:00Z',
}

const NOUR: User = {
  id: 'u_nour',
  name: 'Nour Khalid',
  email: 'nour@cimafilms.com',
  role: 'filmmaker',
  avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=nourkhalid',
  bio: 'Horror and atmosphere. Mostly at night.',
  filmsCount: 1,
  createdAt: '2024-02-05T00:00:00Z',
}

const RAMZI: User = {
  id: 'u_ramzi',
  name: 'Ramzi Essam',
  email: 'ramzi@cimafilms.com',
  role: 'filmmaker',
  avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=ramziessam',
  bio: 'Comedy shorts and deadpan character studies.',
  filmsCount: 1,
  createdAt: '2023-11-01T00:00:00Z',
}

const PASSWORDS: Record<string, string> = {
  'demo@cima.film':    'password',
  'viewer@cima.film':  'password',
  'alex@cimafilms.com': 'cima2024',
  'sara@cimafilms.com': 'cima2024',
}

const LEGACY_USERS: Record<string, User> = {
  'demo@cima.film': {
    id: 'u_demo',
    name: 'Demo Filmmaker',
    email: 'demo@cima.film',
    role: 'filmmaker',
    createdAt: new Date().toISOString(),
  },
  'viewer@cima.film': {
    id: 'u_demo_viewer',
    name: 'Demo Viewer',
    email: 'viewer@cima.film',
    role: 'viewer',
    createdAt: new Date().toISOString(),
  },
}

const ALL_USERS: User[] = [ALEX, SARA, OMAR, LAYLA, NOUR, RAMZI]

// ─── Seed films ─────────────────────────────────────────────────────────────

const W = getCurrentWeekKey()

// Sample video URLs reused across films (mock — no real server)
const V = {
  bbb: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  ed:  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  fb:  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  sub: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
  tos: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  w3s: 'https://www.w3schools.com/html/mov_bbb.mp4',
}

let films: Film[] = [
  // ─── Original 6 ──────────────────────────────────────────────────────
  {
    id: 'f1',
    title: 'Dust & Static',
    description: 'A young archivist discovers a box of tapes that may not belong to this timeline.',
    thumbnailUrl: 'https://picsum.photos/seed/dust-static/400/500',
    videoUrl: V.w3s,
    trailerUrl: V.fb,
    aspectRatio: '4:5',
    genre: ['Drama'],
    runtime: 13,
    year: 2023,
    rating: 4.2,
    ratingCount: 31,
    uploaderId: ALEX.id,
    uploader: ALEX,
    isFilmOfTheWeek: true,
    votes: 847,
    weekKey: W,
    createdAt: '2023-06-15T00:00:00Z',
  },
  {
    id: 'f2',
    title: 'The Last Reel',
    description: 'The closing of the last independent cinema in a small Egyptian town.',
    thumbnailUrl: 'https://picsum.photos/seed/last-reel/600/338',
    videoUrl: V.bbb,
    aspectRatio: '16:9',
    genre: ['Documentary'],
    runtime: 8,
    year: 2022,
    rating: 3.8,
    ratingCount: 19,
    uploaderId: ALEX.id,
    uploader: ALEX,
    votes: 312,
    weekKey: W,
    createdAt: '2022-11-20T00:00:00Z',
  },
  {
    id: 'f3',
    title: 'Overexposed',
    description: 'Shot entirely on expired film stock found in a Cairo flea market.',
    thumbnailUrl: 'https://picsum.photos/seed/overexposed/400/600',
    videoUrl: V.ed,
    trailerUrl: V.w3s,
    aspectRatio: '2:3',
    genre: ['Experimental'],
    runtime: 5,
    year: 2024,
    rating: 4.6,
    ratingCount: 54,
    uploaderId: OMAR.id,
    uploader: OMAR,
    votes: 523,
    weekKey: W,
    createdAt: '2024-03-10T00:00:00Z',
  },
  {
    id: 'f4',
    title: 'Threshold',
    description: 'A border checkpoint officer starts receiving faxes from someone who crossed twenty years ago.',
    thumbnailUrl: 'https://picsum.photos/seed/threshold-film/400/500',
    videoUrl: V.fb,
    aspectRatio: '4:5',
    genre: ['Thriller'],
    runtime: 19,
    year: 2024,
    rating: 4.1,
    ratingCount: 27,
    uploaderId: LAYLA.id,
    uploader: LAYLA,
    votes: 198,
    weekKey: W,
    createdAt: '2024-02-14T00:00:00Z',
  },
  {
    id: 'f5',
    title: 'Reversal',
    description: 'A woman wakes to find every mirror in her apartment showing a room that no longer exists.',
    thumbnailUrl: 'https://picsum.photos/seed/reversal-horror/400/600',
    videoUrl: V.sub,
    trailerUrl: V.ed,
    aspectRatio: '2:3',
    genre: ['Horror'],
    runtime: 11,
    year: 2024,
    rating: 3.9,
    ratingCount: 38,
    uploaderId: NOUR.id,
    uploader: NOUR,
    votes: 445,
    weekKey: W,
    createdAt: '2024-01-28T00:00:00Z',
  },
  {
    id: 'f6',
    title: 'Two Seconds',
    description: 'A speed-dating event goes sideways when everyone is given exactly two seconds per date.',
    thumbnailUrl: 'https://picsum.photos/seed/two-seconds/600/338',
    videoUrl: V.tos,
    aspectRatio: '16:9',
    genre: ['Comedy'],
    runtime: 7,
    year: 2023,
    rating: 4.4,
    ratingCount: 62,
    uploaderId: RAMZI.id,
    uploader: RAMZI,
    votes: 621,
    weekKey: W,
    createdAt: '2023-12-05T00:00:00Z',
  },

  // ─── 8 additional films ───────────────────────────────────────────────
  {
    id: 'f7',
    title: 'The Signal',
    description: 'A radio telescope picks up a pattern that cannot be noise. A lone operator must decide whether to report it.',
    thumbnailUrl: 'https://picsum.photos/seed/signal-film/400/500',
    videoUrl: V.w3s,
    trailerUrl: V.fb,
    aspectRatio: '4:5',
    genre: ['Sci-Fi'],
    runtime: 15,
    year: 2024,
    rating: 3.7,
    ratingCount: 23,
    uploaderId: ALEX.id,
    uploader: ALEX,
    votes: 287,
    weekKey: W,
    createdAt: '2024-05-01T00:00:00Z',
  },
  {
    id: 'f8',
    title: 'Night Market',
    description: 'Two strangers meet every Thursday at the same food stall and slowly piece together a shared past.',
    thumbnailUrl: 'https://picsum.photos/seed/night-market/600/338',
    videoUrl: V.ed,
    aspectRatio: '16:9',
    genre: ['Drama'],
    runtime: 10,
    year: 2023,
    rating: 4.0,
    ratingCount: 18,
    uploaderId: OMAR.id,
    uploader: OMAR,
    votes: 156,
    weekKey: W,
    createdAt: '2023-09-12T00:00:00Z',
  },
  {
    id: 'f9',
    title: 'Frames',
    description: 'A series of still photographs comes to life when arranged in the wrong order.',
    thumbnailUrl: 'https://picsum.photos/seed/frames-exp/400/600',
    videoUrl: V.bbb,
    trailerUrl: V.w3s,
    aspectRatio: '2:3',
    genre: ['Experimental'],
    runtime: 6,
    year: 2024,
    rating: 4.3,
    ratingCount: 41,
    uploaderId: LAYLA.id,
    uploader: LAYLA,
    votes: 398,
    weekKey: W,
    createdAt: '2024-04-20T00:00:00Z',
  },
  {
    id: 'f10',
    title: 'Desert Rain',
    description: 'Farmers in the Nile delta document a season of unprecedented rainfall and what it means for their land.',
    thumbnailUrl: 'https://picsum.photos/seed/desert-rain/400/500',
    videoUrl: V.sub,
    aspectRatio: '4:5',
    genre: ['Documentary'],
    runtime: 14,
    year: 2023,
    rating: 3.5,
    ratingCount: 12,
    uploaderId: NOUR.id,
    uploader: NOUR,
    votes: 72,
    weekKey: W,
    createdAt: '2023-07-08T00:00:00Z',
  },
  {
    id: 'f11',
    title: 'Echo Chamber',
    description: 'A podcaster who investigates conspiracy theories becomes the subject of one.',
    thumbnailUrl: 'https://picsum.photos/seed/echo-chamber/400/600',
    videoUrl: V.tos,
    trailerUrl: V.fb,
    aspectRatio: '2:3',
    genre: ['Thriller'],
    runtime: 18,
    year: 2024,
    rating: 4.1,
    ratingCount: 29,
    uploaderId: RAMZI.id,
    uploader: RAMZI,
    votes: 341,
    weekKey: W,
    createdAt: '2024-03-05T00:00:00Z',
  },
  {
    id: 'f12',
    title: 'First Light',
    description: 'A cinematographer\'s final sunrise before cataract surgery. Shot in one continuous take.',
    thumbnailUrl: 'https://picsum.photos/seed/first-light/600/338',
    videoUrl: V.w3s,
    aspectRatio: '16:9',
    genre: ['Drama'],
    runtime: 9,
    year: 2022,
    rating: 3.6,
    ratingCount: 15,
    uploaderId: ALEX.id,
    uploader: ALEX,
    votes: 89,
    weekKey: W,
    createdAt: '2022-08-17T00:00:00Z',
  },
  {
    id: 'f13',
    title: 'Muted',
    description: 'A deaf sound engineer starts hearing something in the recordings she makes at abandoned sites.',
    thumbnailUrl: 'https://picsum.photos/seed/muted-horror/400/500',
    videoUrl: V.ed,
    trailerUrl: V.sub,
    aspectRatio: '4:5',
    genre: ['Horror'],
    runtime: 7,
    year: 2024,
    rating: 4.5,
    ratingCount: 47,
    uploaderId: OMAR.id,
    uploader: OMAR,
    votes: 264,
    weekKey: W,
    createdAt: '2024-01-12T00:00:00Z',
  },
  {
    id: 'f14',
    title: 'Bloom',
    description: 'A florist accidentally delivers a bouquet to the wrong address every day for a week — and keeps going back.',
    thumbnailUrl: 'https://picsum.photos/seed/bloom-comedy/400/600',
    videoUrl: V.bbb,
    aspectRatio: '2:3',
    genre: ['Comedy'],
    runtime: 11,
    year: 2023,
    rating: 4.0,
    ratingCount: 22,
    uploaderId: LAYLA.id,
    uploader: LAYLA,
    votes: 133,
    weekKey: W,
    createdAt: '2023-10-30T00:00:00Z',
  },
]

// ─── Internal helpers ────────────────────────────────────────────────────────

function _refreshFotw(): void {
  const weekKey = getCurrentWeekKey()
  let prevWinner: string | null = null
  try {
    prevWinner = localStorage.getItem('cima_fotw_prev_winner')
  } catch { /* ignore */ }

  const eligible = films.filter((f) => f.weekKey === weekKey && f.id !== prevWinner)
  if (eligible.length === 0) return

  const sorted = [...eligible].sort((a, b) => {
    const vd = (b.votes ?? 0) - (a.votes ?? 0)
    return vd !== 0 ? vd : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  films.forEach((f) => { f.isFilmOfTheWeek = false })
  sorted[0].isFilmOfTheWeek = true
}

// ─── Public helpers ────────────────────────────────────────────────────────

export function getFilms(): Film[] {
  return films
}

export function getFilmById(id: string): Film | undefined {
  return films.find((f) => f.id === id)
}

export function getFilmOfTheWeek(): Film {
  const weekKey = getCurrentWeekKey()
  let prevWinner: string | null = null
  try {
    prevWinner = localStorage.getItem('cima_fotw_prev_winner')
  } catch { /* ignore */ }

  const eligible = films.filter((f) => f.weekKey === weekKey && f.id !== prevWinner)
  if (eligible.length === 0) return films.find((f) => f.isFilmOfTheWeek) ?? films[0]

  const sorted = [...eligible].sort((a, b) => {
    const vd = (b.votes ?? 0) - (a.votes ?? 0)
    return vd !== 0 ? vd : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
  return sorted[0]
}

export function getWeeklyVoteLeaderboard(): Film[] {
  const weekKey = getCurrentWeekKey()
  return [...films]
    .filter((f) => f.weekKey === weekKey)
    .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))
}

export function voteForFilm(
  filmId: string,
  userId: string,
): { success: boolean; film?: Film; error?: 'already_voted_this_film' | 'already_voted_other_film' | 'film_not_found' } {
  const existing = getUserVoteThisWeek(userId)
  if (existing === filmId) return { success: false, error: 'already_voted_this_film' }
  if (existing !== null) return { success: false, error: 'already_voted_other_film' }

  const film = films.find((f) => f.id === filmId)
  if (!film) return { success: false, error: 'film_not_found' }

  film.votes = (film.votes ?? 0) + 1
  setUserVote(userId, filmId)
  _refreshFotw()

  return { success: true, film: { ...film } }
}

export function addFilm(film: Omit<Film, 'id' | 'createdAt'>): Film {
  const newFilm: Film = {
    votes: 0,
    weekKey: getCurrentWeekKey(),
    isFilmOfTheWeek: false,
    ...film,
    id: `f${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
  films = [newFilm, ...films]
  return newFilm
}

export function getUserById(id: string): User | undefined {
  if (id === 'me') return ALL_USERS[0]
  return ALL_USERS.find((u) => u.id === id)
}

export function authenticateUser(email: string, password: string): User | null {
  const normalised = email.toLowerCase().trim()
  if (normalised === 'demo@cima.film'    && password === PASSWORDS[normalised]) return ALEX
  if (normalised === 'viewer@cima.film'  && password === PASSWORDS[normalised]) return LEGACY_USERS['viewer@cima.film'] ?? null
  if (normalised === 'alex@cimafilms.com' && password === PASSWORDS[normalised]) return ALEX
  if (normalised === 'sara@cimafilms.com' && password === PASSWORDS[normalised]) return SARA
  const legacyPw = PASSWORDS[normalised]
  if (legacyPw && legacyPw === password) return LEGACY_USERS[normalised] ?? null
  return null
}
