import { Link } from 'react-router-dom'
import { FlaskConical, Moon, Search, Sun, Globe } from 'lucide-react'
import { useTheme } from '@/shared/hooks/useTheme'
import { useI18n } from '@/shared/hooks/useI18n'
import { Button } from '@/shared/ui/Button'
import { Tooltip } from '@/shared/ui/Tooltip'
import { cn } from '@/shared/utils/cn'

export function Header() {
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage, t } = useI18n()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3 text-text-primary hover:text-accent">
          <FlaskConical className="h-6 w-6 text-accent" />
          <span className="font-heading text-xl font-semibold tracking-tight">{t('app.name')}</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            to="/"
            className="text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            {t('nav.home')}
          </Link>
          <Link
            to="/sandbox"
            className="text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            {t('nav.sandbox')}
          </Link>
          <Link
            to="/settings"
            className="text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            {t('nav.settings')}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder={t('common.search')}
              className={cn(
                'h-9 w-48 rounded-full border border-border bg-paper-secondary pl-9 pr-4',
                'text-sm text-text-primary placeholder:text-text-tertiary',
                'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent-soft'
              )}
            />
          </div>

          <Tooltip content={theme === 'light' ? t('theme.dark') : t('theme.light')}>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              aria-label={theme === 'light' ? t('theme.dark') : t('theme.light')}
              className="rounded-full px-2.5"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </Tooltip>

          <Tooltip content={language === 'zh' ? 'Switch to English' : '切换到中文'}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
              aria-label={language === 'zh' ? 'Switch to English' : '切换到中文'}
              className="rounded-full px-2.5"
            >
              <Globe className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
      </div>
    </header>
  )
}
