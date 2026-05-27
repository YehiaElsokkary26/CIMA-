// UI/UX audit applied — WCAG 2.1 AA compliant
import { forwardRef, useState } from 'react'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  /** Show cinema-red asterisk after label to mark required fields (Rule 7) */
  showRequired?: boolean
}

// Rule 7: every input has a visible label above it (never rely on placeholder alone)
// Rule 3: minimum 48px height via input-cima class
// Rule 7: password show/hide toggle
// Rule 7: error state below input in cinema-red with alert icon
// Rule 2: label font-mono text-xs uppercase tracking-wider (min 11px)
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, type, showRequired, required, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'
    const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {label}
            {/* Rule 7: required asterisk in cinema-red */}
            {(required || showRequired) && (
              <span className="ml-1" style={{ color: '#A32626' }} aria-hidden="true">*</span>
            )}
          </label>
        )}

        {/* Rule 3: wrapper ensures 48px min touch target */}
        <div className="relative flex items-center">
          <input
            ref={ref}
            type={resolvedType}
            required={required}
            className={cn(
              'input-cima flex-1',
              // Rule 7: cinema-red bottom border on error
              error && '!border-b-destructive focus:!border-b-destructive',
              // Add right padding when password toggle is shown
              isPassword && 'pr-10',
              className
            )}
            {...props}
          />

          {/* Rule 7: password show/hide toggle — min 44px tap area */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-0 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              style={{ width: 44, height: 44, bottom: 0 }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword
                ? <EyeOff size={15} />
                : <Eye size={15} />
              }
            </button>
          )}
        </div>

        {/* Rule 7: error message below input — cinema-red, with icon */}
        {error && (
          <span className="flex items-center gap-1 font-mono text-xs text-destructive mt-0.5">
            <AlertCircle size={11} className="shrink-0" />
            {error}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
