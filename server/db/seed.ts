/**
 * Seeds the database with demo users and films.
 * Usage: npm run seed  (from inside /server)
 * Safe to re-run — uses ON CONFLICT DO NOTHING.
 */
import bcrypt from 'bcryptjs'
import { pool } from './index'

const HASH = bcrypt.hashSync('password', 10)

const USERS = [
  { id: 'a1b2c3d4-0001-0001-0001-000000000001', name: 'Demo Filmmaker', email: 'demo@cima.film',   role: 'filmmaker', bio: 'Demo filmmaker account. Use this to test the full Cima experience.',  school: 'ESAV Marrakech',                  city: 'Casablanca', looking: true,  top_genre: 'Experimental' },
  { id: 'a1b2c3d4-0002-0002-0002-000000000002', name: 'Demo Viewer',    email: 'viewer@cima.film', role: 'viewer',    bio: 'Demo viewer account. Browse films and leave reviews.',              school: null,                              city: null,         looking: false, top_genre: null },
  { id: 'a1b2c3d4-0003-0003-0003-000000000003', name: 'Fatima El-Riad', email: 'fatima@cima.film', role: 'filmmaker', bio: 'Drama and short fiction. Tangier-based.',                           school: 'ESAV Marrakech',                  city: 'Tangier',    looking: true,  top_genre: 'Drama' },
  { id: 'a1b2c3d4-0004-0004-0004-000000000004', name: 'Karim Nassar',   email: 'karim@cima.film',  role: 'filmmaker', bio: 'Neo-noir and thriller. Nocturnal filmmaker.',                        school: 'ALBA Beirut',                     city: 'Beirut',     looking: true,  top_genre: 'Neo-Noir' },
  { id: 'a1b2c3d4-0005-0005-0005-000000000005', name: 'Sana Younis',    email: 'sana@cima.film',   role: 'filmmaker', bio: 'Romance and pastoral shorts.',                                      school: 'Higher Institute of Cinema, Cairo', city: 'Cairo',    looking: false, top_genre: 'Romance' },
  { id: 'a1b2c3d4-0006-0006-0006-000000000006', name: 'Omar Hadid',     email: 'omar@cima.film',   role: 'filmmaker', bio: 'Documentary and experimental filmmaker. Obsessed with sound design.', school: 'ESAV Marrakech',                 city: 'Casablanca', looking: true,  top_genre: 'Experimental' },
  { id: 'a1b2c3d4-0007-0007-0007-000000000007', name: 'Leila Bouri',    email: 'leila@cima.film',  role: 'filmmaker', bio: 'Observational documentary. Real people, real moments.',               school: 'EDAC Tunis',                     city: 'Tunis',      looking: false, top_genre: 'Documentary' },
  { id: 'a1b2c3d4-0008-0008-0008-000000000008', name: 'Yusuf Al-Amin',  email: 'yusuf@cima.film',  role: 'filmmaker', bio: 'Drama shorts. Urban stories.',                                        school: 'HFF München',                    city: 'Munich',     looking: true,  top_genre: 'Drama' },
]

