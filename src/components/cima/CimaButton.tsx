import { Film, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import RecordLED from '@/components/layout/RecordLED'

interface CimaButtonProps {
  status?: 'none' | 'pending' | 'member'
  onClick?: () => void
  disabled?: boolean
  className?: string
}

export default function CimaButton({
  status = 'none',
  onClick,
  disabled,
  className,
}: CimaButtonProps) {
  if (status === 'member') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cima-tag/20 border border-cima-tag/40 text-cima-tag font-sans font-semibold text-sm',
          className
        )}
      >
        <Film size={14} />
        In Your Cima
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-muted-foreground font-sans text-sm',
          className
        )}
      >
        <RecordLED />
        <Clock size={13} />
        Pending…
      </div>
    )
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.96 }}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground font-sans font-semibold text-sm transition-all duration-150 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
        className
      )}
    >
      <Film size={14} />
      Add to Cima
    </motion.button>
  )
}
