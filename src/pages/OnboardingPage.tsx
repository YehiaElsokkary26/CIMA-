import { useNavigate } from 'react-router-dom'
import { Camera, Play } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Wordmark } from '@/components/klaket/primitives'
import Still from '@/components/klaket/Still'

const ROLES = [
  {
    role: 'filmmaker' as const,
    icon: Camera,
    title: 'I make films',
    body: 'Upload your shorts, enter the weekly vote, and build a crew.',
    still: 'portrait' as const,
    tone: 'bg-k-red text-k-paper',
  },
  {
    role: 'viewer' as const,
    icon: Play,
    title: 'I watch films',
    body: 'Discover student films, vote every week, and leave notes on the cut.',
    still: 'tram' as const,
    tone: 'bg-k-teal text-k-paper',
  },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const setRole = useAuthStore((s) => s.setRole)

  const choose = (role: 'filmmaker' | 'viewer') => {
    setRole(role)
    navigate('/home', { replace: true })
  }

  return (
    <div className="h-full scroll-container bg-background">
      <div className="min-h-full max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">
        <Wordmark size="sm" />
        <div className="flex flex-col gap-1">
          <span className="k-label text-[11px] text-hot font-semibold">Last step</span>
          <h1 className="k-display text-[32px]" style={{ fontStretch: '120%' }}>Which side of the camera?</h1>
          <p className="text-[14px] text-muted-foreground">This sets what you can do on Klaket. You can’t change it later.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {ROLES.map(({ role, icon: Icon, title, body, still, tone }) => (
            <button
              key={role}
              type="button"
              onClick={() => choose(role)}
              className={`press text-start border-[1.5px] border-foreground flex flex-col hover:-translate-y-0.5 transition-transform ${tone}`}
            >
              <div className="h-[140px] border-b-[1.5px] border-foreground overflow-hidden" aria-hidden="true">
                <Still kind={still} />
              </div>
              <div className="p-3.5 flex flex-col gap-1.5">
                <Icon size={20} aria-hidden="true" />
                <b className="k-display text-[22px]">{title}</b>
                <span className="text-[14px] opacity-90">{body}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
