import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useI18n } from '@/shared/hooks/useI18n'
import { getAllExperiments } from '@/features/experiments/registry'
import { HeroSection } from '@/features/home/HeroSection'
import { QuickStart } from '@/features/home/QuickStart'
import { ExperimentSearch } from '@/features/home/ExperimentSearch'
import { Footer } from '@/features/home/Footer'

export function Landing() {
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''

  const allExperiments = useMemo(() => getAllExperiments(), [])

  return (
    <div>
      <HeroSection />

      <QuickStart />

      <section id="experiments" className="scroll-mt-20 py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-heading text-2xl font-medium text-text-primary">
            {t('experiment.start')}
          </h2>
          <span className="text-sm text-text-tertiary">共 {allExperiments.length} 个实验</span>
        </div>

        <ExperimentSearch key={query} experiments={allExperiments} initialQuery={query} />
      </section>

      <Footer />
    </div>
  )
}
