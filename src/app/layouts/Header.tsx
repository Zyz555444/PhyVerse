import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FlaskConical, Moon, Search, Sun, Globe, Menu, X, User, LogOut, Cloud } from 'lucide-react'
import { useTheme } from '@/shared/hooks/useTheme'
import { useI18n } from '@/shared/hooks/useI18n'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/shared/ui/Button'
import { Tooltip } from '@/shared/ui/Tooltip'
import { cn } from '@/shared/utils/cn'

export function Header() {
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage, t } = useI18n()
  const { user, logout, setIsOpen } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [searchValue, setSearchValue] = useState(searchParams.get('q') ?? '')
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!userMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [userMenuOpen])

  const handleSearch = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmed = searchValue.trim()
      if (trimmed) {
        navigate(`/?q=${encodeURIComponent(trimmed)}`)
      } else {
        navigate('/')
      }
    }
  }

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
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleSearch}
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

          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                className="flex h-8 items-center gap-2 rounded-full border border-border bg-paper-secondary pl-1 pr-3 text-xs font-medium text-text-primary transition-colors hover:border-border-strong"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <User className="h-3.5 w-3.5" />
                </div>
                <span className="hidden max-w-[80px] truncate sm:inline">
                  {user.displayName ?? user.email.split('@')[0]}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full z-20 mt-2 w-44 rounded-xl border border-border bg-paper py-1 shadow-lg">
                  <div className="border-b border-border px-3 py-2">
                    <p className="truncate text-xs font-medium text-text-primary">
                      {user.displayName ?? user.email.split('@')[0]}
                    </p>
                    <p className="truncate text-[10px] text-text-tertiary">{user.email}</p>
                  </div>
                  <Link
                    to="/sandbox"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text-secondary transition-colors hover:bg-accent-soft hover:text-accent"
                  >
                    <Cloud className="h-3.5 w-3.5" />
                    {t('cloud.title')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout()
                      setUserMenuOpen(false)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text-secondary transition-colors hover:bg-danger/10 hover:text-danger"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    {t('auth.logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => setIsOpen(true)}
              leftIcon={<User className="h-3.5 w-3.5" />}
            >
              {t('auth.login')}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="rounded-full px-2.5 md:hidden"
            aria-label={menuOpen ? t('common.close') : t('common.menu')}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-paper px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            <Link
              to="/"
              className="text-sm text-text-secondary transition-colors hover:text-text-primary"
              onClick={() => setMenuOpen(false)}
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/sandbox"
              className="text-sm text-text-secondary transition-colors hover:text-text-primary"
              onClick={() => setMenuOpen(false)}
            >
              {t('nav.sandbox')}
            </Link>
            <Link
              to="/settings"
              className="text-sm text-text-secondary transition-colors hover:text-text-primary"
              onClick={() => setMenuOpen(false)}
            >
              {t('nav.settings')}
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
