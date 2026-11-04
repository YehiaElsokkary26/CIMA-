import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import AuthFrame, { FormError } from '@/components/klaket/AuthFrame'
import { Clap } from '@/components/klaket/primitives'
import Input from '@/components/ui/Input'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, resendConfirmation } = useAuth()
  const prefill = (location.state as { email?: unknown } | null)?.email

  const [email, setEmail] = useState(typeof prefill === 'string' ? prefill : '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [unconfirmed, setUnconfirmed] = useState(false)
  const [resent, setResent] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setUnconfirmed(false)
    setResent(false)
    try {
      await login.mutateAsync({ email, password })
      navigate('/home', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (/not confirmed|confirm/i.test(msg)) {
        setUnconfirmed(true)
        setError('Confirm your email first. Click the link we sent you, then sign in.')
        return
      }
      setError(
        /credential|invalid/i.test(msg)
          ? 'That email and password don’t match. Check them and try again.'
          : msg || 'Couldn’t sign you in. Check your connection and try again.',
      )
    }
  }

  const resend = async () => {
    try {
      await resendConfirmation.mutateAsync(email)
      setResent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Couldn’t resend the email. Try again in a minute.')
    }
  }

  return (
    <AuthFrame mode="in" eyebrow="Welcome back" heading="Back on set.">
      <form onSubmit={submit} className="flex flex-col gap-3.5 pt-5" noValidate>
        {error && <FormError message={error} />}
        {unconfirmed && (
          <div className="-mt-1.5 flex items-center gap-3">
            <button
              type="button"
              onClick={resend}
              disabled={resendConfirmation.isPending || !email}
              className="press min-h-[44px] px-3 border-[1.5px] border-foreground font-extrabold text-[12px] hover:bg-foreground/5 disabled:opacity-60"
            >
              {resendConfirmation.isPending ? 'SENDING…' : 'RESEND CONFIRMATION EMAIL'}
            </button>
            {resent && <span className="k-label text-[10.5px] font-semibold" role="status">✓ Sent</span>}
          </div>
        )}
        <Input label="Email" type="email" autoComplete="email" placeholder="you@school.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Password" type="password" autoComplete="current-password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        <div className="mt-3 flex flex-col">
          <Clap className="h-2.5 border-[1.5px] border-b-0 border-foreground" />
          <button
            type="submit"
            disabled={login.isPending || !email || !password}
            className="press flex justify-between items-center min-h-[52px] px-4 bg-solid text-solid-foreground font-black text-[16px] disabled:opacity-60"
            style={{ fontStretch: '115%' }}
          >
            <span>{login.isPending ? 'SIGNING IN…' : 'SIGN IN'}</span>
            {login.isPending ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <span aria-hidden="true">→</span>}
          </button>
        </div>
        <p className="text-[13.5px] text-muted-foreground">
          New here?{' '}
          <Link to="/register" className="font-semibold text-foreground underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </form>
    </AuthFrame>
  )
}
