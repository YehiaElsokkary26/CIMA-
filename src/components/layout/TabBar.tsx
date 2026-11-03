import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { mainNav } from './navLinks'

// Ink bar in both themes; the active tab turns mustard, Upload is a red slate button.
export default function TabBar() {
  const role = useAuthStore((s) => s.role)
  const location = useLocation()
  const links = mainNav(role === 'filmmaker')

  return (
    <nav
      aria-label="Main"
      className="fixed bottom-0 inset-x-0 z-40 bg-bar text-k-paper border-t-[1.5px] border-rule"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid" style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}>
        {links.map((link) => {
          const active = location.pathname.startsWith(link.to)
          const Icon = link.icon
          if (link.isUpload) {
            return (
              <NavLink key={link.to} to={link.to} aria-label="Upload a film" className="flex items-center justify-center py-2">
                <span className="w-[52px] h-[44px] bg-k-red text-k-paper border-[1.5px] border-k-paper flex items-center justify-center press">
                  <Icon size={22} strokeWidth={2.4} aria-hidden="true" />
                </span>
              </NavLink>
            )
          }
          return (
            <NavLink
              key={link.to}
              to={link.to}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center gap-[3px] pt-2.5 pb-3 min-h-[56px]',
                active ? 'text-k-mustard' : 'text-k-paper hover:text-k-mustard/80',
              )}
            >
              <Icon size={22} strokeWidth={2} aria-hidden="true" />
              <span className="k-label text-[9.5px]">{link.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
