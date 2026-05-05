import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-input text-foreground border border-border rounded-xl px-4 py-2.5 text-sm font-sans placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-150',
            error && 'border-destructive focus:ring-destructive',
            className
          )}
          {...props}
        />
        {error && (
          <span className="font-mono text-xs text-destructive">{error}</span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
