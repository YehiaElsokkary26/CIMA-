import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Eye, Loader2 } from 'lucide-react'
import CimaLogo from '@/components/layout/CimaLogo'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'

type Screen = 'welcome' | 'auth' | 'role'
type AuthMode = 'login' | 'register'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { login, register, isLoggedIn, user } = useAuth()
  const [screen, setScreen] = useState<Screen>(isLoggedIn ? 'role' : 'welcome')
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')

  // If already has role, redirect
  if (isLoggedIn && user?.role) {
    navigate('/home', { replace: true })
    return null
  }

  const DEMO_USERS: Record<string, { id: string; name: string; email: string; role: 'filmmaker' | 'viewer' }> = {
    'demo@cima.film':   { id: 'u1', name: 'Demo Filmmaker', email: 'demo@cima.film',   role: 'filmmaker' },
    'viewer@cima.film': { id: 'u2', name: 'Demo Viewer',    email: 'viewer@cima.film', role: 'viewer'    },
  }

  const { setAuth } = useAuthStore()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (authMode === 'login') {
        await login.mutateAsync({ email: form.email, password: form.password })
      } else {
        await register.mutateAsync({ name: form.name, email: form.email, password: form.password, role: 'viewer' })
      }
      setScreen('role')
    } catch {
      // Offline demo fallback
      const demo = DEMO_USERS[form.email.toLowerCase()]
      if (demo && form.password === 'password') {
        setAuth('demo_token', { ...demo, createdAt: new Date().toISOString() })
        navigate('/home', { replace: true })
        return
      }
      setError('Try demo@cima.film / password  or  viewer@cima.film / password')
    }
  }

  const handleRoleSelect = async (role: 'filmmaker' | 'viewer') => {
    // Role was set at register — just update if needed and redirect
    navigate('/home', { replace: true })
  }

  return (
    <div className="min-h-full bg-background flex flex-col items-center justify-center px-6 py-12 overflow-y-auto">
      {/* Welcome */}
      <AnimatePresence mode="wait">
        {screen === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col items-center gap-6 max-w-xs w-full text-center"
          >
            <CimaLogo size={56} />
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="font-display text-7xl uppercase tracking-widest text-foreground projector-flicker"
              >
                CIMA
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="font-mono text-xs text-muted-foreground mt-1 crt-glow"
              >
                Your film, your scene.
              </motion.p>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="font-sans text-sm text-muted-foreground leading-relaxed"
            >
              Where film students share projects, get feedback, and team up on new shorts.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="w-full flex flex-col gap-3"
            >
              <Button size="lg" pulse onClick={() => setScreen('auth')} className="w-full">
                Get Started
              </Button>
              <button
                onClick={() => { setAuthMode('login'); setScreen('auth') }}
                className="font-mono text-xs text-muted-foreground underline underline-offset-4"
              >
                Already have an account? Sign in
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Auth */}
        {screen === 'auth' && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-xs space-y-6"
          >
            <div>
              <div className="flex items-center gap-3 mb-6">
                <CimaLogo size={32} />
                <h2 className="font-display text-3xl uppercase tracking-widest text-foreground">
                  {authMode === 'login' ? 'Sign In' : 'Join Cima'}
                </h2>
              </div>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'register' && (
                <Input
                  label="Your Name"
                  placeholder="Jane Doe"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              )}
              <Input
                label="Email"
                type="email"
                placeholder="you@film.school"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
              />

              {error && <p className="font-mono text-xs text-destructive">{error}</p>}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={login.isPending || register.isPending}
              >
                {(login.isPending || register.isPending) ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : authMode === 'login' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="text-center">
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="font-mono text-xs text-muted-foreground underline underline-offset-4"
              >
                {authMode === 'login' ? "Don't have an account? Join" : 'Already have an account? Sign in'}
              </button>
            </div>

            <button
              onClick={() => setScreen('welcome')}
              className="block font-mono text-[10px] text-muted-foreground/60 mx-auto"
            >
              ← Back
            </button>
          </motion.div>
        )}

        {/* Role Selection */}
        {screen === 'role' && (
          <motion.div
            key="role"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-sm space-y-6"
          >
            <div className="text-center">
              <h2 className="font-display text-4xl uppercase tracking-widest text-foreground">
                Who Are You?
              </h2>
              <p className="font-mono text-xs text-muted-foreground mt-2">
                Choose how you want to use Cima
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {[
                {
                  role: 'filmmaker' as const,
                  icon: Camera,
                  title: 'Filmmaker',
                  desc: 'Upload your films, build a crew, and get real feedback from the community.',
                },
                {
                  role: 'viewer' as const,
                  icon: Eye,
                  title: 'Viewer',
                  desc: 'Discover student films, leave reviews, and follow filmmakers you love.',
                },
              ].map(({ role, icon: Icon, title, desc }) => (
                <motion.button
                  key={role}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleRoleSelect(role)}
                  className="w-full bg-card border border-border rounded-2xl p-5 text-left flex items-start gap-4 hover:border-primary hover:shadow-glow-orange/20 transition-all duration-200 interactive-lift"
                >
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Icon size={22} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl uppercase tracking-widest text-foreground">
                      {title}
                    </h3>
                    <p className="font-sans text-xs text-muted-foreground mt-1 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