const FILMS = [
  {
    id: 'f1000001-0001-0001-0001-000000000001',
    title: 'SALT AND SHADOW',
    description: 'A fisherman confronts his past on a foggy Moroccan coast. Shot over three days in Essaouira during winter, the film explores grief and the sea as a metaphor for memory.',
    genre: ['Drama', 'Short'],
    runtime_min: 24, release_year: 2024,
    uploader_id: 'a1b2c3d4-0003-0003-0003-000000000003',
    thumbnail_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
  },
  {
    id: 'f1000002-0002-0002-0002-000000000002',
    title: 'NEON ELEGY',
    description: 'A night cab driver witnesses something impossible. A neo-noir short that never shows its monster — only its shadow.',
    genre: ['Neo-Noir', 'Thriller'],
    runtime_min: 18, release_year: 2024,
    uploader_id: 'a1b2c3d4-0004-0004-0004-000000000004',
    thumbnail_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
  },
  {
    id: 'f1000003-0003-0003-0003-000000000003',
    title: 'GOLDEN HOUR',
    description: 'Two strangers meet on the last train out of town. A romance told in the last 12 minutes of daylight.',
    genre: ['Romance', 'Short'],
    runtime_min: 12, release_year: 2024,
    uploader_id: 'a1b2c3d4-0005-0005-0005-000000000005',
    thumbnail_url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80',
  },
  {
    id: 'f1000004-0004-0004-0004-000000000004',
    title: 'STATIC',
    description: 'A radio technician picks up a signal from 1986. What begins as a technical glitch spirals into a haunting encounter with a voice that knows too much. Shot entirely on location in a decommissioned broadcasting tower in rural Morocco, STATIC is a lo-fi meditation on memory, loss, and the frequencies we leave behind.',
    genre: ['Sci-Fi', 'Experimental'],
    runtime_min: 31, release_year: 2023,
    uploader_id: 'a1b2c3d4-0006-0006-0006-000000000006',
    thumbnail_url: 'https://images.unsplash.com/photo-1585676623595-e7cb4792a3e0?w=800&q=80',
  },
  {
    id: 'f1000005-0005-0005-0005-000000000005',
    title: 'THE WEIGHT OF GRAIN',
    description: 'A documentary portrait of a Syrian bread baker living in exile in Marseille. Three years in the making.',
    genre: ['Documentary'],
    runtime_min: 47, release_year: 2024,
    uploader_id: 'a1b2c3d4-0007-0007-0007-000000000007',
    thumbnail_url: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=800&q=80',
  },
  {
    id: 'f1000006-0006-0006-0006-000000000006',
    title: 'COPPER CITY',
    description: 'Graffiti artists race to finish a mural before dawn. A love letter to street art and the city that wants to erase it.',
    genre: ['Drama', 'Short'],
    runtime_min: 15, release_year: 2024,
    uploader_id: 'a1b2c3d4-0008-0008-0008-000000000008',
    thumbnail_url: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=800&q=80',
  },
  {
    id: 'f1000007-0007-0007-0007-000000000007',
    title: 'DUST AND WIRE',
    description: 'A long-form observational documentary about two brothers who repair telegraph poles in the Sahara.',
    genre: ['Documentary'],
    runtime_min: 54, release_year: 2022,
    uploader_id: 'a1b2c3d4-0006-0006-0006-000000000006',
    thumbnail_url: 'https://images.unsplash.com/photo-1571847140471-1d7766e825ea?w=800&q=80',
  },
]

const RATINGS = [
  { film_id: 'f1000004-0004-0004-0004-000000000004', user_id: 'a1b2c3d4-0002-0002-0002-000000000002', rating: 5 },
  { film_id: 'f1000004-0004-0004-0004-000000000004', user_id: 'a1b2c3d4-0003-0003-0003-000000000003', rating: 4 },
  { film_id: 'f1000004-0004-0004-0004-000000000004', user_id: 'a1b2c3d4-0005-0005-0005-000000000005', rating: 5 },
  { film_id: 'f1000001-0001-0001-0001-000000000001', user_id: 'a1b2c3d4-0002-0002-0002-000000000002', rating: 4 },
  { film_id: 'f1000002-0002-0002-0002-000000000002', user_id: 'a1b2c3d4-0002-0002-0002-000000000002', rating: 5 },
  { film_id: 'f1000005-0005-0005-0005-000000000005', user_id: 'a1b2c3d4-0002-0002-0002-000000000002', rating: 4 },
]

const REVIEWS = [
  { film_id: 'f1000004-0004-0004-0004-000000000004', user_id: 'a1b2c3d4-0003-0003-0003-000000000003', rating: 5, body: "One of the most atmospheric short films I've seen this year. The sound design is extraordinary — every crackle and hiss feels intentional. The ending left me genuinely unsettled." },
  { film_id: 'f1000004-0004-0004-0004-000000000004', user_id: 'a1b2c3d4-0004-0004-0004-000000000004', rating: 4, body: "The visual language is confident and assured. Hadid knows exactly when to hold a shot. My only critique is the pacing in the middle act drags slightly — but the final ten minutes are worth every second." },
  { film_id: 'f1000004-0004-0004-0004-000000000004', user_id: 'a1b2c3d4-0005-0005-0005-000000000005', rating: 5, body: "Shot on 16mm if I'm not mistaken. The grain alone makes this worth watching. A genuinely original voice emerging from North African cinema." },
  { film_id: 'f1000001-0001-0001-0001-000000000001', user_id: 'a1b2c3d4-0002-0002-0002-000000000002', rating: 4, body: 'Beautiful cinematography. The fog scenes remind me of early Tarkovsky — you feel the cold through the screen.' },
]

