import { Link } from 'react-router-dom'
import { useI18n } from '@/shared/hooks/useI18n'

export function NotFound() {
  const { t } = useI18n()

  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <h1 className="font-heading text-6xl font-medium text-text-tertiary">404</h1>
      <p className="mt-4 text-lg text-text-secondary">{t('common.empty')}</p>
      <Link
        to="/"
        className="mt-8 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        {t('nav.home')}
      </Link>
    </div>
  )
}
