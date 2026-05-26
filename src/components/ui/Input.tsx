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
          <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'input-cima',
            error && '!border-b-destructive focus:!border-b-destructive',
            className
          )}
          {...props}
        />
        {error && (
          <span className="font-mono text-[10px] text-destructive">{error}</span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
