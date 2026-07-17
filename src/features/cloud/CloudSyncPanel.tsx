import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cloud,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  X,
  Save,
  Globe,
  Lock,
  FolderOpen,
  Check,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { useI18n } from '@/shared/hooks/useI18n'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { cn } from '@/shared/utils/cn'
import type { SceneMetadata } from '@/features/auth/authTypes'
import { listScenes, saveScene, getScene, updateScene, deleteScene } from './cloudApi'

export interface CloudSyncPanelProps {
  currentScene: { items: unknown[]; gravity: unknown; joints: unknown[] }
  onLoadScene: (data: unknown) => void
  onClose: () => void
}

export function CloudSyncPanel({ currentScene, onLoadScene, onClose }: CloudSyncPanelProps) {
  const { t } = useI18n()
  const { user } = useAuth()
  const [scenes, setScenes] = useState<SceneMetadata[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'list' | 'save'>('list')
  const [sceneName, setSceneName] = useState('')
  const [sceneDescription, setSceneDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadScenes = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { scenes: data } = await listScenes()
      setScenes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('cloud.loadError'))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (user) {
      loadScenes()
    }
  }, [user, loadScenes])

  const handleSave = async () => {
    const name = sceneName.trim()
    if (!name) return
    setSaving(true)
    setError(null)
    try {
      await saveScene({
        name,
        description: sceneDescription.trim(),
        data: currentScene,
        isPublic,
      })
      setSceneName('')
      setSceneDescription('')
      setIsPublic(false)
      setMode('list')
      setSuccess(t('cloud.saveSuccess'))
      await loadScenes()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('cloud.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const handleLoad = async (id: string) => {
    setLoadingId(id)
    setError(null)
    try {
      const { scene } = await getScene(id)
      onLoadScene(scene.data)
      setSuccess(t('cloud.loadSuccess'))
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('cloud.loadError'))
    } finally {
      setLoadingId(null)
    }
  }

  const handleUpdate = async (id: string) => {
    setSaving(true)
    setError(null)
    try {
      await updateScene(id, { data: currentScene })
      setSuccess(t('cloud.updateSuccess'))
      await loadScenes()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('cloud.updateError'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('cloud.deleteConfirm'))) return
    setDeletingId(id)
    setError(null)
    try {
      await deleteScene(id)
      setScenes((prev) => prev.filter((s) => s.id !== id))
      if (selectedId === id) setSelectedId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('cloud.deleteError'))
    } finally {
      setDeletingId(null)
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-paper-secondary p-8 text-center">
        <Cloud className="h-10 w-10 text-text-tertiary" />
        <p className="text-sm text-text-secondary">{t('cloud.signInRequired')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-paper p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cloud className="h-4 w-4 text-accent" />
          <h3 className="font-heading text-sm font-semibold text-text-primary">
            {t('cloud.title')}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-text-tertiary transition-colors hover:bg-paper-secondary hover:text-text-primary"
          aria-label={t('common.close')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('list')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
            mode === 'list'
              ? 'border-accent bg-accent-soft text-accent'
              : 'border-border bg-paper-secondary text-text-secondary hover:text-text-primary'
          )}
        >
          <FolderOpen className="h-3.5 w-3.5" />
          {t('cloud.myScenes')}
        </button>
        <button
          type="button"
          onClick={() => setMode('save')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
            mode === 'save'
              ? 'border-accent bg-accent-soft text-accent'
              : 'border-border bg-paper-secondary text-text-secondary hover:text-text-primary'
          )}
        >
          <Save className="h-3.5 w-3.5" />
          {t('cloud.saveNew')}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-danger"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-600"
          >
            <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {mode === 'save' ? (
        <div className="flex flex-col gap-3">
          <Input
            label={t('cloud.sceneName')}
            placeholder={t('cloud.sceneNamePlaceholder')}
            value={sceneName}
            onChange={(e) => setSceneName(e.target.value)}
          />
          <Input
            label={t('cloud.sceneDescription')}
            placeholder={t('cloud.sceneDescriptionPlaceholder')}
            value={sceneDescription}
            onChange={(e) => setSceneDescription(e.target.value)}
          />
          <label className="flex cursor-pointer items-center gap-2 text-xs text-text-secondary">
            <button
              type="button"
              onClick={() => setIsPublic((p) => !p)}
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded border transition-colors',
                isPublic
                  ? 'border-accent bg-accent text-white'
                  : 'border-border bg-paper hover:border-border-strong'
              )}
              aria-checked={isPublic}
              role="checkbox"
            >
              {isPublic && <Check className="h-3 w-3" />}
            </button>
            {isPublic ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            {isPublic ? t('cloud.public') : t('cloud.private')}
          </label>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" fullWidth onClick={() => setMode('list')}>
              {t('common.close')}
            </Button>
            <Button
              size="sm"
              fullWidth
              isLoading={saving}
              disabled={!sceneName.trim()}
              onClick={handleSave}
              leftIcon={<Upload className="h-3.5 w-3.5" />}
            >
              {t('cloud.saveButton')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-tertiary">
              {scenes.length} {t('cloud.sceneCount')}
            </span>
            <button
              type="button"
              onClick={loadScenes}
              disabled={isLoading}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-secondary transition-colors hover:bg-paper-secondary hover:text-text-primary disabled:opacity-50"
            >
              <RefreshCw className={cn('h-3 w-3', isLoading && 'animate-spin')} />
              {t('cloud.refresh')}
            </button>
          </div>

          {scenes.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-paper-secondary py-8 text-center">
              <Cloud className="h-8 w-8 text-text-tertiary" />
              <p className="text-xs text-text-secondary">{t('cloud.empty')}</p>
            </div>
          ) : (
            <ul className="flex max-h-[240px] flex-col gap-2 overflow-y-auto pr-1">
              {scenes.map((scene) => (
                <li
                  key={scene.id}
                  className={cn(
                    'group flex flex-col gap-1.5 rounded-lg border p-2.5 transition-colors',
                    selectedId === scene.id
                      ? 'border-accent bg-accent-soft'
                      : 'border-border bg-paper-secondary hover:border-border-strong'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedId(selectedId === scene.id ? null : scene.id)}
                      className="flex flex-1 flex-col items-start text-left"
                    >
                      <span className="flex items-center gap-1.5 text-xs font-medium text-text-primary">
                        {scene.isPublic ? (
                          <Globe className="h-3 w-3 text-green-500" />
                        ) : (
                          <Lock className="h-3 w-3 text-text-tertiary" />
                        )}
                        {scene.name}
                      </span>
                      <span className="mt-0.5 text-[10px] text-text-tertiary">
                        {new Date(scene.updatedAt).toLocaleString()}
                      </span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleLoad(scene.id)}
                        disabled={loadingId === scene.id}
                        className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-paper hover:text-accent disabled:opacity-50"
                        title={t('cloud.load')}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdate(scene.id)}
                        disabled={saving}
                        className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-paper hover:text-accent disabled:opacity-50"
                        title={t('cloud.update')}
                      >
                        <Save className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(scene.id)}
                        disabled={deletingId === scene.id}
                        className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                        title={t('cloud.delete')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {selectedId === scene.id && scene.description && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[10px] text-text-secondary"
                      >
                        {scene.description}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
