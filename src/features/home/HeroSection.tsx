import { Link } from 'react-router-dom'
import { ArrowRight, FlaskConical, Sparkles } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { useI18n } from '@/shared/hooks/useI18n'
import { getAllExperiments } from '@/features/experiments/registry'
import { EXPERIMENT_CATEGORIES } from '@/shared/constants/experiments'

export function HeroSection() {
  const { t } = useI18n()
  const experimentCount = getAllExperiments().length
  const categoryCount = EXPERIMENT_CATEGORIES.length

  return (
    <section className="relative overflow-hidden py-20 text-center md:py-28">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04]">
        <FlaskConical className="h-96 w-96 text-accent" />
      </div>

      <div className="relative">
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-paper-secondary px-3 py-1 text-xs text-text-secondary">
          <Sparkles className="h-3 w-3 text-accent" />
          3D · 实时物理 · 交互式
        </div>

        <h1 className="mb-4 font-heading text-5xl font-semibold tracking-tight text-text-primary md:text-6xl">
          {t('app.name')}
        </h1>

        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-text-secondary md:text-xl">
          {t('app.tagline')}
        </p>

        <div className="mt-6 flex justify-center gap-6 text-sm">
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading text-2xl font-semibold text-accent">
              {experimentCount}
            </span>
            <span className="text-text-tertiary">个实验</span>
          </div>
          <span className="text-border" aria-hidden>
            |
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading text-2xl font-semibold text-accent">{categoryCount}</span>
            <span className="text-text-tertiary">大学科</span>
          </div>
          <span className="text-border" aria-hidden>
            |
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading text-2xl font-semibold text-accent">3D</span>
            <span className="text-text-tertiary">实时渲染</span>
          </div>
        </div>

        <div className="mt-10 flex justify-center gap-3">
          <a href="#experiments">
            <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              {t('experiment.start')}
            </Button>
          </a>
          <Link to="/sandbox">
            <Button variant="secondary" size="lg">
              {t('nav.sandbox')}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
