import { useParams } from 'react-router-dom'
import { useI18n } from '@/shared/hooks/useI18n'

export function Experiment() {
  const { category, experimentId } = useParams<{ category: string; experimentId: string }>()
  const { t } = useI18n()

  return (
    <div className="py-10">
      <h1 className="font-heading text-3xl text-text-primary">{t('experiment.start')}</h1>
      <p className="mt-2 text-text-secondary">
        {category} / {experimentId}
      </p>
      <div className="mt-8 flex h-96 items-center justify-center rounded-xl border border-dashed border-border bg-paper-secondary">
        <p className="text-text-tertiary">{t('common.loading')}</p>
      </div>
    </div>
  )
}
