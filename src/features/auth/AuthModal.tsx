import { useEffect, useId, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Sparkles, FlaskConical, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from './AuthContext'
import { useI18n } from '@/shared/hooks/useI18n'
import { Dialog, DialogClose } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { cn } from '@/shared/utils/cn'

type AuthMode = 'login' | 'register'

export function AuthModal() {
  const { t } = useI18n()
  const { isOpen, setIsOpen, login, register, isLoading, error, clearError } = useAuth()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const emailId = useId()
  const passwordId = useId()
  const nameId = useId()

  useEffect(() => {
    if (isOpen) {
      setEmail('')
      setPassword('')
      setDisplayName('')
      setValidationErrors({})
      clearError()
    }
  }, [isOpen, clearError])

  useEffect(() => {
    setValidationErrors({})
    clearError()
  }, [mode, clearError])

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      errors.email = t('auth.emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      errors.email = t('auth.emailInvalid')
    }

    if (!password) {
      errors.password = t('auth.passwordRequired')
    } else if (mode === 'register' && password.length < 6) {
      errors.password = t('auth.passwordMinLength')
    }

    if (mode === 'register' && !displayName.trim()) {
      errors.displayName = t('auth.displayNameRequired')
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    if (mode === 'login') {
      await login(email, password)
    } else {
      await register(email, password, displayName.trim())
    }
  }

  const toggleMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'))
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={setIsOpen}
      showCloseButton={false}
      className="max-w-4xl overflow-hidden p-0 md:rounded-2xl"
    >
      <div className="grid min-h-[520px] overflow-hidden md:grid-cols-2">
        {/* Decorative brand panel */}
        <div
          className={cn(
            'relative hidden h-full flex-col justify-between overflow-hidden bg-gradient-to-br p-8 md:flex',
            'from-accent via-accent-hover to-accent-soft',
            'after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-20 after:bg-gradient-to-r after:from-transparent after:to-white/25'
          )}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-white/90">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <FlaskConical className="h-5 w-5 text-white" />
              </div>
              <span className="font-heading text-lg font-semibold text-white">{t('app.name')}</span>
            </div>
          </div>

          <div className="relative z-10">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <h3 className="font-heading text-2xl font-bold text-white">
                {mode === 'login' ? t('auth.welcomeBack') : t('auth.joinUs')}
              </h3>
              <p className="mt-2 max-w-[240px] text-sm leading-relaxed text-white/80">
                {mode === 'login' ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
              </p>
            </motion.div>
          </div>

          {/* Animated background particles */}
          <div className="pointer-events-none absolute inset-0 z-0">
            <div className="absolute -left-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-12 right-[-20px] h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute left-1/2 top-1/3 h-2 w-2 rounded-full bg-white/40" />
            <div className="absolute left-[20%] top-[45%] h-1.5 w-1.5 rounded-full bg-white/30" />
            <div className="absolute right-[25%] top-[60%] h-2.5 w-2.5 rounded-full bg-white/20" />
          </div>
        </div>

        {/* Form panel */}
        <div className="relative flex flex-col bg-paper p-6 md:p-8">
          <DialogClose asChild>
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full p-1.5 text-text-tertiary transition-colors hover:bg-paper-secondary hover:text-text-primary"
              aria-label={t('common.close')}
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

          <div className="mb-6 flex items-center gap-3 md:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft">
              <Sparkles className="h-4 w-4 text-accent" />
            </div>
            <span className="font-heading text-lg font-semibold text-text-primary">
              {t('app.name')}
            </span>
          </div>

          <div className="mb-6">
            <h2 className="font-heading text-xl font-semibold text-text-primary">
              {mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {mode === 'login' ? t('auth.loginDescription') : t('auth.registerDescription')}
            </p>
          </div>

          {/* Mode tabs */}
          <div className="mb-6 inline-flex rounded-lg border border-border bg-paper-secondary p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={cn(
                'flex-1 rounded-md px-4 py-1.5 text-xs font-medium transition-all',
                mode === 'login'
                  ? 'bg-paper text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {t('auth.loginTab')}
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={cn(
                'flex-1 rounded-md px-4 py-1.5 text-xs font-medium transition-all',
                mode === 'register'
                  ? 'bg-paper text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {t('auth.registerTab')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Input
                    id={nameId}
                    label={t('auth.displayName')}
                    placeholder={t('auth.displayNamePlaceholder')}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    error={validationErrors.displayName}
                    leftIcon={<User className="h-4 w-4 text-text-tertiary" />}
                    required
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Input
              id={emailId}
              type="email"
              label={t('auth.email')}
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={validationErrors.email}
              leftIcon={<Mail className="h-4 w-4 text-text-tertiary" />}
              required
            />

            <div className="relative">
              <Input
                id={passwordId}
                type={showPassword ? 'text' : 'password'}
                label={t('auth.password')}
                placeholder={t('auth.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={validationErrors.password}
                leftIcon={<Lock className="h-4 w-4 text-text-tertiary" />}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-[34px] text-text-tertiary transition-colors hover:text-text-primary"
                tabIndex={-1}
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-danger"
                >
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              isLoading={isLoading}
              fullWidth
              className="mt-1"
              leftIcon={mode === 'register' ? <Sparkles className="h-4 w-4" /> : undefined}
            >
              {mode === 'login' ? t('auth.loginButton') : t('auth.registerButton')}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-text-secondary">
            {mode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="font-medium text-accent transition-colors hover:text-accent-hover"
            >
              {mode === 'login' ? t('auth.registerNow') : t('auth.loginNow')}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
