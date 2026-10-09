import { getInitials } from '@/lib/utils'

interface ClusterPerson {
  name: string
  avatar?: string
}

interface AvatarClusterProps {
  people: ClusterPerson[]
  max?: number
  size?: number
  ringColor?: string
}

export default function AvatarCluster({ people, max = 4, size = 28, ringColor = '#161413' }: AvatarClusterProps) {
  if (people.length === 0) return null

  const visible = people.slice(0, max)
  const overflow = people.length - visible.length

  return (
    <div className="flex items-center" role="group" aria-label={`${people.length} people`}>
      {visible.map((p, i) => (
        <div
          key={`${p.name}-${i}`}
          className="rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-secondary"
          style={{
            width: size,
            height: size,
            marginLeft: i === 0 ? 0 : -8,
            border: `2px solid ${ringColor}`,
            zIndex: visible.length - i,
          }}
        >
          {p.avatar ? (
            <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-mono font-bold text-secondary-foreground" style={{ fontSize: size * 0.34 }}>
              {getInitials(p.name)}
            </span>
          )}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="rounded-full flex items-center justify-center shrink-0 font-mono font-bold"
          style={{
            width: size,
            height: size,
            marginLeft: -8,
            background: '#333333',
            color: '#FFFFFF',
            fontSize: size * 0.32,
            border: `2px solid ${ringColor}`,
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  )
}
