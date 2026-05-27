// UI/UX audit applied — WCAG 2.1 AA compliant
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, AlertCircle } from 'lucide-react'
import { CimaIconMark } from '@/components/layout/CimaLogo'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Rule 7: validate on submit, not every keystroke
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    try {
      await register.mutateAsync({ name, email, password, role: 'viewer' })
      navigate('/onboarding', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.'
      setError(
        msg.includes('fetch') || msg.includes('network') || msg.includes('Failed')
          ? 'No server connection. Use a demo account on the Sign In page.'
          : msg
      )
    }
  }

  return (
    <div className="min-h-full bg-background flex flex-col items-center justify-center px-6 py-12 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: 'easeOut' }}
        className="w-full max-w-xs space-y-8"
      >
        {/* Logo + tagline */}
        <div className="flex flex-col items-center">
          <CimaIconMark size={72} />
          {/* Rule 1: #4E4A46 on cream = 4.5:1 contrast ✓ */}
          <p className="font-sans text-sm text-center mt-2" style={{ color: '#4E4A46' }}>
            Where student cinema comes to life.
          </p>
        </div>

        {/* Rule 7: form error summary banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 px-4 py-3"
            style={{
              background: 'rgba(163,38,38,0.08)',
              borderLeft: '3px solid #A32626',
              border: '1px solid rgba(163,38,38,0.4)',
              borderLeftWidth: 3,
            }}
          >
            <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: '#A32626' }} />
            <p className="font-mono text-xs" style={{ color: '#A32626' }}>{error}</p>
          </motion.div>
        )}

        {/* Rule 7: single-column form, all labels above inputs */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Your Name"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            showRequired
            autoComplete="name"
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@film.school"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            showRequired
            autoComplete="email"
          />
          {/* Rule 7: password with show/hide toggle (in Input component) */}
          <Input
            label="Password"
            type="password"
            placeholder="Min 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            showRequired
            minLength={6}
            autoComplete="new-password"
          />

          {/* Rule 11 + Rule 3: full-width lg button = min 52px */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={register.isPending}
            pulse
          >
            {register.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        {/* Rule 3: link has py-1 for enlarged tap area */}
        <p className="text-center font-mono text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors py-1"
          >
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
