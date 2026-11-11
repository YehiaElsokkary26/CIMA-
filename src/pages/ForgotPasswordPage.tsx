import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import AuthFrame, { FormError } from '@/components/klaket/AuthFrame'
import { Clap } from '@/components/klaket/primitives'
import Input from '@/components/ui/Input'

export default function ForgotPasswordPage() {
  const location = useLocation()
  const prefill = (location.state as { email?: unknown } | null)?.email
  const [email, setEmail] = useState(typeof prefill === 'string' ? prefill : '')
  const [sending, setSending] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState('')

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSending(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setSending(false)
    // Same answer whether or not the address has an account, so this page
    // can't be used to check who is signed up. Only rate limits are shown.
    if (err && /rate|limit|seconds/i.test(err.message)) {
      setError('Too many tries. Wait a minute, then send it again.')
      return
    }
    if (err && /fetch|network/i.test(err.message)) {
      setError('Can’t reach Klaket right now. Check your connection and try again.')
      return
    }
    setSentTo(email.trim())
  }

  return (
    <AuthFrame eyebrow="Retake" heading={sentTo ? 'Check your inbox.' : 'Forgot your password?'}>
      {sentTo ? (
        <section className="flex flex-col gap-3.5 pt-5" aria-live="polite">
          <p className="text-[15px]">
            If <b className="break-all">{sentTo}</b> has a Klaket account, a link to set a new password is on its way. It works once and expires in an hour.
          </p>
          <p className="text-[13px] text-muted-foreground">Open it on this device. Check your spam folder if it doesn’t arrive.</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSentTo(null)}
              className="press min-h-[48px] border-[1.5px] border-foreground font-extrabold text-[13px] hover:bg-foreground/5"
            >
              SEND AGAIN
            </button>
            <Link to="/login" state={{ email: sentTo }} className="press min-h-[48px] flex items-center justify-center bg-solid text-solid-foreground font-extrabold text-[13px]">
              BACK TO SIGN IN
            </Link>
          </div>
        </section>
      ) : (
        <form onSubmit={send} className="flex flex-col gap-3.5 pt-5" noValidate>
          <p className="text-[14px] text-muted-foreground">Enter the email you signed up with. We’ll send a link to set a new one.</p>
          {error && <FormError message={error} />}
          <Input label="Email" type="email" autoComplete="email" placeholder="you@school.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <div className="mt-2 flex flex-col">
            <Clap className="h-2.5 border-[1.5px] border-b-0 border-foreground" />
            <button
              type="submit"
              disabled={sending || !/^\S+@\S+\.\S+$/.test(email.trim())}
              className="press flex justify-between items-center min-h-[52px] px-4 bg-solid text-solid-foreground font-black text-[16px] disabled:opacity-60"
              style={{ fontStretch: '115%' }}
            >
              <span>{sending ? 'SENDING…' : 'SEND RESET LINK'}</span>
              {sending ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <span aria-hidden="true">→</span>}
            </button>
          </div>
          <Link to="/login" state={{ email }} className="text-[13.5px] font-semibold underline underline-offset-4 self-start min-h-[36px] flex items-center">
            Back to sign in
          </Link>
        </form>
      )}
    </AuthFrame>
  )
}