async function seed() {
  console.log('🌱  Seeding database…')

  // Users
  for (const u of USERS) {
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role, bio, school, city, looking_for_collaborators, top_genre)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (email) DO NOTHING`,
      [u.id, u.name, u.email, HASH, u.role, u.bio, u.school, u.city, u.looking, u.top_genre]
    )
  }
  console.log(`  ✓ ${USERS.length} users`)

  // Films
  for (const f of FILMS) {
    await pool.query(
      `INSERT INTO films (id, title, description, genre, runtime_min, release_year, uploader_id, thumbnail_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id) DO NOTHING`,
      [f.id, f.title, f.description, f.genre, f.runtime_min, f.release_year, f.uploader_id, f.thumbnail_url]
    )
  }
  console.log(`  ✓ ${FILMS.length} films`)

  // Featured film of the week
  await pool.query(
    `INSERT INTO featured_films (film_id, week_start)
     VALUES ($1, date_trunc('week', CURRENT_DATE)::date)
     ON CONFLICT (week_start) DO NOTHING`,
    ['f1000004-0004-0004-0004-000000000004']
  )
  console.log('  ✓ Film of the week set')

  // Ratings
  for (const r of RATINGS) {
    await pool.query(
      `INSERT INTO ratings (film_id, user_id, rating)
       VALUES ($1,$2,$3)
       ON CONFLICT (film_id, user_id) DO NOTHING`,
      [r.film_id, r.user_id, r.rating]
    )
  }
  console.log(`  ✓ ${RATINGS.length} ratings`)

  // Reviews
  for (const r of REVIEWS) {
    await pool.query(
      `INSERT INTO reviews (film_id, user_id, rating, body)
       SELECT $1,$2,$3,$4
       WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE film_id=$1 AND user_id=$2)`,
      [r.film_id, r.user_id, r.rating, r.body]
    )
  }
  console.log(`  ✓ ${REVIEWS.length} reviews`)

  // Demo cima members
  await pool.query(
    `INSERT INTO cima_members (owner_id, member_id)
     VALUES ($1,$2),($1,$3),($1,$4)
     ON CONFLICT DO NOTHING`,
    [
      'a1b2c3d4-0001-0001-0001-000000000001',
      'a1b2c3d4-0003-0003-0003-000000000003',
      'a1b2c3d4-0004-0004-0004-000000000004',
      'a1b2c3d4-0005-0005-0005-000000000005',
    ]
  )
  console.log('  ✓ Cima members')

  // Demo notifications
  const notifs = [
    ['a1b2c3d4-0001-0001-0001-000000000001', 'review',       'Fatima El-Riad left a review on STATIC',         'a1b2c3d4-0003-0003-0003-000000000003', 'f1000004-0004-0004-0004-000000000004'],
    ['a1b2c3d4-0001-0001-0001-000000000001', 'cima_request', 'Yasmine wants to join your Cima',                 'a1b2c3d4-0005-0005-0005-000000000005', null],
    ['a1b2c3d4-0001-0001-0001-000000000001', 'rating',       'Karim Nassar rated STATIC 5 stars',               'a1b2c3d4-0004-0004-0004-000000000004', 'f1000004-0004-0004-0004-000000000004'],
    ['a1b2c3d4-0001-0001-0001-000000000001', 'cima_accepted','Omar Hadid accepted your Cima request',           'a1b2c3d4-0006-0006-0006-000000000006', null],
    ['a1b2c3d4-0001-0001-0001-000000000001', 'follower',     'Sofia is now following your work',                null,                                       null],
  ]

  for (const [uid, type, msg, from, film] of notifs) {
    await pool.query(
      `INSERT INTO notifications (user_id, type, message, from_user_id, film_id)
       VALUES ($1,$2,$3,$4,$5)`,
      [uid, type, msg, from, film]
    )
  }
  console.log(`  ✓ ${notifs.length} notifications`)

  console.log('\n🎬  Seed complete! Demo credentials:')
  console.log('   Filmmaker: demo@cima.film   / password')
  console.log('   Viewer:    viewer@cima.film / password\n')
  await pool.end()
}

seed().catch((err) => { console.error(err); process.exit(1) })
