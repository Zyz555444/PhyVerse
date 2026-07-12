import { Link } from 'react-router-dom'
import { Card, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Badge } from '@/shared/ui/Badge'
import { useI18n } from '@/shared/hooks/useI18n'
import { cn } from '@/shared/utils/cn'
import type { ExperimentDefinition } from '@/shared/types/experiment'

interface ExperimentCardProps {
  experiment: ExperimentDefinition
}

export function ExperimentCard({ experiment }: ExperimentCardProps) {
  const { t, language } = useI18n()

  const difficultyLabel =
    experiment.difficulty <= 1
      ? t('experiment.difficulty.easy')
      : experiment.difficulty <= 2
        ? t('experiment.difficulty.medium')
        : t('experiment.difficulty.hard')

  const difficultyColor =
    experiment.difficulty <= 1
      ? 'bg-success'
      : experiment.difficulty <= 2
        ? 'bg-warning'
        : 'bg-danger'

  return (
    <Link to={`/experiment/${experiment.category}/${experiment.id}`} className="block">
      <Card isHoverable className="h-full">
        <CardHeader className="mb-2 flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">{experiment.name[language]}</CardTitle>
          <Badge variant="outline">{experiment.id}</Badge>
        </CardHeader>
        <CardDescription className="line-clamp-3">
          {experiment.description[language]}
        </CardDescription>
        <div className="mt-3 flex items-center gap-2 text-xs text-text-tertiary">
          <span className={cn('inline-flex h-1.5 w-1.5 rounded-full', difficultyColor)} />
          {difficultyLabel}
          <span aria-hidden>·</span>
          <span>{experiment.formulas.length} 公式</span>
          <span aria-hidden>·</span>
          <span>{experiment.guideSteps.length} 步骤</span>
        </div>
      </Card>
    </Link>
  )
}
