import * as RadixTooltip from '@radix-ui/react-tooltip'
import { cn } from '@/shared/utils/cn'
import type { ReactNode } from 'react'

export interface TooltipProps {
  children: ReactNode
  content: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  delayDuration?: number
}

export function Tooltip({
  children,
  content,
  side = 'top',
  align = 'center',
  delayDuration = 200,
}: TooltipProps) {
  return (
    <RadixTooltip.Provider delayDuration={delayDuration}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            align={align}
            sideOffset={6}
            className={cn(
              'z-50 max-w-xs rounded-lg border border-border bg-paper-secondary px-3 py-2 text-xs text-text-primary shadow-md',
              'transition-opacity duration-fast data-[state=delayed-open]:opacity-100 data-[state=closed]:opacity-0'
            )}
          >
            {content}
            <RadixTooltip.Arrow className="fill-paper-secondary" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  )
}
