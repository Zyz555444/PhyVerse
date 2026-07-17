import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
  leftIcon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, error, leftIcon, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-text-primary">
            {label}
            {props.required && <span className="ml-1 text-accent">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'h-10 w-full rounded-lg border bg-paper text-sm text-text-primary',
              leftIcon ? 'pl-10 pr-3' : 'px-3',
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
        </div>
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
