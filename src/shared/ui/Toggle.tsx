import * as RadixToggle from '@radix-ui/react-toggle'
import { cn } from '@/shared/utils/cn'
import { forwardRef, type ReactNode } from 'react'

export interface ToggleProps extends RadixToggle.ToggleProps {
  children: ReactNode
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <RadixToggle.Root
        ref={ref}
        className={cn(
          'inline-flex h-10 items-center justify-center rounded-lg border border-border',
          'bg-paper-secondary px-3 text-sm font-medium text-text-secondary',
          'transition-colors hover:border-border-strong hover:text-text-primary',
          'focus:outline-none focus:ring-2 focus:ring-accent-soft focus:ring-offset-1 focus:ring-offset-paper',
          'disabled:pointer-events-none disabled:opacity-50',
          'data-[state=on]:border-accent data-[state=on]:bg-accent-soft data-[state=on]:text-accent',
          className
        )}
        {...props}
      >
        {children}
      </RadixToggle.Root>
    )
  }
)

Toggle.displayName = 'Toggle'
