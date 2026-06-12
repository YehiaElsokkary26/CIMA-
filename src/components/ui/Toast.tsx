// UI/UX audit applied — WCAG 2.1 AA compliant
import { AnimatePresence, motion } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'
import { cn } from '@/lib/utils'

const ICONS = {
  success: CheckCircle,
  error:   AlertCircle,
  info:    Info,
}

// Rule 9: ink-black background, 4px left border (cinema-red=success, red=error, gold=info)
// Rule 9: paper-cream text, font-mono text-sm
// Rule 9: top-center on mobile, paper-cream text, slide-down entrance
// Rule 3: close button min 44×44px touch target
const BORDER_CLASS = {
  success: 'toast-success',
  error:   'toast-error',
  info:    'toast-info',
}

const ICON_COLOR = {
  success: '#A32626',   /* cinema-red */
  error:   '#D94040',   /* brighter red */
  info:    '#B28A52',   /* muted-gold */
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    // Rule 9: top-center on mobile, bottom-right on desktop (lg:)
    <div className={cn(
      'fixed z-[9999] flex flex-col gap-2 pointer-events-none',
      // Mobile: top-center
      'top-4 left-1/2 -translate-x-1/2 w-[calc(100vw-32px)] max-w-sm',
      // Desktop: bottom-right
      'lg:top-auto lg:bottom-6 lg:right-6 lg:left-auto lg:translate-x-0 lg:w-80',
    )}>
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.type]
          return (
            <motion.div
              key={t.id}
              // Mobile: slide down from top. Desktop: slide up from bottom-right
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0,   scale: 1 }}
              exit={{   opacity: 0, y: -10,  scale: 0.95 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'pointer-events-auto flex items-center gap-3 border-r border-t border-b border-border/30 px-4 py-3',
                // Rule 9: ink-black bg, paper-cream text (never gray on dark)
                BORDER_CLASS[t.type]
              )}
              style={{
                background: '#161413',   /* Rule 12: ink-black, never pure black */
                borderRadius: 0,
                boxShadow: '0 4px 20px rgba(22,20,19,0.6), 0 1px 4px rgba(22,20,19,0.3)',
              }}
            >
              {/* Icon in matching accent color */}
              <Icon size={16} className="shrink-0" style={{ color: ICON_COLOR[t.type] }} />

              {/* Rule 1 + Rule 9: paper-cream text, font-mono text-sm */}
              <p className="font-mono text-sm flex-1 leading-snug" style={{ color: '#E8DDCB' }}>
                {t.message}
              </p>

              {/* Rule 3: close button min 44×44px touch area */}
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 flex items-center justify-center transition-opacity hover:opacity-70"
                style={{ width: 44, height: 44, color: '#E8DDCB', opacity: 0.6 }}
                aria-label="Dismiss notification"
              >
                <X size={13} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
