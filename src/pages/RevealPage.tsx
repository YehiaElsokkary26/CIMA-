import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { useFeaturedFilm, useFilms } from '@/hooks/useFilms'
import { getFilmOfTheWeek, getFilms } from '@/lib/mockData'
import { timecode, weekNumber } from '@/lib/klaket'
import type { Film } from '@/types'
import { FilmStill } from '@/components/klaket/FilmCards'

type Phase = 'ready' | 'count' | 'done'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Film of the week reveal: an academy-leader countdown, then the winning poster.
export default function RevealPage() {
  const navigate = useNavigate()
  const { data: serverFeatured } = useFeaturedFilm()
  const { data: serverFilms } = useFilms()
  const winner: Film = serverFeatured ?? getFilmOfTheWeek()
  const others = (serverFilms ?? getFilms())
    .filter((f) => f.id !== winner.id && f.weekKey === winner.weekKey)
    .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))
    .slice(0, 2)

  const [phase, setPhase] = useState<Phase>('ready')
  const [n, setN] = useState(3)
  const [sweep, setSweep] = useState(0)
  const timer = useRef<number>()

  useEffect(() => () => window.clearInterval(timer.current), [])

  const run = () => {
    window.clearInterval(timer.current)
    if (prefersReducedMotion()) {
      setPhase('done')
      return
    }
    setPhase('count')
    setN(3)
    setSweep(0)
    let num = 3
    let sw = 0
    timer.current = window.setInterval(() => {
      sw += 45
      if (sw < 360) return setSweep(sw)
      if (num > 1) {
        num -= 1
        sw = 0
        setN(num)
        setSweep(0)
        return
      }
      window.clearInterval(timer.current)
      setPhase('done')
    }, 110)
  }

  return (
    <div className="min-h-full bg-k-ink text-k-paper flex flex-col">
      <header className="flex items-center justify-between px-4 pt-4 max-w-2xl w-full mx-auto">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/home'))}
          aria-label="Close"
          className="w-11 h-11 flex items-center justify-center border-[1.5px] border-k-paper press"
        >
          <X size={20} aria-hidden="true" />
        </button>
        <span className="k-label text-[11px] text-k-mustard font-semibold">Week {weekNumber()} · Film of the week</span>
        <span className="w-11" />
      </header>

      <div className="flex-1 max-w-2xl w-full mx-auto px-4 flex flex-col" aria-live="polite">
        {phase !== 'done' ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-7 py-8">
            <div
              role="img"
              aria-label={phase === 'ready' ? 'Reveal ready to start' : `Countdown ${n}`}
              className="relative w-[260px] h-[260px] rounded-full border-[3px] border-k-paper"
              style={{ background: `conic-gradient(#3A342B 0 ${sweep}deg, transparent ${sweep}deg)` }}
            >
              <div className="absolute inset-[18px] rounded-full border-2 border-k-paper" />
              <div className="absolute left-1/2 -top-2.5 -bottom-2.5 w-0.5 -translate-x-px bg-k-paper" />
              <div className="absolute top-1/2 -left-2.5 -right-2.5 h-0.5 -translate-y-px bg-k-paper" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-black text-[110px] leading-none bg-k-ink px-2.5">
                  {phase === 'ready' ? weekNumber() : n}
                </span>
              </div>
            </div>
            <div className="text-center flex flex-col gap-1">
              <span lang="ar" className="k-poster text-[34px] text-k-mustard">مين كسب الأسبوع ده؟</span>
              <span className="text-[15px] text-k-sand">Who won this week?</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col pt-5 animate-fade-up">
            <div className="clap-fixed h-[22px] border-2 border-k-paper -rotate-[4deg] origin-bottom-left" aria-hidden="true" />
            <div className="bg-k-teal border-2 border-k-paper flex flex-col">
              <FilmStill film={winner} className="h-[280px] sm:h-[340px] border-b-2 border-k-paper" />
              <div className="p-3 flex flex-col gap-1">
                <span className="k-label text-[10.5px] text-k-mustard font-semibold">
                  ★ Winner · {(winner.votes ?? 0).toLocaleString()} votes
                </span>
                <h1 className="k-display text-[28px] sm:text-[36px] uppercase">{winner.title}</h1>
                <span className="k-label text-[10px] mt-1">
                  Dir. {winner.uploader?.name ?? 'Unknown'}
                  {winner.uploader?.school ? ` · ${winner.uploader.school}` : ''}
                  {winner.runtime ? ` · ${timecode(winner.runtime * 60).slice(3, 8)}` : ''}
                </span>
              </div>
            </div>
            {others.length > 0 && (
              <div className="grid grid-cols-2 border-[1.5px] border-k-smoke mt-3">
                {others.map((f, i) => (
                  <Link key={f.id} to={`/film/${f.id}`} className={`slate-cell text-k-sand hover:bg-white/5 ${i === 0 ? 'border-e-[1.5px] border-k-smoke' : ''}`}>
                    {i === 0 ? 'Runner-up' : 'Third'}
                    <b className="text-k-paper">{f.title}</b>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="py-5 flex flex-col gap-2">
          {phase === 'ready' && (
            <button
              type="button"
              onClick={run}
              className="press flex justify-between items-center min-h-[56px] px-4 bg-k-red text-k-paper font-black text-[17px]"
              style={{ fontStretch: '120%' }}
            >
              <span>OPEN THE ENVELOPE</span>
              <span className="k-label text-[11px] font-normal text-k-mustard">Roll it</span>
            </button>
          )}
          {phase === 'done' && (
            <>
              <Link
                to={`/film/${winner.id}`}
                className="press flex justify-between items-center min-h-[56px] px-4 bg-k-mustard text-k-ink font-black text-[17px]"
                style={{ fontStretch: '120%' }}
              >
                <span>WATCH THE WINNER</span>
                <span aria-hidden="true">▶</span>
              </Link>
              <button
                type="button"
                onClick={run}
                className="press flex justify-between items-center min-h-[52px] px-4 border-[1.5px] border-k-paper font-extrabold text-[14px]"
              >
                <span>PLAY THE REVEAL AGAIN</span>
                <span aria-hidden="true">↺</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
