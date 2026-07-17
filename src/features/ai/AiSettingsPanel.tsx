import { useEffect, useId, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cpu,
  Save,
  Trash2,
  AlertCircle,
  Check,
  Loader2,
  Eye,
  EyeOff,
  Shield,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { useI18n } from '@/shared/hooks/useI18n'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { cn } from '@/shared/utils/cn'
import {
  fetchAiConfig,
  fetchAiPublicKey,
  saveAiConfig,
  deleteAiConfig,
  sendAiChat,
} from './aiConfigApi'
import { AI_PROVIDERS } from './aiConfigTypes'
import { rsaEncrypt } from './rsaCrypto'
import type { AiConfig } from './aiConfigTypes'

export function AiSettingsPanel() {
  const { t } = useI18n()
  const { user } = useAuth()
  const [provider, setProvider] = useState('openai')
  const [endpoint, setEndpoint] = useState('')
  const [model, setModel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [config, setConfig] = useState<AiConfig | null>(null)
  const endpointId = useId()
  const modelId = useId()
  const apiKeyId = useId()

  const selectedProvider = useMemo(
    () => AI_PROVIDERS.find((p) => p.id === provider) ?? AI_PROVIDERS[AI_PROVIDERS.length - 1],
    [provider]
  )

  useEffect(() => {
    if (!user) return
    setError(null)
    setSuccess(null)
    setIsLoading(true)
    fetchAiConfig()
      .then(({ config: cfg }) => {
        setConfig(cfg)
        if (cfg) {
          setProvider(cfg.provider)
          setEndpoint(cfg.endpoint)
          setModel(cfg.model)
        } else {
          setProvider('openai')
          setEndpoint(AI_PROVIDERS[0].defaultEndpoint)
          setModel(AI_PROVIDERS[0].defaultModel)
        }
        setApiKey('')
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [user])

  useEffect(() => {
    if (!config) {
      setEndpoint(selectedProvider.defaultEndpoint)
      setModel(selectedProvider.defaultModel)
    }
  }, [provider, selectedProvider, config])

  const handleSave = async () => {
    setError(null)
    setSuccess(null)

    if (!endpoint.trim() || !model.trim() || !apiKey.trim()) {
      setError(t('ai.settings.allFieldsRequired'))
      return
    }

    setIsSaving(true)
    try {
      const { publicKey } = await fetchAiPublicKey()
      const encryptedApiKey = await rsaEncrypt(apiKey.trim(), publicKey)
      const { config: saved } = await saveAiConfig({
        provider,
        endpoint: endpoint.trim(),
        model: model.trim(),
        encryptedApiKey,
      })
      setConfig(saved)
      setApiKey('')
      setSuccess(t('ai.settings.saveSuccess'))
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('ai.settings.saveError'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(t('ai.settings.deleteConfirm'))) return
    setError(null)
    setSuccess(null)
    try {
      await deleteAiConfig()
      setConfig(null)
      setApiKey('')
      setSuccess(t('ai.settings.deleteSuccess'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('ai.settings.deleteError'))
    }
  }

  const handleTest = async () => {
    setError(null)
    setSuccess(null)
    setIsTesting(true)
    try {
      const response = await sendAiChat({
        messages: [{ role: 'user', content: 'Say "OK" only.' }],
        stream: false,
        max_tokens: 5,
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || `Test failed: ${response.status}`)
      }
      setSuccess(t('ai.settings.testSuccess'))
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('ai.settings.testError'))
    } finally {
      setIsTesting(false)
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-paper-secondary p-8 text-center">
        <Cpu className="h-10 w-10 text-text-tertiary" />
        <p className="text-sm text-text-secondary">{t('ai.settings.signInRequired')}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
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
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-600"
          >
            <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Provider */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-text-primary">{t('ai.settings.provider')}</label>
        <div className="grid grid-cols-3 gap-2">
          {AI_PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setProvider(p.id)}
              className={cn(
                'rounded-lg border px-2 py-2 text-[10px] font-medium transition-colors',
                provider === p.id
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-border bg-paper-secondary text-text-secondary hover:text-text-primary'
              )}
              title={p.description}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <Input
        id={endpointId}
        label={t('ai.settings.endpoint')}
        value={endpoint}
        onChange={(e) => setEndpoint(e.target.value)}
        placeholder="https://api.openai.com/v1/chat/completions"
        helperText={t('ai.settings.endpointHint')}
      />

      <Input
        id={modelId}
        label={t('ai.settings.model')}
        value={model}
        onChange={(e) => setModel(e.target.value)}
        placeholder="gpt-4o"
      />

      <div className="relative">
        <Input
          id={apiKeyId}
          type={showApiKey ? 'text' : 'password'}
          label={t('ai.settings.apiKey')}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={config ? '•••••••• 输入新密钥以覆盖' : 'sk-...'}
        />
        <button
          type="button"
          onClick={() => setShowApiKey((s) => !s)}
          className="absolute right-3 top-[34px] text-text-tertiary transition-colors hover:text-text-primary"
          tabIndex={-1}
          aria-label={showApiKey ? t('auth.hidePassword') : t('auth.showPassword')}
        >
          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-accent/20 bg-accent-soft/50 px-3 py-2">
        <Shield className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-accent" />
        <p className="text-[10px] leading-relaxed text-text-secondary">
          {t('ai.settings.encryptionHint')}
        </p>
      </div>

      {config && (
        <div className="flex items-center gap-2 text-[10px] text-text-tertiary">
          <Check className="h-3 w-3 text-green-500" />
          {t('ai.settings.lastSaved')}: {new Date(config.updatedAt).toLocaleString()}
        </div>
      )}

      <div className="mt-2 flex gap-2">
        {config && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleTest}
            isLoading={isTesting}
            className="flex-1"
            leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
          >
            {t('ai.settings.test')}
          </Button>
        )}
        <Button
          size="sm"
          onClick={handleSave}
          isLoading={isSaving}
          disabled={!endpoint.trim() || !model.trim() || !apiKey.trim()}
          className="flex-1"
          leftIcon={<Save className="h-3.5 w-3.5" />}
        >
          {t('ai.settings.save')}
        </Button>
        {config && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="px-2 text-danger hover:bg-danger/10"
            title={t('ai.settings.delete')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
