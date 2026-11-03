import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Wordmark } from './primitives'

interface AuthFrameProps {
  mode: 'in' | 'up'
  eyebrow: string
  heading: string
  children: React.ReactNode
}

// Shared shell for Sign in / Create account: back to Welcome, wordmark,
// a big line, and a two-way switch between the modes.
export default function AuthFrame({ mode, eyebrow, heading, children }: AuthFrameProps) {
  return (
    <div className="h-full scroll-container bg-background">
      <div className="min-h-full max-w-md mx-auto px-4 pt-4 pb-8 flex flex-col">
        <header className="flex items-center justify-between">
          <Link to="/welcome" aria-label="Back" className="w-11 h-11 flex items-center justify-center border-[1.5px] border-foreground press">
            <ArrowLeft size={20} aria-hidden="true" />
          </Link>
          <Wordmark size="sm" />
          <span className="w-11" />
        </header>

        <div className="pt-6 flex flex-col gap-1">
          <span className="k-label text-[11px] text-hot font-semibold">{eyebrow}</span>
          <h1 className="k-display text-[34px]" style={{ fontStretch: '120%' }}>{heading}</h1>
        </div>

        <nav aria-label="Account" className="grid grid-cols-2 mt-5 border-[1.5px] border-foreground">
          {(['in', 'up'] as const).map((m) => (
            <Link
              key={m}
              to={m === 'in' ? '/login' : '/register'}
              aria-current={mode === m ? 'page' : undefined}
              className={cn(
                'min-h-[44px] flex items-center justify-center font-extrabold text-[13px]',
                mode === m ? 'bg-solid text-solid-foreground' : 'hover:bg-foreground/5',
              )}
              style={{ fontStretch: '110%' }}
            >
              {m === 'in' ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </Link>
          ))}
        </nav>

        {children}
      </div>
    </div>
  )
}

export function FormError({ message }: { message: string }) {
  return (
    <div role="alert" className="border-[1.5px] border-hot bg-hot/10 text-hot px-3 py-2.5 k-label text-[11px] font-semibold">
      {message}
    </div>
  )
}
