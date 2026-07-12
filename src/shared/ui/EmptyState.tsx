import { cn } from '@/shared/utils/cn'
import type { ReactNode } from 'react'

export interface EmptyStateProps {
  icon?: ReactNode
  title?: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-paper-secondary p-10 text-center',
        className
      )}
    >
      {icon && <div className="mb-4 text-text-tertiary">{icon}</div>}
      {title && <h3 className="font-heading text-lg text-text-primary">{title}</h3>}
      {description && <p className="mt-1 max-w-xs text-sm text-text-secondary">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
