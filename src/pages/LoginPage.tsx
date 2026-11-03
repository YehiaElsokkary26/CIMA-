import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import AuthFrame, { FormError } from '@/components/klaket/AuthFrame'
import { Clap } from '@/components/klaket/primitives'
import Input from '@/components/ui/Input'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login.mutateAsync({ email, password })
      navigate('/home', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      setError(
        /credential|invalid/i.test(msg)
          ? 'That email and password don’t match. Check them and try again.'
          : /confirm/i.test(msg)
            ? 'Confirm your email first. Check your inbox for the link.'
            : msg || 'Couldn’t sign you in. Check your connection and try again.',
      )
    }
  }

  return (
    <AuthFrame mode="in" eyebrow="Welcome back" heading="Back on set.">
      <form onSubmit={submit} className="flex flex-col gap-3.5 pt-5" noValidate>
        {error && <FormError message={error} />}
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
