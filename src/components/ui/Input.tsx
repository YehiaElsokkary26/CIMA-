import { forwardRef, useId, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  /** Mark the field as required in the label */
  showRequired?: boolean
}

// Label above in slate mono, square ink-bordered field, show/hide for passwords.
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, type, showRequired, required, id, ...props }, ref) => {
    const autoId = useId()
    const inputId = id ?? autoId
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'
    const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="k-label text-[10.5px] font-semibold">
            {label}
            {(required || showRequired) && (
              <span className="ms-1 text-hot" aria-hidden="true">*</span>
            )}
          </label>
        )}

        <div className="flex">
          <input
            ref={ref}
            id={inputId}
            type={resolvedType}
            required={required}
            aria-invalid={!!error || undefined}
            className={cn('input-k flex-1', isPassword && 'border-e-0', error && '!border-hot', className)}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="k-label text-[10px] font-semibold min-w-[64px] border-[1.5px] border-foreground bg-field hover:bg-muted"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          )}
        </div>

        {error && (
          <span className="flex items-center gap-1 k-label text-[10.5px] text-hot">
            <AlertCircle size={12} className="shrink-0" />
            {error}
          </span>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
export default Input
