import { cn } from '@/shared/utils/cn'

interface StepCardProps {
  stepNumber: number
  totalSteps?: number
  title: string
  description: string
  hint?: string
  hintLabel?: string
  badgeVariant?: 'badge' | 'text'
  children?: React.ReactNode
  className?: string
}

export function StepCard({
  stepNumber,
  totalSteps,
  title,
  description,
  hint,
  hintLabel,
  badgeVariant = 'badge',
  children,
  className,
}: StepCardProps) {
  return (
    <div className={cn('space-y-3 rounded-lg border border-border bg-paper p-3', className)}>
      <div className="flex items-center gap-2">
        {badgeVariant === 'badge' ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-soft text-[10px] font-bold text-accent">
            {stepNumber}
          </span>
        ) : (
          totalSteps && (
            <span className="text-xs font-semibold text-accent">
              {stepNumber}/{totalSteps}
            </span>
          )
        )}
        <span className="text-xs font-semibold text-text-primary">{title}</span>
      </div>
      <p className="text-xs leading-relaxed text-text-secondary">{description}</p>
      {hint && (
        <p className="rounded bg-background px-2.5 py-1.5 text-[11px] leading-relaxed italic text-text-tertiary">
          {hintLabel ? `${hintLabel}: ` : ''}
          {hint}
        </p>
      )}
      {children}
    </div>
  )
}
