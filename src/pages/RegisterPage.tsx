import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Camera, Eye, Loader2 } from 'lucide-react'
import { AccountExistsError, useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types'
import AuthFrame, { FormError } from '@/components/klaket/AuthFrame'
import { Clap } from '@/components/klaket/primitives'
import Input from '@/components/ui/Input'

const ROLES: { role: UserRole; label: string; desc: string; icon: typeof Camera }[] = [
  { role: 'filmmaker', label: 'I make films', desc: 'Upload and enter the vote', icon: Camera },
  { role: 'viewer', label: 'I watch films', desc: 'Discover, vote, leave notes', icon: Eye },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, resendConfirmation } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('viewer')
  const [error, setError] = useState('')
  const [accountExists, setAccountExists] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [resent, setResent] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setAccountExists(false)
    if (password.length < 6) {
      setError('Use at least 6 characters for your password.')
      return
    }
    try {
      const result = await register.mutateAsync({ name, email, password, role })
      if (result.status === 'confirm-email') {
        setSentTo(result.email)
        return
      }
      navigate(result.user.role ? '/home' : '/onboarding', { replace: true })
    } catch (err: unknown) {
      if (err instanceof AccountExistsError) {
        setAccountExists(true)
        setError(err.message)
        return
      }
      const msg = err instanceof Error ? err.message : ''
      setError(
        /fetch|network|failed/i.test(msg)
          ? 'Can’t reach Klaket right now. Check your connection and try again.'
          : msg || 'Couldn’t create your account. Try again.',
      )
    }
  }

  const resend = async () => {
    if (!sentTo) return
    setResent(false)
    try {
      await resendConfirmation.mutateAsync(sentTo)
      setResent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Couldn’t resend the email. Try again in a minute.')
    }
  }

  if (sentTo) {
    return (
      <AuthFrame mode="up" eyebrow="Take 01 · Almost rolling" heading="Check your inbox.">
        <section className="flex flex-col gap-3.5 pt-5" aria-live="polite">
          <div className="border-[1.5px] border-foreground bg-card">
            <Clap variant="live" className="h-2.5" />
            <div className="p-3.5 flex flex-col gap-2">
              <span className="k-label text-[10.5px] font-semibold">Confirmation sent</span>
              <p className="text-[15px]">
                We sent a link to <b className="break-all">{sentTo}</b>. Click it to confirm your account, then sign in.
              </p>
              <p className="text-[13px] text-muted-foreground">It can take a minute. Check your spam folder if you don’t see it.</p>
            </div>
          </div>
          {error && <FormError message={error} />}
          {resent && <p className="k-label text-[10.5px] text-secondary dark:text-k-mustard font-semibold" role="status">✓ Sent again</p>}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={resend}
              disabled={resendConfirmation.isPending}
              className="press min-h-[48px] border-[1.5px] border-foreground font-extrabold text-[13px] hover:bg-foreground/5 disabled:opacity-60"
            >
              {resendConfirmation.isPending ? 'SENDING…' : 'RESEND EMAIL'}
            </button>
            <Link to="/login" state={{ email: sentTo }} className="press min-h-[48px] flex items-center justify-center bg-solid text-solid-foreground font-extrabold text-[13px]">
              GO TO SIGN IN
            </Link>
          </div>
          <button type="button" onClick={() => setSentTo(null)} className="k-label text-[10.5px] underline underline-offset-4 self-start min-h-[36px]">
            Use a different email
          </button>
        </section>
      </AuthFrame>
    )
  }

  return (
    <AuthFrame mode="up" eyebrow="Take 01 · New roll" heading="Slate your name.">
      <form onSubmit={submit} className="flex flex-col gap-3.5 pt-5" noValidate>
        {error && <FormError message={error} />}
        {accountExists && (
          <Link
            to="/login"
            state={{ email }}
            className="press -mt-1.5 flex items-center justify-between min-h-[48px] px-3 bg-solid text-solid-foreground font-extrabold text-[13px]"
          >
            <span>SIGN IN AS {email.toUpperCase()}</span>
            <span aria-hidden="true">→</span>
          </Link>
        )}
        <Input label="Name on your credits" autoComplete="name" placeholder="e.g. Hana Bakkali" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Email" type="email" autoComplete="email" placeholder="you@school.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Password" type="password" autoComplete="new-password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />

        <fieldset className="flex flex-col gap-2">
          <legend className="k-label text-[10.5px] font-semibold mb-1">Which side of the camera?</legend>
          <div role="radiogroup" aria-label="Your role" className="grid grid-cols-2 gap-2">
            {ROLES.map(({ role: r, label, desc, icon: Icon }) => {
              const on = role === r
              return (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setRole(r)}
                  className={cn(
                    'press text-start border-[1.5px] border-foreground p-3 flex flex-col gap-1',
                    on ? (r === 'filmmaker' ? 'bg-k-red text-k-paper' : 'bg-k-teal text-k-paper') : 'bg-card hover:bg-muted',
                  )}
                >
                  <Icon size={18} aria-hidden="true" />
                  <b className="text-[14px]">{label}</b>
                  <span className={cn('text-[12px]', on ? 'opacity-90' : 'text-muted-foreground')}>{desc}</span>
                </button>
              )
            })}
          </div>
          <span className="text-[12.5px] text-muted-foreground">You can switch to filmmaker later from your profile.</span>
        </fieldset>

        <div className="mt-2 flex flex-col">
          <Clap className="h-2.5 border-[1.5px] border-b-0 border-foreground" />
          <button
            type="submit"
            disabled={register.isPending || !name || !email || !password}
            className="press flex justify-between items-center min-h-[52px] px-4 bg-k-red text-k-paper font-black text-[16px] disabled:opacity-60"
            style={{ fontStretch: '115%' }}
          >
            <span>{register.isPending ? 'CREATING…' : 'CREATE ACCOUNT'}</span>
            {register.isPending ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <span aria-hidden="true">→</span>}
          </button>
        </div>
        <p className="text-[12.5px] text-muted-foreground">
          By continuing you agree to the community rules: credit your crew and only upload work you made.
        </p>
      </form>
    </AuthFrame>
  )
}
