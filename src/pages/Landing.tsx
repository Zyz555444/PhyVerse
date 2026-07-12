import { useI18n } from '@/shared/hooks/useI18n'
import { Beaker, Magnet, Eye, Thermometer, Atom } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card'
import { cn } from '@/shared/utils/cn'

const categories = [
  { id: 'mechanics', icon: Beaker, color: 'text-accent' },
  { id: 'electromagnetism', icon: Magnet, color: 'text-accent' },
  { id: 'optics', icon: Eye, color: 'text-accent' },
  { id: 'thermal', icon: Thermometer, color: 'text-accent' },
  { id: 'modern', icon: Atom, color: 'text-accent' },
] as const

export function Landing() {
  const { t } = useI18n()

  return (
    <div className="py-16 md:py-24">
      <section className="mb-20 text-center">
        <h1 className="mb-6 font-heading text-4xl font-medium tracking-tight text-text-primary md:text-5xl">
          {t('app.name')}
        </h1>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-text-secondary">
          {t('app.tagline')}
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link to="/sandbox">
            <Button>{t('nav.sandbox')}</Button>
          </Link>
          <Link to="/settings">
            <Button variant="secondary">{t('nav.settings')}</Button>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-10 text-center font-heading text-2xl text-text-primary">
          {t('experiment.start')}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map(({ id, icon: Icon, color }) => (
            <Card key={id} isHoverable>
              <CardHeader className="mb-4 flex flex-row items-center gap-3">
                <Icon className={cn('h-6 w-6', color)} />
                <CardTitle>{t(`experiment.${id}`)}</CardTitle>
              </CardHeader>
              <CardDescription>{t('common.empty')}</CardDescription>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
