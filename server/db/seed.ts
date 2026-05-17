/**
 * Seeds the Supabase database with demo users and sample films.
 *
 * Usage (from inside /server):
 *   npm run seed
 *
 * What it does:
 *   1. Creates users in Supabase Auth via the Admin API (email_confirm = true, password = "password")
 *   2. Updates their auto-created profile rows with bio, school, city, etc.
 *   3. Inserts films, ratings, reviews, cima members, and notifications.
 *
 * Safe to re-run — existing users are detected and skipped.
 */

import { pool, supabaseAdmin } from './index'

// ---- Demo user data ---------------------------------------------------------
// Passwords are all "password" — never use this in production!

const USERS = [
  { name: 'Demo Filmmaker', email: 'demo@cima.film',   role: 'filmmaker', bio: 'Demo filmmaker account. Use this to test the full Cima experience.',        school: 'ESAV Marrakech',                   city: 'Casablanca', looking: true,  top_genre: 'Experimental' },
  { name: 'Demo Viewer',    email: 'viewer@cima.film', role: 'viewer',    bio: 'Demo viewer account. Browse films and leave reviews.',                       school: null,                               city: null,         looking: false, top_genre: null },
  { name: 'Fatima El-Riad', email: 'fatima@cima.film', role: 'filmmaker', bio: 'Drama and short fiction. Tangier-based.',                                    school: 'ESAV Marrakech',                   city: 'Tangier',    looking: true,  top_genre: 'Drama' },
  { name: 'Karim Nassar',   email: 'karim@cima.film',  role: 'filmmaker', bio: 'Neo-noir and thriller. Nocturnal filmmaker.',                                 school: 'ALBA Beirut',                      city: 'Beirut',     looking: true,  top_genre: 'Neo-Noir' },
  { name: 'Sana Younis',    email: 'sana@cima.film',   role: 'filmmaker', bio: 'Romance and pastoral shorts.',                                               school: 'Higher Institute of Cinema, Cairo', city: 'Cairo',      looking: false, top_genre: 'Romance' },
  { name: 'Omar Hadid',     email: 'omar@cima.film',   role: 'filmmaker', bio: 'Documentary and experimental filmmaker. Obsessed with sound design.',         school: 'ESAV Marrakech',                   city: 'Casablanca', looking: true,  top_genre: 'Experimental' },
  { name: 'Leila Bouri',    email: 'leila@cima.film',  role: 'filmmaker', bio: 'Observational documentary. Real people, real moments.',                      school: 'EDAC Tunis',                       city: 'Tunis',      looking: false, top_genre: 'Documentary' },
  { name: 'Yusuf Al-Amin',  email: 'yusuf@cima.film',  role: 'filmmaker', bio: 'Drama shorts. Urban stories.',                                               school: 'HFF München',                      city: 'Munich',     looking: true,  top_genre: 'Drama' },
]

// ---- Film data (references uploader by email, resolved at runtime) ----------
const FILMS_DATA = [
  {
    uploaderEmail: 'fatima@cima.film',
    title: 'SALT AND SHADOW',
    description: 'A fisherman confronts his past on a foggy Moroccan coast. Shot over three days in Essaouira during winter, the film explores grief and the sea as a metaphor for memory.',
    genre: ['Drama', 'Short'], runtime_min: 24, release_year: 2024,
    thumbnail_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
  },
  {
    uploaderEmail: 'karim@cima.film',
    title: 'NEON ELEGY',
    description: 'A night cab driver witnesses something impossible. A neo-noir short that never shows its monster — only its shadow.',
    genre: ['Neo-Noir', 'Thriller'], runtime_min: 18, release_year: 2024,
    thumbnail_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
  },
  {
    uploaderEmail: 'sana@cima.film',
    title: 'GOLDEN HOUR',
    description: 'Two strangers meet on the last train out of town. A romance told in the last 12 minutes of daylight.',
    genre: ['Romance', 'Short'], runtime_min: 12, release_year: 2024,
    thumbnail_url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80',
  },
  {
    uploaderEmail: 'omar@cima.film',
    title: 'STATIC',
    description: 'A radio technician picks up a signal from 1986. What begins as a technical glitch spirals into a haunting encounter with a voice that knows too much. Shot entirely on location in a decommissioned broadcasting tower.',
    genre: ['Sci-Fi', 'Experimental'], runtime_min: 31, release_year: 2023,
    thumbnail_url: 'https://images.unsplash.com/photo-1585676623595-e7cb4792a3e0?w=800&q=80',
    featured: true,
  },
  {
    uploaderEmail: 'leila@cima.film',
    title: 'THE WEIGHT OF GRAIN',
    description: 'A documentary portrait of a Syrian bread baker living in exile in Marseille. Three years in the making.',
    genre: ['Documentary'], runtime_min: 47, release_year: 2024,
    thumbnail_url: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=800&q=80',
  },
  {
    uploaderEmail: 'yusuf@cima.film',
    title: 'COPPER CITY',
    description: 'Graffiti artists race to finish a mural before dawn. A love letter to street art and the city that wants to erase it.',
    genre: ['Drama', 'Short'], runtime_min: 15, release_year: 2024,
    thumbnail_url: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=800&q=80',
  },
  {
    uploaderEmail: 'omar@cima.film',
    title: 'DUST AND WIRE',
    description: 'A long-form observational documentary about two brothers who repair telegraph poles in the Sahara.',
    genre: ['Documentary'], runtime_min: 54, release_year: 2022,
    thumbnail_url: 'https://images.unsplash.com/photo-1571847140471-1d7766e825ea?w=800&q=80',
  },
]

