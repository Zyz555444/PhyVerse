import { useMemo } from 'react'
import { useI18n } from '@/shared/hooks/useI18n'
import { Beaker, Magnet, Eye, Thermometer, Atom, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Badge } from '@/shared/ui/Badge'
import { cn } from '@/shared/utils/cn'
import { getAllExperiments } from '@/features/experiments/registry'
import type { ExperimentCategory } from '@/shared/types/experiment'

const categories = [
  { id: 'mechanics' as ExperimentCategory, icon: Beaker },
  { id: 'electromagnetism' as ExperimentCategory, icon: Magnet },
  { id: 'optics' as ExperimentCategory, icon: Eye },
  { id: 'thermal' as ExperimentCategory, icon: Thermometer },
  { id: 'modern' as ExperimentCategory, icon: Atom },
] as const

export function Landing() {
  const { t, language } = useI18n()

  const allExperiments = useMemo(() => getAllExperiments(), [])

  const grouped = useMemo(() => {
    const map = new Map<ExperimentCategory, typeof allExperiments>()
    for (const cat of categories) {
      map.set(cat.id, [])
    }
    for (const exp of allExperiments) {
      const list = map.get(exp.category)
      if (list) list.push(exp)
    }
    return map
  }, [allExperiments])

  return (
    <div className="py-12 md:py-16">
      <section className="mb-16 text-center">
        <h1 className="mb-4 font-heading text-4xl font-medium tracking-tight text-text-primary md:text-5xl">
          {t('app.name')}
        </h1>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-text-secondary">
          {t('app.tagline')}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/sandbox">
            <Button>{t('nav.sandbox')}</Button>
          </Link>
          <a href="#experiments">
            <Button variant="secondary" rightIcon={<ArrowRight className="h-4 w-4" />}>
              {t('experiment.start')}
            </Button>
          </a>
        </div>
      </section>

      <section id="experiments">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-heading text-2xl text-text-primary">{t('experiment.start')}</h2>
          <span className="text-sm text-text-tertiary">共 {allExperiments.length} 个实验</span>
        </div>

        <div className="space-y-10">
          {categories.map(({ id, icon: Icon }) => {
            const experiments = grouped.get(id) ?? []
            if (experiments.length === 0) return null
            return (
              <div key={id}>
                <div className="mb-4 flex items-center gap-2">
                  <Icon className="h-5 w-5 text-accent" />
                  <h3 className="font-heading text-lg font-medium text-text-primary">
                    {t(`experiment.${id}`)}
                  </h3>
                  <span className="text-xs text-text-tertiary">({experiments.length})</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {experiments
                    .slice()
                    .sort((a, b) => a.id.localeCompare(b.id))
                    .map((exp) => {
                      const difficultyLabel =
                        exp.difficulty <= 1
                          ? t('experiment.difficulty.easy')
                          : exp.difficulty <= 2
                            ? t('experiment.difficulty.medium')
                            : t('experiment.difficulty.hard')
                      return (
                        <Link
                          key={exp.id}
                          to={`/experiment/${exp.category}/${exp.id}`}
                          className="block"
                        >
                          <Card isHoverable className="h-full">
                            <CardHeader className="mb-2 flex flex-row items-center justify-between gap-2">
                              <CardTitle className="text-base">{exp.name[language]}</CardTitle>
                              <Badge variant="outline">{exp.id}</Badge>
                            </CardHeader>
                            <CardDescription className="line-clamp-3">
                              {exp.description[language]}
                            </CardDescription>
                            <div className="mt-3 flex items-center gap-2 text-xs text-text-tertiary">
                              <span
                                className={cn(
                                  'inline-flex h-1.5 w-1.5 rounded-full',
                                  exp.difficulty <= 1
                                    ? 'bg-success'
                                    : exp.difficulty <= 2
                                      ? 'bg-warning'
                                      : 'bg-danger'
                                )}
                              />
                              {difficultyLabel}
                              <span aria-hidden>·</span>
                              <span>{exp.formulas.length} 公式</span>
                              <span aria-hidden>·</span>
                              <span>{exp.guideSteps.length} 步骤</span>
                            </div>
                          </Card>
                        </Link>
                      )
                    })}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
