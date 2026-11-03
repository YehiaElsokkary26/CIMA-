import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * primary: poster red · solid: ink (inverts in dark) · accent: mustard
   * outline: ink line · ghost: text only · destructive: coral line
   */
  variant?: 'primary' | 'solid' | 'accent' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
}

// Square, bold, expanded labels — like the text on a slate.
// Every size keeps a 44px minimum touch target.
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', pulse = false, className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'press inline-flex items-center justify-center gap-2 rounded-none font-extrabold uppercase tracking-[0.01em]',
        'transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none',
        variant === 'primary' && 'bg-k-red text-k-paper hover:brightness-110',
        variant === 'solid' && 'bg-solid text-solid-foreground hover:opacity-90',
        variant === 'accent' && 'bg-k-mustard text-k-ink hover:brightness-105',
        variant === 'outline' && 'bg-transparent text-foreground border-[1.5px] border-foreground hover:bg-foreground/5',
        variant === 'ghost' && 'bg-transparent text-muted-foreground hover:text-foreground',
        variant === 'destructive' && 'bg-transparent text-hot border-[1.5px] border-hot hover:bg-hot/10',
        size === 'sm' && 'text-[12px] px-3.5 min-h-[44px]',
        size === 'md' && 'text-[14px] px-4 min-h-[48px]',
        size === 'lg' && 'text-[16px] px-5 min-h-[52px]',
        pulse && 'cta-pulse',
        className,
      )}
      style={{ fontStretch: '110%', ...props.style }}
      {...props}
    >
      {children}
    </button>
  ),
)

Button.displayName = 'Button'
export default Button
