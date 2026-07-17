import { useAuth } from '@/features/auth/AuthContext'
import { useI18n } from '@/shared/hooks/useI18n'
import { Dialog, DialogClose } from '@/shared/ui/Dialog'
import { Cpu, Sparkles } from 'lucide-react'
import { AiSettingsPanel } from './AiSettingsPanel'

export interface AiSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AiSettingsModal({ open, onOpenChange }: AiSettingsModalProps) {
  const { t } = useI18n()
  const { user } = useAuth()

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-lg overflow-hidden p-0">
      <div className="grid md:grid-cols-[1fr_1.6fr]">
        {/* Left panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-accent via-accent-hover to-accent-soft p-6 md:flex">
          <div className="relative z-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="font-heading text-xl font-bold text-white">{t('ai.settings.title')}</h3>
            <p className="mt-2 text-xs leading-relaxed text-white/80">
              {t('ai.settings.subtitle')}
            </p>
          </div>
          <div className="pointer-events-none absolute inset-0 z-0">
            <div className="absolute -left-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-8 right-[-10px] h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col bg-paper p-5">
          <div className="mb-4 flex items-center justify-between md:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft">
                <Cpu className="h-4 w-4 text-accent" />
              </div>
              <span className="font-heading text-sm font-semibold text-text-primary">
                {t('ai.settings.title')}
              </span>
            </div>
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-full p-1.5 text-text-tertiary hover:bg-paper-secondary hover:text-text-primary"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </DialogClose>
          </div>

          <DialogClose asChild>
            <button
              type="button"
              className="absolute right-4 top-4 hidden rounded-full p-1.5 text-text-tertiary hover:bg-paper-secondary hover:text-text-primary md:block"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </DialogClose>

          {user ? (
            <AiSettingsPanel />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <Cpu className="h-10 w-10 text-text-tertiary" />
              <p className="text-sm text-text-secondary">{t('ai.settings.signInRequired')}</p>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  )
}
