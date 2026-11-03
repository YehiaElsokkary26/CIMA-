import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

/* ─── Clapperboard stripe ───────────────────────────────────────────────── */

interface ClapProps {
  /** theme: follows light/dark · live: mustard, for "something is happening" · fixed: ink/paper */
  variant?: 'theme' | 'live' | 'fixed'
  className?: string
}

export function Clap({ variant = 'theme', className }: ClapProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        variant === 'theme' && 'clap',
        variant === 'live' && 'clap-live',
        variant === 'fixed' && 'clap-fixed',
        'h-2',
        className,
      )}
    />
  )
}

/* ─── Slate: a row of labelled cells like the bottom of a clapperboard ──── */

export interface SlateCell {
  label: string
  value: React.ReactNode
}

interface SlateProps {
  cells: SlateCell[]
  className?: string
  /** border colour class for the cell dividers */
  lineClass?: string
  valueClassName?: string
}

export function Slate({ cells, className, lineClass = 'border-foreground', valueClassName }: SlateProps) {
  return (
    <div
      className={cn('grid', className)}
      style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}
    >
      {cells.map((c, i) => (
        <div
          key={c.label}
          className={cn('slate-cell min-w-0', i < cells.length - 1 && 'border-e-[1.5px]', lineClass)}
        >
          {c.label}
          <b className={valueClassName}>{c.value}</b>
        </div>
      ))}
    </div>
  )
}

/* ─── Wordmark ──────────────────────────────────────────────────────────── */

interface WordmarkProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Colour of the Arabic half */
  arClassName?: string
}

const WORD_SIZES = {
  sm: { en: 'text-[20px]', ar: 'text-[18px]', bar: 'h-[6px] w-[86px]' },
  md: { en: 'text-[26px]', ar: 'text-[22px]', bar: 'h-[7px] w-[112px]' },
  lg: { en: 'text-[64px]', ar: 'text-[50px]', bar: 'h-[12px] w-[260px]' },
}

export function Wordmark({ size = 'md', className, arClassName = 'text-hot' }: WordmarkProps) {
  const s = WORD_SIZES[size]
  return (
    <div className={cn('flex flex-col gap-[3px]', className)}>
      <div className={cn('clap', s.bar)} aria-hidden="true" />
      <div className="flex items-baseline gap-2">
        <span className={cn('k-display leading-none', s.en)}>KLAKET</span>
        <span lang="ar" className={cn('k-poster leading-none', s.ar, arClassName)}>
          كلاكيت
        </span>
      </div>
    </div>
  )
}

/* ─── Hand-drawn china-marker circle, the vote mark ─────────────────────── */

export function VoteCircle({ className, animate = true }: { className?: string; animate?: boolean }) {
  return (
    <svg
      viewBox="0 0 160 150"
      preserveAspectRatio="none"
      className={cn('pointer-events-none absolute', className)}
      aria-hidden="true"
    >
      <path
        d="M28 18 C 70 0, 140 2, 152 40 C 162 82, 128 140, 76 138 C 26 136, 4 100, 8 62 C 11 36, 34 18, 62 12"
        fill="none"
        stroke="#E5382B"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="520"
        className={animate ? 'animate-circle-draw' : undefined}
        style={animate ? { strokeDashoffset: 520 } : undefined}
      />
    </svg>
  )
}

/* ─── Section header: big expanded title + mono action link ─────────────── */

interface SectionHeaderProps {
  title: string
  action?: { to: string; label: string }
  meta?: string
  className?: string
}

export function SectionHeader({ title, action, meta, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-baseline justify-between gap-3 border-b-[1.5px] border-foreground pb-1.5', className)}>
      <h2 className="k-display text-[21px] sm:text-[24px]" style={{ fontStretch: '110%' }}>
        {title}
      </h2>
      {action ? (
        <Link to={action.to} className="k-label text-[11px] font-semibold hover:text-hot shrink-0">
          {action.label}
        </Link>
      ) : meta ? (
        <span className="k-label text-[11px] text-muted-foreground shrink-0">{meta}</span>
      ) : null}
    </div>
  )
}

/* ─── Page title: English expanded + Arabic poster lettering ────────────── */

interface PageTitleProps {
  en: string
  ar: string
  sub?: string
  className?: string
}

export function PageTitle({ en, ar, sub, className }: PageTitleProps) {
  return (
    <header className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="k-display text-[30px] sm:text-[38px]">{en}</h1>
        <span lang="ar" className="k-poster text-[26px] sm:text-[32px] text-hot">
          {ar}
        </span>
      </div>
      {sub && <p className="text-[14px] text-muted-foreground max-w-[60ch]">{sub}</p>}
    </header>
  )
}

/* ─── Band: full-width mono strip (week band, filters bar) ──────────────── */

export function Band({
  left,
  right,
  tone = 'live',
  className,
}: {
  left: React.ReactNode
  right?: React.ReactNode
  tone?: 'live' | 'solid'
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-2 k-label text-[11px] border-y-[1.5px] border-foreground',
        tone === 'live' ? 'bg-k-mustard text-k-ink' : 'bg-solid text-solid-foreground',
        className,
      )}
    >
      <span className="font-semibold truncate">{left}</span>
      {right && <span className="shrink-0">{right}</span>}
    </div>
  )
}
