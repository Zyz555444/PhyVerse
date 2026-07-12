import * as RadixSwitch from '@radix-ui/react-switch'
import { cn } from '@/shared/utils/cn'
import { forwardRef } from 'react'

export interface SwitchProps extends RadixSwitch.SwitchProps {
  label?: string
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="flex cursor-pointer items-center gap-3">
        <RadixSwitch.Root
          ref={ref}
          className={cn(
            'relative h-6 w-11 rounded-full border border-border bg-paper-tertiary transition-colors',
            'data-[state=checked]:border-accent data-[state=checked]:bg-accent',
            'focus:outline-none focus:ring-2 focus:ring-accent-soft focus:ring-offset-1 focus:ring-offset-paper',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        >
          <RadixSwitch.Thumb
            className={cn(
              'block h-4 w-4 translate-x-0.5 rounded-full bg-text-tertiary transition-transform',
              'data-[state=checked]:translate-x-[22px] data-[state=checked]:bg-white'
            )}
          />
        </RadixSwitch.Root>
        {label && <span className="text-sm text-text-secondary">{label}</span>}
      </label>
    )
  }
)

Switch.displayName = 'Switch'
