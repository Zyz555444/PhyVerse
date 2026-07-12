import { useTheme } from '@/shared/hooks/useTheme'
import { useI18n } from '@/shared/hooks/useI18n'
import { Button } from '@/shared/ui/Button'

export function Settings() {
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useI18n()

  return (
    <div className="py-10">
      <h1 className="font-heading text-3xl text-text-primary">{t('nav.settings')}</h1>

      <div className="mt-8 space-y-6">
        <section className="rounded-xl border border-border bg-paper-secondary p-6">
          <h2 className="mb-4 font-heading text-xl text-text-primary">{t('settings.theme')}</h2>
          <div className="flex gap-3">
            {(['light', 'dark'] as const).map((value) => (
              <Button
                key={value}
                type="button"
                variant={theme === value ? 'soft' : 'secondary'}
                onClick={() => setTheme(value)}
              >
                {t(`theme.${value}`)}
              </Button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-paper-secondary p-6">
          <h2 className="mb-4 font-heading text-xl text-text-primary">{t('settings.language')}</h2>
          <div className="flex gap-3">
            {(['zh', 'en'] as const).map((value) => (
              <Button
                key={value}
                type="button"
                variant={language === value ? 'soft' : 'secondary'}
                onClick={() => setLanguage(value)}
              >
                {t(`language.${value}`)}
              </Button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
