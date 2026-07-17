import * as RadixDialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import type { ReactNode } from 'react'

export interface DialogProps extends RadixDialog.DialogProps {
  children: ReactNode
  title?: string
  description?: string
  footer?: ReactNode
  showCloseButton?: boolean
  className?: string
}

export function Dialog({
  children,
  title,
  description,
  footer,
  showCloseButton = true,
  className,
  ...props
}: DialogProps) {
  return (
    <RadixDialog.Root {...props}>
      {children}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <RadixDialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2',
            'rounded-xl border border-border bg-paper p-6 shadow-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            className
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
          {footer && <div className="mt-6 flex items-center justify-end gap-3">{footer}</div>}
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
export const DialogTrigger = RadixDialog.Trigger
// eslint-disable-next-line react-refresh/only-export-components
export const DialogClose = RadixDialog.Close
