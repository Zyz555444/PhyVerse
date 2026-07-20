import { Button } from '@/shared/ui/Button'
import { RotateCcw, ChevronLeft, ChevronRight, Check } from 'lucide-react'

interface StepNavigatorProps {
  isLastStep: boolean
  currentStepIndex: number
  onReset: () => void
  onPrev?: () => void
  onNext: () => void
  onFinish: () => void
  resetLabel?: string
  prevLabel?: string
  nextLabel?: string
  finishLabel?: string
  showReset?: boolean
}

export function StepNavigator({
  isLastStep,
  currentStepIndex,
  onReset,
  onPrev,
  onNext,
  onFinish,
  resetLabel = 'Reset',
  prevLabel = 'Previous',
  nextLabel = 'Next',
  finishLabel = 'Finish',
  showReset = true,
}: StepNavigatorProps) {
  return (
    <div className="mt-auto flex items-center justify-between gap-2">
      {showReset && (
        <Button variant="ghost" size="sm" onClick={onReset} className="gap-1">
          <RotateCcw className="h-3.5 w-3.5" />
          {resetLabel}
        </Button>
      )}
      <div className="flex gap-2">
        {onPrev && currentStepIndex > 0 && (
          <Button variant="ghost" size="sm" onClick={onPrev}>
            <ChevronLeft className="h-3.5 w-3.5" />
            {prevLabel}
          </Button>
        )}
        <Button size="sm" onClick={isLastStep ? onFinish : onNext}>
          {isLastStep ? (
            <>
              <Check className="h-3.5 w-3.5" />
              {finishLabel}
            </>
          ) : (
            <>
              {nextLabel}
              <ChevronRight className="h-3.5 w-3.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
