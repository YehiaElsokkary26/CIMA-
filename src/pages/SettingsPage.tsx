import { motion } from 'framer-motion'
import { Moon, Sun, Camera, Eye, LogOut, ChevronRight, Shield } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useAuth } from '@/hooks/useAuth'
import RoleBadge from '@/components/profile/RoleBadge'
import Avatar from '@/components/ui/Avatar'

export default function SettingsPage() {
  const { isDarkMode, toggleDarkMode } = useUIStore()
  const { user, logout } = useAuth()

  const sections = [
    {
      title: 'Appearance',
      items: [
        {
          label: 'Dark Mode',
          desc: 'The cinematic default',
          icon: isDarkMode ? Moon : Sun,
          action: (
            <button
              onClick={toggleDarkMode}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${isDarkMode ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background shadow transition-transform duration-200 ${isDarkMode ? 'translate-x-5' : ''}`} />
            </button>
          ),
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          label: 'Your Role',
          desc: user?.role === 'filmmaker' ? 'You can upload films' : 'Discover and review films',
          icon: user?.role === 'filmmaker' ? Camera : Eye,
          action: user ? <RoleBadge role={user.role} /> : null,
        },
        {
          label: 'Privacy',
          desc: 'Manage who can see your profile',
          icon: Shield,
          action: <ChevronRight size={16} className="text-muted-foreground" />,
        },
      ],
    },
  ]

  return (
    <div className="min-h-full px-4 py-6 space-y-8">
      <h1 className="font-display text-4xl uppercase tracking-widest text-foreground">Settings</h1>

      {/* Profile card */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4"
        >
          <Avatar name={user.name} size="lg" />
          <div>
            <p className="font-sans font-semibold text-foreground">{user.name}</p>
            <p className="font-mono text-xs text-muted-foreground">{user.email}</p>
            <RoleBadge role={user.role} className="mt-2" />
          </div>
        </motion.div>
      )}

      {sections.map((section, si) => (
        <motion.section
          key={section.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: si * 0.1 }}
        >
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
            {section.title}
          </h2>
          <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
            {section.items.map(({ label, desc, icon: Icon, action }) => (
              <div key={label} className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-sans text-sm font-medium text-foreground">{label}</p>
                  <p className="font-mono text-xs text-muted-foreground">{desc}</p>
                </div>
                {action}
              </div>
            ))}
          </div>
        </motion.section>
      ))}

      {/* Logout */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-2xl py-3.5 font-sans font-semibold text-sm hover:bg-destructive/20 transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </motion.div>

      <div className="text-center pb-4">
        <p className="font-mono text-[10px] text-muted-foreground/50">
          Cima v0.1.0 — Your film, your scene.
        </p>
      </div>
    </div>
  )
}
