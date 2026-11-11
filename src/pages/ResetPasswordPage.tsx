import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { usersApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import AuthFrame, { FormError } from '@/components/klaket/AuthFrame'
import { Clap } from '@/components/klaket/primitives'
import Input from '@/components/ui/Input'

/**
 * Opened from the reset email. Supabase reads the link and signs the person
 * in for this one purpose; here they choose a new password.
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [state, setState] = useState<'checking' | 'ready' | 'expired'>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Expired or already-used links come back with an error in the URL.
    const hash = new URLSearchParams(window.location.hash.slice(1))
    if (hash.get('error') || new URLSearchParams(window.location.search).get('error')) {
      setState('expired')
      return
    }
    let done = false
    const ready = () => {
      if (!done) {
        done = true
        setState('ready')
      }
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN')) ready()
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) ready()
      // Give the link a moment to be read before calling it expired.
      else setTimeout(() => !done && setState('expired'), 2500)
    })
    return () => subscription.unsubscribe()
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) return setError('Use at least 6 characters for your password.')
    if (password !== confirm) return setError('The two passwords don’t match.')
    setSaving(true)
    const { data, error: err } = await supabase.auth.updateUser({ password })
    if (err) {
      setSaving(false)
      setError(
        /different from the old|same/i.test(err.message)
          ? 'Choose a password you haven’t used before.'
          : /session|expired|jwt/i.test(err.message)
            ? 'This link has expired. Ask for a new one.'
            : err.message || 'Couldn’t save your new password. Try again.',
      )
      return
    }
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session && data.user) setAuth(session.access_token, (await usersApi.get(data.user.id)).data)
      toast.success('Password changed. You’re signed in.')
      navigate('/home', { replace: true })
    } catch {
      // Password is saved even if the API is down; signing in again will work.
      toast.success('Password changed. Sign in with your new password.')
      await supabase.auth.signOut()
      navigate('/login', { replace: true })
    }
  }

  if (state === 'checking') {
    return (
      <AuthFrame eyebrow="Retake" heading="One moment…">
        <div className="flex justify-center py-16" role="status" aria-label="Checking your reset link">
          <Loader2 size={24} className="animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      </AuthFrame>
    )
  }

  if (state === 'expired') {
    return (
      <AuthFrame eyebrow="Retake" heading="This link has expired.">
        <section className="flex flex-col gap-3.5 pt-5">
          <p className="text-[15px]">Reset links work once and expire after an hour. Ask for a new one and open it on this device.</p>
          <Link to="/forgot-password" className="press min-h-[52px] flex items-center justify-between px-4 bg-solid text-solid-foreground font-black text-[15px]">
            <span>SEND A NEW LINK</span>
            <span aria-hidden="true">→</span>
          </Link>
        </section>
      </AuthFrame>
    )
  }

  return (
    <AuthFrame eyebrow="Retake" heading="Choose a new password.">
      <form onSubmit={save} className="flex flex-col gap-3.5 pt-5" noValidate>
        {error && <FormError message={error} />}
        <Input label="New password" type="password" autoComplete="new-password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        <Input label="Type it again" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        <div className="mt-2 flex flex-col">
          <Clap className="h-2.5 border-[1.5px] border-b-0 border-foreground" />
          <button
            type="submit"
            disabled={saving || !password || !confirm}
            className="press flex justify-between items-center min-h-[52px] px-4 bg-solid text-solid-foreground font-black text-[16px] disabled:opacity-60"
            style={{ fontStretch: '115%' }}
          >
            <span>{saving ? 'SAVING…' : 'SAVE PASSWORD'}</span>
            {saving ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <span aria-hidden="true">→</span>}
          </button>
        </div>
      </form>
    </AuthFrame>
  )
}
