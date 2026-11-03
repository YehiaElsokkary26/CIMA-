import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import AuthFrame, { FormError } from '@/components/klaket/AuthFrame'
import { Clap } from '@/components/klaket/primitives'
import Input from '@/components/ui/Input'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Use at least 6 characters for your password.')
      return
    }
    try {
      await register.mutateAsync({ name, email, password, role: 'viewer' })
      navigate('/onboarding', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      setError(
        /fetch|network|failed/i.test(msg)
          ? 'Can’t reach the server right now. You can still look around with a demo account on the Sign in tab.'
          : msg || 'Couldn’t create your account. Try again.',
      )
    }
  }

  return (
    <AuthFrame mode="up" eyebrow="Take 01 · New roll" heading="Slate your name.">
      <form onSubmit={submit} className="flex flex-col gap-3.5 pt-5" noValidate>
        {error && <FormError message={error} />}
        <Input label="Name on your credits" autoComplete="name" placeholder="e.g. Hana Bakkali" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Email" type="email" autoComplete="email" placeholder="you@school.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Password" type="password" autoComplete="new-password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />

        <div className="mt-3 flex flex-col">
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
