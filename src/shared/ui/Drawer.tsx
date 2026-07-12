import * as RadixDialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import type { ReactNode } from 'react'

export type DrawerDirection = 'left' | 'right' | 'bottom'

export interface DrawerProps extends RadixDialog.DialogProps {
  children: ReactNode
  title?: string
  description?: string
  direction?: DrawerDirection
  showCloseButton?: boolean
}

const directionClasses: Record<DrawerDirection, string> = {
  left: 'inset-y-0 left-0 h-full w-full max-w-sm rounded-r-xl',
  right: 'inset-y-0 right-0 h-full w-full max-w-sm rounded-l-xl',
  bottom: 'inset-x-0 bottom-0 h-auto max-h-[80vh] w-full rounded-t-xl',
}

const enterClasses: Record<DrawerDirection, string> = {
  left: 'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
  right:
    'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
  bottom:
    'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
}

export function Drawer({
  children,
  title,
  description,
  direction = 'right',
  showCloseButton = true,
  ...props
}: DrawerProps) {
  return (
    <RadixDialog.Root {...props}>
      {children}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <RadixDialog.Content
          className={cn(
            'fixed z-50 border border-border bg-paper p-6 shadow-lg',
            directionClasses[direction],
            enterClasses[direction]
          )}
        >
          {title && (
            <RadixDialog.Title className="font-heading text-xl text-text-primary">
              {title}
            </RadixDialog.Title>
          )}
          {description && (
            <RadixDialog.Description className="mt-1 text-sm text-text-secondary">
              {description}
            </RadixDialog.Description>
          )}
          <div className="mt-4">{children}</div>
          {showCloseButton && (
            <RadixDialog.Close asChild>
              <button
                type="button"
                className="absolute right-4 top-4 rounded-full p-1 text-text-tertiary transition-colors hover:bg-paper-secondary hover:text-text-primary"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </RadixDialog.Close>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const DrawerTrigger = RadixDialog.Trigger
// eslint-disable-next-line react-refresh/only-export-components
export const DrawerClose = RadixDialog.Close
