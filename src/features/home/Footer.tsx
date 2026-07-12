import { Link } from 'react-router-dom'
import { FlaskConical, Heart } from 'lucide-react'
import { useI18n } from '@/shared/hooks/useI18n'

export function Footer() {
  const { t, language } = useI18n()

  return (
    <footer className="mt-20 border-t border-border bg-paper-secondary">
      <div className="py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-accent" />
              <span className="font-heading text-lg font-semibold text-text-primary">
                {t('app.name')}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-text-tertiary">{t('app.tagline')}</p>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              {language === 'zh' ? '导航' : 'Navigation'}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-text-secondary transition-colors hover:text-accent">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link
                  to="/sandbox"
                  className="text-text-secondary transition-colors hover:text-accent"
                >
                  {t('nav.sandbox')}
                </Link>
              </li>
              <li>
                <Link
                  to="/settings"
                  className="text-text-secondary transition-colors hover:text-accent"
                >
                  {t('nav.settings')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              {language === 'zh' ? '技术栈' : 'Tech Stack'}
            </h4>
            <ul className="flex flex-wrap gap-1.5">
              {['React 19', 'Three.js', 'Rapier', 'Vite', 'Tailwind'].map((tech) => (
                <li
                  key={tech}
                  className="rounded border border-border bg-paper px-2 py-0.5 text-xs text-text-secondary"
                >
                  {tech}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              {language === 'zh' ? '项目' : 'Project'}
            </h4>
            <a
              href="https://github.com/Zyz555444/PhyVerse"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-accent"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              GitHub
            </a>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-1.5 border-t border-border pt-6 text-xs text-text-tertiary">
          <span>{language === 'zh' ? '用' : 'Made with'} </span>
          <Heart className="h-3 w-3 fill-danger text-danger" />
          <span>{language === 'zh' ? '制作 · MIT 许可证 · 2026' : '· MIT License · 2026'}</span>
        </div>
      </div>
    </footer>
  )
}
