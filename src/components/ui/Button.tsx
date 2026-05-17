import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'cima' | 'destructive' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', pulse = false, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-sans font-semibold rounded-xl transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-primary text-primary-foreground hover:brightness-110 shadow-glow-orange/20': variant === 'primary',
            'bg-secondary text-secondary-foreground hover:brightness-110': variant === 'secondary',
            'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted': variant === 'ghost',
            'bg-accent text-accent-foreground hover:brightness-110': variant === 'cima',
            'bg-destructive text-destructive-foreground hover:brightness-110': variant === 'destructive',
            'bg-transparent border border-border text-foreground hover:bg-muted': variant === 'outline',
          },
          {
            'text-xs px-3 py-1.5': size === 'sm',
            'text-sm px-4 py-2.5': size === 'md',
            'text-base px-6 py-3.5': size === 'lg',
          },
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