// ---- Main seed function -----------------------------------------------------

async function seed() {
  console.log('🌱  Seeding Cima database via Supabase Admin…\n')

  // 1. Create / find users in Supabase Auth
  const emailToId: Record<string, string> = {}

  // Fetch existing users from Supabase Auth so we can skip them
  const { data: existingList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  for (const eu of existingList?.users ?? []) {
    if (eu.email) emailToId[eu.email] = eu.id
  }

  for (const u of USERS) {
    if (emailToId[u.email]) {
      console.log(`  → ${u.email} already exists (${emailToId[u.email].slice(0, 8)}…)`)
      continue
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email:         u.email,
      password:      'password',
      email_confirm: true,
      user_metadata: { name: u.name, role: u.role },
    })

    if (error) {
      console.error(`  ✗ Failed to create ${u.email}:`, error.message)
      continue
    }

    emailToId[u.email] = data.user.id
    console.log(`  ✓ Created ${u.email} (${data.user.id.slice(0, 8)}…)`)
  }

  // Small pause for the trigger to fire on all newly created users
  await new Promise((r) => setTimeout(r, 600))

  // 2. Update profiles with extra fields
  for (const u of USERS) {
    const id = emailToId[u.email]
    if (!id) continue
    await pool.query(
      `INSERT INTO profiles (id, name, email, role, bio, school, city, looking_for_collaborators, top_genre)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO UPDATE SET
         name                      = EXCLUDED.name,
         email                     = EXCLUDED.email,
         role                      = EXCLUDED.role,
         bio                       = EXCLUDED.bio,
         school                    = EXCLUDED.school,
         city                      = EXCLUDED.city,
         looking_for_collaborators = EXCLUDED.looking_for_collaborators,
         top_genre                 = EXCLUDED.top_genre,
         updated_at                = NOW()`,
      [id, u.name, u.email, u.role, u.bio, u.school, u.city, u.looking, u.top_genre]
    )
  }
  console.log(`\n  ✓ ${USERS.length} profiles updated`)

  // 3. Insert films
  const filmIds: Record<string, string> = {} // title → id
  let featuredFilmId: string | null = null

  for (const f of FILMS_DATA) {
    const uploaderId = emailToId[f.uploaderEmail]
    if (!uploaderId) { console.warn(`  ✗ Uploader ${f.uploaderEmail} not found, skipping "${f.title}"`); continue }

    const res = await pool.query<{ id: string }>(
      `INSERT INTO films (title, description, genre, runtime_min, release_year, uploader_id, thumbnail_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [f.title, f.description, f.genre, f.runtime_min, f.release_year, uploaderId, f.thumbnail_url]
    )

    const id = res.rows[0]?.id
    if (id) {
      filmIds[f.title] = id
      if ((f as any).featured) featuredFilmId = id
    } else {
      // Already exists — fetch its id
      const existing = await pool.query<{ id: string }>('SELECT id FROM films WHERE title=$1 AND uploader_id=$2', [f.title, uploaderId])
      if (existing.rows[0]) {
        filmIds[f.title] = existing.rows[0].id
        if ((f as any).featured) featuredFilmId = existing.rows[0].id
      }
    }
  }
  console.log(`  ✓ ${FILMS_DATA.length} films processed`)

  // 4. Featured film of the week
  if (featuredFilmId) {
    await pool.query(
      `INSERT INTO featured_films (film_id, week_start)
       VALUES ($1, date_trunc('week', CURRENT_DATE)::date)
       ON CONFLICT (week_start) DO NOTHING`,
      [featuredFilmId]
    )
    console.log('  ✓ Film of the week set (STATIC)')
  }

  // 5. Ratings
  const RATINGS = [
    { film: 'STATIC',         raterEmail: 'viewer@cima.film', rating: 5 },
    { film: 'STATIC',         raterEmail: 'fatima@cima.film', rating: 4 },
    { film: 'STATIC',         raterEmail: 'sana@cima.film',   rating: 5 },
    { film: 'SALT AND SHADOW', raterEmail: 'viewer@cima.film', rating: 4 },
    { film: 'NEON ELEGY',     raterEmail: 'viewer@cima.film', rating: 5 },
    { film: 'THE WEIGHT OF GRAIN', raterEmail: 'viewer@cima.film', rating: 4 },
  ]
  let ratingCount = 0
  for (const r of RATINGS) {
    const filmId  = filmIds[r.film]
    const userId  = emailToId[r.raterEmail]
    if (!filmId || !userId) continue
    await pool.query(
      `INSERT INTO ratings (film_id, user_id, rating) VALUES ($1,$2,$3) ON CONFLICT (film_id, user_id) DO NOTHING`,
      [filmId, userId, r.rating]
    )
    ratingCount++
  }
  console.log(`  ✓ ${ratingCount} ratings`)

  // 6. Reviews
  const REVIEWS = [
    { film: 'STATIC', raterEmail: 'fatima@cima.film', rating: 5, body: "One of the most atmospheric short films I've seen this year. The sound design is extraordinary — every crackle and hiss feels intentional. The ending left me genuinely unsettled." },
    { film: 'STATIC', raterEmail: 'karim@cima.film',  rating: 4, body: "The visual language is confident and assured. Hadid knows exactly when to hold a shot. My only critique is the pacing in the middle act drags slightly — but the final ten minutes are worth every second." },
    { film: 'STATIC', raterEmail: 'sana@cima.film',   rating: 5, body: "Shot on 16mm if I'm not mistaken. The grain alone makes this worth watching. A genuinely original voice emerging from North African cinema." },
    { film: 'SALT AND SHADOW', raterEmail: 'viewer@cima.film', rating: 4, body: 'Beautiful cinematography. The fog scenes remind me of early Tarkovsky — you feel the cold through the screen.' },
  ]
  let reviewCount = 0
  for (const r of REVIEWS) {
    const filmId = filmIds[r.film]
    const userId = emailToId[r.raterEmail]
    if (!filmId || !userId) continue
    await pool.query(
      `INSERT INTO reviews (film_id, user_id, rating, body)
       SELECT $1,$2,$3,$4
       WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE film_id=$1 AND user_id=$2)`,
      [filmId, userId, r.rating, r.body]
    )
    reviewCount++
  }
  console.log(`  ✓ ${reviewCount} reviews`)

  // 7. Demo cima circle for the Demo Filmmaker
  const demoId   = emailToId['demo@cima.film']
  const fatimaId = emailToId['fatima@cima.film']
  const karimId  = emailToId['karim@cima.film']
  const sanaId   = emailToId['sana@cima.film']
  if (demoId && fatimaId && karimId && sanaId) {
    for (const memberId of [fatimaId, karimId, sanaId]) {
      await pool.query(
        `INSERT INTO cima_members (owner_id, member_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [demoId, memberId]
      )
    }
    console.log('  ✓ Cima circle seeded (3 members for demo@cima.film)')
  }

  // 8. Demo notifications
  if (demoId && fatimaId && karimId) {
    const staticId = filmIds['STATIC']
    const notifs = [
      [demoId, 'review',        'Fatima El-Riad left a review on STATIC',            fatimaId, staticId ?? null],
      [demoId, 'cima_request',  'Yasmine wants to join your Cima',                   sanaId ?? null, null],
      [demoId, 'rating',        'Karim Nassar rated STATIC 5 stars',                 karimId, staticId ?? null],
      [demoId, 'cima_accepted', 'Omar Hadid accepted your Cima request',             emailToId['omar@cima.film'] ?? null, null],
    ]
    for (const [uid, type, msg, from, film] of notifs) {
      if (!uid) continue
      await pool.query(
        `INSERT INTO notifications (user_id, type, message, from_user_id, film_id) VALUES ($1,$2,$3,$4,$5)`,
        [uid, type, msg, from, film]
      )
    }
    console.log('  ✓ Demo notifications')
  }

  console.log('\n🎬  Seed complete!\n')
  console.log('   Filmmaker: demo@cima.film   / password')
  console.log('   Viewer:    viewer@cima.film / password\n')
  await pool.end()
}

seed().catch((err) => {
  console.error('\n✗ Seed failed:', err.message)
  process.exit(1)
})
