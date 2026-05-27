// UI/UX audit applied — WCAG 2.1 AA compliant
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'cima' | 'destructive' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
}

// Rule 3: ALL buttons have minimum 44px touch target height
// Rule 11: consistent styling — primary=cinema-red/cream, secondary=outline/red, destructive=burgundy
// Rule 9: active:scale-[0.97] for tactile pressed feedback
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', pulse = false, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base: font-mono uppercase tracking for all buttons (Rule 11)
          'inline-flex items-center justify-center gap-2 font-mono uppercase tracking-wider rounded-none',
          'transition-all duration-150',
          // Rule 9: tactile pressed feedback
          'active:scale-[0.97]',
          // Rule 3: never below 44px height — disabled state
          'disabled:opacity-50 disabled:pointer-events-none',

          // ── Variant colours ──────────────────────────────────────────────
          // Rule 11 + Rule 1: cinema-red bg, paper-cream text (never gray on red)
          variant === 'primary'     && 'bg-primary text-primary-foreground hover:brightness-110',
          // Rule 11: secondary = transparent + cinema-red border + cinema-red text
          variant === 'secondary'   && 'bg-transparent border border-primary text-primary hover:bg-primary/10',
          variant === 'ghost'       && 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted',
          variant === 'cima'        && 'bg-accent text-accent-foreground hover:brightness-110',
          // Rule 11: destructive = burgundy bg (not just red)
          variant === 'destructive' && 'bg-burgundy text-burgundy-foreground hover:brightness-110 border border-burgundy/20',
          variant === 'outline'     && 'bg-transparent border border-border text-foreground hover:bg-muted',

          // ── Sizes with explicit min-height for touch target (Rule 3) ────
          // sm: min 44px → py-3 = 12px×2 + ~18px text line = 42px → use py-[11px]
          size === 'sm' && 'text-[11px] px-4 py-[11px] min-h-[44px]',
          // md: min 44px → py-3 = 12px×2 + ~18px = 42px, add 1px
          size === 'md' && 'text-xs px-5 py-[13px] min-h-[44px]',
          // lg: prominent action — 52px (Rule 3: vote/submit needs generous target)
          size === 'lg' && 'text-xs px-7 py-[15px] min-h-[52px]',

          pulse && 'cta-pulse',
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
