import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Loader2, Play } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/store/toastStore'
import AuthFrame, { FormError } from '@/components/klaket/AuthFrame'
import { Clap } from '@/components/klaket/primitives'
import Input from '@/components/ui/Input'

const DEMO_ACCOUNTS = [
  { label: 'Filmmaker', email: 'demo@cima.film', password: 'password', icon: Camera },
  { label: 'Viewer', email: 'viewer@cima.film', password: 'password', icon: Play },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const loginWithMock = useAuthStore((s) => s.loginWithMock)
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Demo accounts work without a server.
    if (loginWithMock(email, password)) {
      setLoading(false)
      navigate('/home', { replace: true })
      return
    }

    try {
      await login.mutateAsync({ email, password })
      navigate('/home', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      setError(
        /credential|invalid/i.test(msg)
          ? 'That email and password don’t match. Check them, or try a demo account below.'
          : msg || 'Couldn’t sign you in. Check your connection and try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  const loginAsDemo = (acc: (typeof DEMO_ACCOUNTS)[number]) => {
    if (loginWithMock(acc.email, acc.password)) {
      toast.success(`Signed in as the demo ${acc.label.toLowerCase()}.`)
      navigate('/home', { replace: true })
    }
  }

  const busy = loading || login.isPending

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
            disabled={busy || !email || !password}
            className="press flex justify-between items-center min-h-[52px] px-4 bg-solid text-solid-foreground font-black text-[16px] disabled:opacity-60"
            style={{ fontStretch: '115%' }}
          >
            <span>{busy ? 'SIGNING IN…' : 'SIGN IN'}</span>
            {busy ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <span aria-hidden="true">→</span>}
          </button>
        </div>
      </form>

      <section aria-label="Demo accounts" className="mt-8 flex flex-col gap-2">
        <span className="k-label text-[10.5px] text-muted-foreground">No account yet? Try a demo</span>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((acc) => {
            const Icon = acc.icon
            return (
              <button
                key={acc.label}
                type="button"
                onClick={() => loginAsDemo(acc)}
                className="press border-[1.5px] border-foreground bg-card p-3 flex flex-col items-start gap-1 hover:bg-muted text-start"
              >
                <Icon size={18} aria-hidden="true" />
                <b className="text-[14px]">{acc.label}</b>
                <span className="k-label text-[9px] text-muted-foreground normal-case tracking-normal break-all">{acc.email}</span>
              </button>
            )
          })}
        </div>
      </section>
    </AuthFrame>
  )
}
