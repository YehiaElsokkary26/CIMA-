import { LogOut } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { PageTitle } from '@/components/klaket/primitives'
import RoleBadge from '@/components/profile/RoleBadge'
import Avatar from '@/components/ui/Avatar'

export default function SettingsPage() {
  const { isDarkMode, setDarkMode } = useUIStore()
  const { user, logout } = useAuth()

  return (
    <div className="min-h-full">
      <div className="max-w-2xl mx-auto px-4 pt-2 pb-8 flex flex-col gap-6">
        <PageTitle en="SETTINGS" ar="الإعدادات" />

        {user && (
          <section className="border-[1.5px] border-foreground bg-card p-3.5 flex items-center gap-3.5">
            <Avatar name={user.name} src={user.avatarUrl} size="lg" />
            <div className="min-w-0 flex flex-col gap-1">
              <b className="text-[16px] truncate">{user.name}</b>
              <span className="text-[13px] text-muted-foreground truncate">{user.email}</span>
              <RoleBadge role={user.role} className="self-start" />
            </div>
          </section>
        )}

        <section className="flex flex-col gap-2">
          <h2 className="k-label text-[11px] font-semibold">Theme</h2>
          <div role="radiogroup" aria-label="Theme" className="grid grid-cols-2 border-[1.5px] border-foreground">
            {[
              { dark: false, label: 'Newsprint', note: 'Light', swatch: 'bg-k-paper' },
              { dark: true, label: 'Screening room', note: 'Dark', swatch: 'bg-k-ink' },
            ].map((t, i) => (
              <button
                key={t.label}
                type="button"
                role="radio"
                aria-checked={isDarkMode === t.dark}
                onClick={() => setDarkMode(t.dark)}
                className={cn(
                  'flex items-center gap-3 p-3 text-start min-h-[60px]',
                  i === 0 && 'border-e-[1.5px] border-foreground',
                  isDarkMode === t.dark ? 'bg-solid text-solid-foreground' : 'hover:bg-foreground/5',
                )}
              >
                <span className={cn('w-8 h-8 border-[1.5px] border-current shrink-0', t.swatch)} aria-hidden="true" />
                <span className="flex flex-col">
                  <b className="text-[14px]">{t.label}</b>
                  <span className="k-label text-[9.5px] opacity-80">{t.note}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="k-label text-[11px] font-semibold">Account</h2>
          <div className="border-[1.5px] border-foreground bg-field divide-y divide-rule">
            <div className="flex items-center justify-between gap-3 px-3 py-3">
              <span className="flex flex-col">
                <b className="text-[14px]">Your role</b>
                <span className="text-[13px] text-muted-foreground">
                  {user?.role === 'filmmaker' ? 'You can upload films and enter the vote.' : 'You can watch, vote and leave notes.'}
                </span>
              </span>
              {user && <RoleBadge role={user.role} />}
            </div>
          </div>
        </section>

        <button
          type="button"
          onClick={logout}
          className="press flex items-center justify-center gap-2 min-h-[50px] border-[1.5px] border-hot text-hot font-extrabold text-[14px] hover:bg-hot/10"
        >
          <LogOut size={16} aria-hidden="true" />
          SIGN OUT
        </button>

        <p className="k-label text-[10px] text-muted-foreground text-center">Klaket v0.1.0 · كلاكيت</p>
      </div>
    </div>
  )
}
