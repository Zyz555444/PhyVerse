import { cn } from '@/shared/utils/cn'

interface StepProgressProps {
  current: number
  total: number
  showDots?: boolean
  showText?: boolean
  className?: string
}

export function StepProgress({
  current,
  total,
  showDots = false,
  showText = false,
  className,
}: StepProgressProps) {
  const progress = ((current + 1) / total) * 100

  return (
    <div className={cn('space-y-1', className)}>
      {showText && (
        <div className="flex justify-between text-[10px] text-text-tertiary">
          <span>
            {current + 1}/{total}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      {showDots && (
        <div className="flex justify-center gap-1">
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i <= current ? 'w-4 bg-accent' : 'w-1.5 bg-border'
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
