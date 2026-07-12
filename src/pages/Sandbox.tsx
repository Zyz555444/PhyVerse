import { useEffect, useRef, useState } from 'react'
import { useI18n } from '@/shared/hooks/useI18n'
import { useDebouncedCallback } from '@/shared/hooks/useDebounce'
import { Scene } from '@/features/canvas/Scene'
import { LabTable } from '@/features/canvas/LabTable'
import { PhysicsProvider } from '@/features/physics/PhysicsProvider'
import {
  useSandboxStore,
  type SandboxScene,
  type SandboxCameraView,
} from '@/features/sandbox/sandboxStore'
import { EquipmentPalette } from '@/features/sandbox/EquipmentPalette'
import { PropertiesPanel } from '@/features/sandbox/PropertiesPanel'
import { SandboxItemRenderer } from '@/features/sandbox/SandboxItemRenderer'
import { SandboxJoints } from '@/features/sandbox/SandboxJoints'
import { useSandboxShortcuts } from '@/features/sandbox/useSandboxShortcuts'
import {
  saveScene,
  loadStoredScene,
  exportScene,
  importScene,
} from '@/features/sandbox/sceneStorage'
import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/utils/cn'
import {
  Download,
  Upload,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Copy,
  Eraser,
  Check,
  Magnet,
  Timer,
  Camera,
  X,
} from 'lucide-react'

const CAMERA_VIEWS: SandboxCameraView[] = ['free', 'top', 'front', 'side']

