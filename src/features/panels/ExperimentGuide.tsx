import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { useExperimentStore } from './experimentStore'
import { useI18n } from '@/shared/hooks/useI18n'
import type { GuideStep } from '@/shared/types/experiment'

interface ExperimentGuideProps {
  steps: GuideStep[]
}

export function ExperimentGuide({ steps }: ExperimentGuideProps) {
  const { language } = useI18n()
  const currentStep = useExperimentStore((s) => s.currentStep)
  const nextStep = useExperimentStore((s) => s.nextStep)
  const prevStep = useExperimentStore((s) => s.prevStep)

  if (steps.length === 0) {
    return <p className="px-1 text-sm text-text-tertiary">该实验没有引导步骤。</p>
  }

  const step = steps[Math.min(currentStep, steps.length - 1)]
  const isLast = currentStep >= steps.length - 1
  const isFirst = currentStep <= 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-text-tertiary">
        <span>
          步骤 {currentStep + 1} / {steps.length}
        </span>
      </div>

      <div className="rounded-lg border border-border bg-paper-tertiary p-4">
        <h4 className="mb-2 font-heading text-base font-medium text-text-primary">
          {step.title[language]}
        </h4>
        <p className="text-sm leading-relaxed text-text-secondary">{step.description[language]}</p>

        {step.hint && (
          <div className="mt-3 flex items-start gap-2 rounded-md bg-accent-soft/50 p-2.5">
            <Lightbulb className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-accent" />
            <p className="text-xs leading-relaxed text-accent">{step.hint[language]}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={prevStep}
          disabled={isFirst}
          leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
        >
          上一步
        </Button>
        <Button
          variant="soft"
          size="sm"
          onClick={nextStep}
          disabled={isLast}
          rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
        >
          下一步
        </Button>
      </div>
    </div>
  )
}
