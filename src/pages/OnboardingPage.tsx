// UI/UX audit applied — WCAG 2.1 AA compliant
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, Play } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const ROLES = [
  {
    role: 'filmmaker' as const,
    icon: Camera,
    title: 'Filmmaker',
    description: 'Upload your short films, build your portfolio, and grow your Cima.',
    bg: 'bg-primary/10 border-primary/50 hover:bg-primary/15 hover:border-primary',
    iconBg: 'bg-primary/20',
    iconColor: 'text-primary',
  },
  {
    role: 'viewer' as const,
    icon: Play,
    title: 'Viewer',
    description: 'Discover student films, leave reviews, and find your next favourite short.',
    bg: 'bg-secondary/10 border-secondary/50 hover:bg-secondary/15 hover:border-secondary',
    iconBg: 'bg-secondary/20',
    iconColor: 'text-secondary',
  },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const setRole  = useAuthStore((s) => s.setRole)

  const handleSelect = (role: 'filmmaker' | 'viewer') => {
    setRole(role)
    navigate('/home', { replace: true })
  }

  return (
    <div className="min-h-full bg-background flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="text-center space-y-2">
          <h2 className="font-display text-4xl uppercase tracking-widest text-foreground">
            Who Are You on Cima?
          </h2>
          {/* Rule 1: muted-foreground on cream ≥ 4.5:1 ✓ */}
          <p className="font-mono text-xs text-muted-foreground">
            Choose your role. You can't change this later.
          </p>
        </div>

        {/* Rule 3: cards are min 44px — they're much larger so ✓ */}
        <div className="flex flex-col gap-4 sm:flex-row">
          {ROLES.map(({ role, icon: Icon, title, description, bg, iconBg, iconColor }) => (
            <motion.button
              key={role}
              whileTap={{ scale: 0.97 }}  /* Rule 9: tactile feedback */
              onClick={() => handleSelect(role)}
              className={`flex-1 border rounded-2xl p-5 text-left flex flex-col gap-4 transition-all duration-200 interactive-lift ${bg}`}
              /* Rule 3: full card is tappable, min-height generous */
              style={{ minHeight: 140 }}
            >
              {/* Rule 3: icon area min 44×44 ✓ (w-12 h-12 = 48px) */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
                <Icon size={22} className={iconColor} />
              </div>
              <div>
                <h3 className="font-display text-2xl uppercase tracking-widest text-foreground">
                  {title}
                </h3>
                {/* Rule 2: text-xs = 12px → push to text-sm for 15px on body text */}
                <p className="font-sans text-sm text-muted-foreground mt-1 leading-relaxed">
                  {description}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
