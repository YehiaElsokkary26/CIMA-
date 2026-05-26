import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { CimaIconMark } from '@/components/layout/CimaLogo'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await register.mutateAsync({ name, email, password, role: 'viewer' })
      // After register: always go to onboarding for role selection
      navigate('/onboarding', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.'
      // If Supabase isn't configured we land here — tell the user to use demo accounts
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
          <p className="font-sans text-sm text-center mt-2 mb-0" style={{ color: '#4E4A46' }}>
            Where student cinema comes to life.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Your Name"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
            minLength={6}
          />

          {error && (
            <p className="font-mono text-xs text-destructive">{error}</p>
          )}

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

        {/* Login link */}
        <p className="text-center font-mono text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
          >
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
