// UI/UX audit applied — WCAG 2.1 AA compliant
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, AlertCircle } from 'lucide-react'
import { CimaIconMark } from '@/components/layout/CimaLogo'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login.mutateAsync({ email, password })
      navigate('/home', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed.'
      setError(msg)
    } finally {
      setLoading(false)
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
            Where student cinema comes to life.
          </p>
        </div>

        {/* Rule 7: form error summary banner at top of form */}
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

        {/* Rule 7: single-column form, labels above inputs, min 48px inputs */}
        <form onSubmit={handleSubmit} className="space-y-5">
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
          {/* Rule 7: password field with show/hide toggle (handled in Input component) */}
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            showRequired
            autoComplete="current-password"
          />

          {/* Rule 11 + Rule 3: full-width primary button, min 52px (lg size) */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={loading || login.isPending}
            pulse
          >
            {loading || login.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        {/* Rule 3: Register link has py-1 to increase tap area */}
        <p className="text-center font-mono text-xs text-muted-foreground">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors py-1"
          >
            Register
          </Link>
        </p>
      </motion.div>
    </motion.div>
  )
}
