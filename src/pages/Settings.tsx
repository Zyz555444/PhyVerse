import { useEffect, useState } from 'react'
import { useTheme } from '@/shared/hooks/useTheme'
import { useI18n } from '@/shared/hooks/useI18n'
import { usePhysicsSettingsStore } from '@/features/settings/physicsSettingsStore'
import { Button } from '@/shared/ui/Button'
import { Slider } from '@/shared/ui/Slider'
import { Switch } from '@/shared/ui/Switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card'
import { RotateCcw, Download, Info, Palette, Globe, SlidersHorizontal } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const APP_VERSION = '1.1.6'

export function Settings() {
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useI18n()
  const {
    gravity,
    timestep,
    maxSubSteps,
    friction,
    restitution,
    allowSleep,
    setGravityY,
    setTimestep,
    setMaxSubSteps,
    setFriction,
    setRestitution,
    setAllowSleep,
    resetToDefaults,
  } = usePhysicsSettingsStore()

  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
  )

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === 'accepted') {
      setInstallPrompt(null)
    }
  }

  const gravityValue = Math.abs(gravity[1])
  const fpsValue = Math.round(1 / timestep)

  return (
    <div className="py-6">
      <h1 className="font-heading text-3xl text-text-primary">{t('nav.settings')}</h1>
      <p className="mt-2 text-text-secondary">{t('app.tagline')}</p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-accent" />
              {t('settings.theme')}
            </CardTitle>
            <CardDescription>Choose your preferred appearance.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-accent" />
              {t('settings.language')}
            </CardTitle>
            <CardDescription>Select the display language.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
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
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-accent" />
              {t('settings.physics')}
            </CardTitle>
            <CardDescription>
              Global physics defaults. Changes apply to new scenes and experiments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Slider
                label={t('settings.gravity')}
                value={[gravityValue]}
                min={0}
                max={30}
                step={0.1}
                valueFormatter={(v) => `${v.toFixed(1)} m/s²`}
                onValueChange={(v) => setGravityY(-v[0])}
              />
              <Slider
                label={t('settings.timestep')}
                value={[fpsValue]}
                min={30}
                max={120}
                step={10}
                valueFormatter={(v) => `${v} Hz`}
                onValueChange={(v) => setTimestep(1 / v[0])}
              />
              <Slider
                label={t('settings.maxSubSteps')}
                value={[maxSubSteps]}
                min={1}
                max={10}
                step={1}
                valueFormatter={(v) => `${v}`}
                onValueChange={(v) => setMaxSubSteps(v[0])}
              />
              <Slider
                label={t('settings.friction')}
                value={[friction]}
                min={0}
                max={1}
                step={0.01}
                valueFormatter={(v) => v.toFixed(2)}
                onValueChange={(v) => setFriction(v[0])}
              />
              <Slider
                label={t('settings.restitution')}
                value={[restitution]}
                min={0}
                max={1}
                step={0.01}
                valueFormatter={(v) => v.toFixed(2)}
                onValueChange={(v) => setRestitution(v[0])}
              />
              <div className="flex items-center justify-between rounded-lg border border-border bg-paper-tertiary p-4">
                <span className="text-sm font-medium text-text-primary">
                  {t('settings.allowSleep')}
                </span>
                <Switch checked={allowSleep} onCheckedChange={setAllowSleep} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                onClick={resetToDefaults}
              >
                {t('settings.resetDefaults')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-accent" />
              {t('settings.about')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-text-secondary">
              {t('settings.description')}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-text-tertiary">
                {t('settings.version')}: {APP_VERSION}
              </span>
              {installPrompt && !isInstalled && (
                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <span className="text-sm text-text-secondary">{t('settings.installPrompt')}</span>
                  <Button
                    size="sm"
                    leftIcon={<Download className="h-3.5 w-3.5" />}
                    onClick={handleInstall}
                  >
                    {t('settings.installButton')}
                  </Button>
                </div>
              )}
              {isInstalled && (
                <span className="text-sm text-text-secondary">{t('settings.installed')}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
