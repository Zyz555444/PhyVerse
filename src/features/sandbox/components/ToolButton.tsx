import { cn } from '@/shared/utils/cn'
import type { Undo2 } from 'lucide-react'

export interface ToolButtonProps {
  icon: typeof Undo2
  onClick: () => void
  title: string
  active?: boolean
  disabled?: boolean
  size?: 'sm' | 'md'
}

export function ToolButton({
  icon: Icon,
  onClick,
  title,
  active,
  disabled,
  size = 'md',
}: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'flex items-center justify-center rounded-lg border transition-colors',
        size === 'sm' ? 'h-7 w-7' : 'h-8 w-8',
        active
          ? 'border-accent bg-accent-soft text-accent'
          : 'border-border bg-paper text-text-secondary hover:border-border-strong hover:text-text-primary',
        disabled && 'cursor-not-allowed opacity-40 hover:border-border hover:text-text-secondary'
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  )
}

export function Divider() {
  return <div className="h-5 w-px bg-border" />
}
