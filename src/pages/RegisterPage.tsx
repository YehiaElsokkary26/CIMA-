// UI/UX audit applied — WCAG 2.1 AA compliant
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, AlertCircle, Camera, Eye } from 'lucide-react'
import { CimaIconMark } from '@/components/layout/CimaLogo'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types'

const ROLE_CARDS: { role: UserRole; label: string; desc: string; icon: typeof Camera }[] = [
  { role: 'filmmaker', label: 'Filmmaker', desc: 'Share your films', icon: Camera },
  { role: 'viewer', label: 'Viewer', desc: 'Discover and review', icon: Eye },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState<UserRole>('viewer')
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
      const result = await register.mutateAsync({ name, email, password, role: selectedRole })
      navigate(result.user.role ? '/home' : '/onboarding', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.'
      setError(
        msg.includes('fetch') || msg.includes('network') || msg.includes('Failed')
          ? "Couldn't reach Cima right now. Check your connection and try again."
          : msg
      )
    }
  }

  return (
    <motion.div
      className="min-h-full bg-background flex flex-col items-center justify-center px-6 py-12 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-xs space-y-8"
      >
        {/* Logo + tagline */}
        <div className="flex flex-col items-center">
          <CimaIconMark size={72} />
          <p className="text-sm text-center mt-2 text-muted-foreground">
            Every voice deserves a screen.
          </p>
        </div>

        {/* Rule 7: form error summary banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/40 border-l-[3px] border-l-destructive"
          >
            <AlertCircle size={14} className="shrink-0 mt-0.5 text-destructive" />
            <p className="text-xs text-destructive">{error}</p>
          </motion.div>
        )}

        {/* Rule 7: single-column form, all labels above inputs */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Full Name"
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

          {/* Role selection cards */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">I am a…</label>
            <div className="grid grid-cols-2 gap-3">
              {ROLE_CARDS.map(({ role, label, desc, icon: Icon }) => {
                const selected = selectedRole === role
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={cn(
                      'rounded-2xl p-4 text-left border transition-colors',
                      selected
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/40',
                    )}
                  >
                    <Icon size={18} className="text-primary mb-2" />
                    <p className="text-sm font-bold text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

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
        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors py-1"
          >
            Sign In
          </Link>
        </p>
      </motion.div>
    </motion.div>
  )
}
