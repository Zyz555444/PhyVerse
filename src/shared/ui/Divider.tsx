import { cn } from '@/shared/utils/cn'
import type { HTMLAttributes } from 'react'

export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
  label?: string
}

export function Divider({ className, orientation = 'horizontal', label, ...props }: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
        className={cn('mx-3 inline-block h-4 w-px self-stretch bg-border', className)}
        {...props}
      />
    )
  }

  if (label) {
    return (
      <div className={cn('flex items-center gap-4', className)} {...props}>
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-text-tertiary">{label}</span>
        <div className="h-px flex-1 bg-border" />
      </div>
    )
  }

  return <div className={cn('h-px w-full bg-border', className)} {...props} />
}
