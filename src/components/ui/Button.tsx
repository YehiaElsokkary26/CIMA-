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
          'inline-flex items-center justify-center gap-2 font-mono uppercase tracking-wider rounded-none transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-primary text-primary-foreground hover:brightness-110': variant === 'primary',
            'bg-secondary text-secondary-foreground hover:brightness-110': variant === 'secondary',
            'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted': variant === 'ghost',
            'bg-accent text-accent-foreground hover:brightness-110': variant === 'cima',
            'bg-destructive text-destructive-foreground hover:brightness-110': variant === 'destructive',
            'bg-transparent border border-border text-foreground hover:bg-muted': variant === 'outline',
          },
          {
            'text-[10px] px-3 py-1.5': size === 'sm',
            'text-[11px] px-4 py-2.5': size === 'md',
            'text-xs px-6 py-3': size === 'lg',
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
