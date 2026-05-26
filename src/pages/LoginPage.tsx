import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, Camera, Play } from 'lucide-react'
import { CimaIconMark } from '@/components/layout/CimaLogo'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/store/toastStore'

const DEMO_ACCOUNTS = [
  {
    label: 'Filmmaker',
    email: 'alex@cimafilms.com',
    password: 'cima2024',
    icon: Camera,
    color: 'border-primary/60 bg-primary/10 hover:bg-primary/20 text-primary',
  },
  {
    label: 'Viewer',
    email: 'sara@cimafilms.com',
    password: 'cima2024',
    icon: Play,
    color: 'border-secondary/60 bg-secondary/10 hover:bg-secondary/20 text-secondary',
  },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const loginWithMock = useAuthStore((s) => s.loginWithMock)
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Try mock first (works offline/no Supabase needed)
    const ok = loginWithMock(email, password)
    if (ok) {
      setLoading(false)
      navigate('/home', { replace: true })
      return
    }

    // Fall back to Supabase
    try {
      await login.mutateAsync({ email, password })
      navigate('/home', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed.'
      // Show the demo hint only when neither mock nor Supabase worked
      setError(msg.includes('credentials') || msg.includes('Invalid')
        ? 'Wrong email or password. Try a demo account below.'
        : msg)
    } finally {
      setLoading(false)
    }
  }

  const loginAsDemo = (acc: (typeof DEMO_ACCOUNTS)[0]) => {
    const ok = loginWithMock(acc.email, acc.password)
    if (ok) {
      toast.success(`Logged in as ${acc.label}`)
      navigate('/home', { replace: true })
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
          <p className="font-sans text-sm text-center mt-2 mb-0" style={{ color: '#4E4A46' }}>
            Where student cinema comes to life.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@film.school"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="font-mono text-xs text-destructive">{error}</p>
          )}

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

        {/* Register link */}
        <p className="text-center font-mono text-xs text-muted-foreground">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
          >
            Register
          </Link>
        </p>

        {/* Demo accounts */}
        <div className="space-y-3">
          <p className="font-mono text-[10px] text-muted-foreground/70 uppercase tracking-widest text-center">
            Try a demo account →
          </p>
          <div className="grid grid-cols-2 gap-3">
            {DEMO_ACCOUNTS.map((acc) => {
              const Icon = acc.icon
              return (
                <button
                  key={acc.label}
                  type="button"
                  onClick={() => loginAsDemo(acc)}
                  className={`flex flex-col items-center gap-1.5 border rounded-xl px-3 py-3 transition-all duration-150 interactive-lift ${acc.color}`}
                >
                  <Icon size={18} />
                  <span className="font-mono text-[11px] uppercase tracking-wider font-medium">
                    {acc.label}
                  </span>
                  <span className="font-mono text-[9px] text-muted-foreground leading-tight text-center">
                    {acc.email}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