export function Sandbox() {
  const { t } = useI18n()
  const items = useSandboxStore((s) => s.items)
  const joints = useSandboxStore((s) => s.joints)
  const gravity = useSandboxStore((s) => s.gravity)
  const selectedId = useSandboxStore((s) => s.selectedId)
  const multiSelectedIds = useSandboxStore((s) => s.multiSelectedIds)
  const editorConfig = useSandboxStore((s) => s.editorConfig)
  const selectItem = useSandboxStore((s) => s.selectItem)
  const updateItem = useSandboxStore((s) => s.updateItem)
  const commitHistory = useSandboxStore((s) => s.commitHistory)
  const removeItem = useSandboxStore((s) => s.removeItem)
  const duplicateItem = useSandboxStore((s) => s.duplicateItem)
  const copyItem = useSandboxStore((s) => s.copyItem)
  const pasteItem = useSandboxStore((s) => s.pasteItem)
  const resetScene = useSandboxStore((s) => s.resetScene)
  const clearScene = useSandboxStore((s) => s.clearScene)
  const loadScene = useSandboxStore((s) => s.loadScene)
  const undo = useSandboxStore((s) => s.undo)
  const redo = useSandboxStore((s) => s.redo)
  const setEditorConfig = useSandboxStore((s) => s.setEditorConfig)

  const [isRunning, setIsRunning] = useState(true)
  const [saved, setSaved] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [cameraResetKey, setCameraResetKey] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = loadStoredScene()
    if (stored) {
      loadScene(stored)
    }
  }, [loadScene])

  const debouncedSave = useDebouncedCallback((scene: SandboxScene) => {
    saveScene(scene)
    setSaved(true)
  }, 800)

  useEffect(() => {
    debouncedSave({ items, gravity })
  }, [items, gravity, debouncedSave])

  useEffect(() => {
    if (!saved) return
    const timer = setTimeout(() => setSaved(false), 2000)
    return () => clearTimeout(timer)
  }, [saved])

  useSandboxShortcuts({
    onRunToggle: () => setIsRunning((r) => !r),
    onDelete: () => {
      if (selectedId) removeItem(selectedId)
    },
    onDuplicate: () => {
      if (selectedId) duplicateItem(selectedId)
    },
    onUndo: undo,
    onRedo: redo,
    onSetGizmoMode: (mode) => setEditorConfig({ gizmoMode: mode }),
    onDeselect: () => selectItem(null),
    onCopy: () => {
      if (selectedId) copyItem(selectedId)
    },
    onPaste: () => pasteItem(),
    onToggleSnap: () => setEditorConfig({ snapEnabled: !editorConfig.snapEnabled }),
    isGizmoActive: () => {
      const gizmo = canvasContainerRef.current?.querySelector('[data-gizmo="dragging"]')
      return Boolean(gizmo)
    },
    hasSelection: !!selectedId,
  })

  const handleExport = () => {
    exportScene({ items, gravity })
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const scene = await importScene(file)
      loadScene(scene)
      setImportError(null)
    } catch (error) {
      setImportError(error instanceof Error ? error.message : t('sandbox.importError'))
    }
    e.target.value = ''
  }

  const handleClear = () => {
    if (items.length === 0) return
    if (window.confirm(t('sandbox.clearConfirm'))) {
      clearScene()
    }
  }

  const gizmoMode = editorConfig.gizmoMode

  return (
    <div className="py-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-text-primary">{t('nav.sandbox')}</h1>
          <p className="mt-2 text-text-secondary">
            {items.length > 0
              ? `${t('sandbox.bodyCount', { count: items.length, joints: joints.length })}`
              : t('app.tagline')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={isRunning ? 'secondary' : 'primary'}
            onClick={() => setIsRunning((r) => !r)}
            leftIcon={
              isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />
            }
          >
            {isRunning ? t('sandbox.pause') : t('sandbox.run')}
          </Button>

          {!isRunning && selectedId && (
            <div className="flex items-center rounded-lg border border-border bg-paper p-0.5">
              {(
                [
                  ['translate', 'sandbox.gizmoTranslate'],
                  ['rotate', 'sandbox.gizmoRotate'],
                  ['scale', 'sandbox.gizmoScale'],
                ] as const
              ).map(([mode, labelKey]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setEditorConfig({ gizmoMode: mode })}
                  className={cn(
                    'rounded-md px-2 py-1 text-xs font-medium capitalize transition-colors',
                    gizmoMode === mode
                      ? 'bg-accent-soft text-accent'
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
          )}

          <Button
            size="sm"
            variant={editorConfig.snapEnabled ? 'secondary' : 'outline'}
            onClick={() => setEditorConfig({ snapEnabled: !editorConfig.snapEnabled })}
            title={t('sandbox.snap')}
            leftIcon={<Magnet className="h-3.5 w-3.5" />}
          >
            {t('sandbox.snap')}
          </Button>

          <div className="flex items-center rounded-lg border border-border bg-paper p-0.5">
            <Camera className="ml-2 mr-1 h-3.5 w-3.5 text-text-tertiary" />
            {CAMERA_VIEWS.map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setEditorConfig({ cameraView: view })}
                className={cn(
                  'rounded-md px-2 py-1 text-xs font-medium capitalize transition-colors',
                  editorConfig.cameraView === view
                    ? 'bg-accent-soft text-accent'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {t(`sandbox.view${view.charAt(0).toUpperCase() + view.slice(1)}`)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-paper px-2 py-1">
            <Timer className="h-3.5 w-3.5 text-text-tertiary" />
            <span className="text-xs text-text-secondary">{t('sandbox.timeScale')}</span>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={editorConfig.timeScale}
              onChange={(e) => setEditorConfig({ timeScale: Number(e.target.value) })}
              className="h-1.5 w-20 cursor-pointer appearance-none rounded-full bg-paper-tertiary accent-accent"
            />
            <span className="w-10 text-right text-xs font-mono text-text-secondary">
              {editorConfig.timeScale.toFixed(1)}x
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => selectedId && duplicateItem(selectedId)}
            disabled={!selectedId}
            leftIcon={<Copy className="h-3.5 w-3.5" />}
          >
            {t('sandbox.duplicate')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => selectedId && removeItem(selectedId)}
            disabled={!selectedId}
            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
          >
            {t('sandbox.delete')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleClear}
            disabled={items.length === 0}
            leftIcon={<Eraser className="h-3.5 w-3.5" />}
          >
            {t('sandbox.clear')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={resetScene}
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
          >
            {t('sandbox.reset')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCameraResetKey((k) => k + 1)}
            title={t('sandbox.cameraReset')}
            leftIcon={<Camera className="h-3.5 w-3.5" />}
          >
            {t('sandbox.cameraReset')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            leftIcon={<Download className="h-3.5 w-3.5" />}
          >
            {t('sandbox.export')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleImportClick}
            leftIcon={<Upload className="h-3.5 w-3.5" />}
          >
            {t('sandbox.import')}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      <div className="flex h-[72vh] gap-4">
        <div className="hidden w-56 flex-shrink-0 lg:block">
          <EquipmentPalette />
        </div>

        <div
          ref={canvasContainerRef}
          className="relative flex-1 overflow-hidden rounded-xl border border-border bg-paper-tertiary"
          data-sandbox-canvas
        >
          <Scene
            cameraPosition={[8, 6, 8]}
            cameraView={editorConfig.cameraView}
            cameraResetKey={cameraResetKey}
            showGrid
          >
            <PhysicsProvider
              config={{ gravity }}
              autoStep={isRunning}
              timeScale={editorConfig.timeScale}
            >
              <LabTable position={[0, 0, 0]} size={[6, 4]} height={0.8} />
              <SandboxJoints />
              {items.map((item) => (
                <SandboxItemRenderer
                  key={item.id}
                  item={item}
                  selected={item.id === selectedId}
                  multiSelected={multiSelectedIds.includes(item.id)}
                  editingEnabled={!isRunning}
                  gizmoMode={gizmoMode}
                  snapEnabled={editorConfig.snapEnabled}
                  snapSize={editorConfig.snapSize}
                  angleSnapEnabled={editorConfig.angleSnapEnabled}
                  angleSnapSize={editorConfig.angleSnapSize}
                  onClick={(e) => {
                    e.stopPropagation()
                    selectItem(
                      item.id,
                      (e.nativeEvent as MouseEvent).ctrlKey || (e.nativeEvent as MouseEvent).metaKey
                    )
                  }}
                  onChange={(patch) => updateItem(item.id, patch)}
                  onCommit={(patch) => {
                    updateItem(item.id, patch)
                    commitHistory()
                  }}
                />
              ))}
            </PhysicsProvider>
          </Scene>

          {saved && (
            <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-border bg-paper/95 px-3 py-1.5 text-xs font-medium text-text-secondary shadow-sm">
              <Check className="h-3.5 w-3.5 text-green-500" />
              {t('sandbox.saved')}
            </div>
          )}

          {importError && (
            <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-medium text-red-600 shadow-sm">
              <span>{importError}</span>
              <button
                type="button"
                onClick={() => setImportError(null)}
                className="rounded-full p-0.5 hover:bg-red-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {items.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3">
              <p className="rounded-lg border border-border bg-paper/90 px-4 py-2 text-sm text-text-tertiary shadow-sm">
                {t('sandbox.empty')}
              </p>
              <p className="rounded-lg border border-border bg-paper/80 px-4 py-2 text-xs text-text-tertiary/70 shadow-sm max-w-md text-center">
                {t('sandbox.shortcuts')}
              </p>
            </div>
          )}
        </div>

        <div className="hidden w-64 flex-shrink-0 md:block">
          <PropertiesPanel />
        </div>
      </div>

      <div className="mt-4 lg:hidden">
        <EquipmentPalette />
      </div>
      <div className="mt-4 md:hidden">
        <PropertiesPanel />
      </div>
    </div>
  )
}
