import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/shared/utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-text-primary">
            {label}
            {props.required && <span className="ml-1 text-accent">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'h-10 w-full rounded-lg border bg-paper px-3 text-sm text-text-primary',
            'placeholder:text-text-tertiary',
            'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent-soft',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-danger focus:border-danger focus:ring-danger-soft'
              : 'border-border hover:border-border-strong',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />
        {error ? (
          <p className="text-xs text-danger">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-text-secondary">{helperText}</p>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'
