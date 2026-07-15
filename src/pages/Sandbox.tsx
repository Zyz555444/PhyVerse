import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useI18n } from '@/shared/hooks/useI18n'
import { useDebouncedCallback } from '@/shared/hooks/useDebounce'
import { Scene } from '@/features/canvas/Scene'
import { LabTable } from '@/features/canvas/LabTable'
import { PhysicsProvider } from '@/features/physics/PhysicsProvider'
import { usePhysics } from '@/features/physics/usePhysics'
import {
  useSandboxStore,
  type SandboxScene,
  type SandboxCameraView,
  type JointType,
  type TelemetrySample,
} from '@/features/sandbox/sandboxStore'
import { EquipmentPalette } from '@/features/sandbox/EquipmentPalette'
import { PropertiesPanel } from '@/features/sandbox/PropertiesPanel'
import { SandboxItemRenderer } from '@/features/sandbox/SandboxItemRenderer'
import { SandboxJoints } from '@/features/sandbox/SandboxJoints'
import { SceneHierarchyPanel } from '@/features/sandbox/SceneHierarchyPanel'
import { HelpOverlay } from '@/features/sandbox/HelpOverlay'
import { DataPanel } from '@/features/sandbox/DataPanel'
import { getFriendlyName } from '@/features/sandbox/friendlyName'
import { SANDBOX_PRESETS } from '@/features/sandbox/presets'
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
  ClipboardCopy,
  ClipboardPaste,
  Eraser,
  Check,
  Magnet,
  Camera,
  X,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Link2,
  Undo2,
  Redo2,
  SkipForward,
  Crosshair,
  Zap,
  HelpCircle,
  Route,
  Box as BoxIcon,
} from 'lucide-react'

const CAMERA_VIEWS: SandboxCameraView[] = ['free', 'top', 'front', 'side']

const JOINT_TYPES: { type: JointType; labelKey: string }[] = [
  { type: 'spring', labelKey: 'sandbox.shape.spring' },
  { type: 'rope', labelKey: 'sandbox.jointRope' },
  { type: 'fixed', labelKey: 'sandbox.jointFixed' },
  { type: 'revolute', labelKey: 'sandbox.jointRevolute' },
  { type: 'prismatic', labelKey: 'sandbox.jointPrismatic' },
  { type: 'motor', labelKey: 'sandbox.jointMotor' },
  { type: 'gear', labelKey: 'sandbox.jointGear' },
]

function DeselectOnEmpty({ onSelect }: { onSelect: () => void }) {
  const { gl } = useThree()
  useEffect(() => {
    const dom = gl.domElement
    const handler = (e: PointerEvent) => {
      if (e.target === dom) {
        onSelect()
      }
    }
    dom.addEventListener('pointerdown', handler)
    return () => dom.removeEventListener('pointerdown', handler)
  }, [gl, onSelect])
  return null
}

function ManualStepper() {
  const { world } = usePhysics()
  const stepRequested = useSandboxStore((s) => s.stepRequested)
  const lastSeenRef = useRef(stepRequested)

  useFrame(() => {
    if (stepRequested !== lastSeenRef.current) {
      lastSeenRef.current = stepRequested
      if (world && world.isReady) {
        world.step()
      }
    }
  })
  return null
}

/**
 * Samples physics state of the tracked body each frame and feeds it into the
 * telemetry store. Live readings update ~10Hz; historical samples flush ~30Hz.
 */
function TelemetrySampler({ isRunning }: { isRunning: boolean }) {
  const { world } = usePhysics()
  const trackedId = useSandboxStore((s) => s.telemetry.trackedId)
  const sampling = useSandboxStore((s) => s.telemetry.sampling)
  const gravity = useSandboxStore((s) => s.gravity)
  const items = useSandboxStore((s) => s.items)
  const timeScale = useSandboxStore((s) => s.editorConfig.timeScale)
  const pushSamples = useSandboxStore((s) => s.pushTelemetrySamples)
  const setLive = useSandboxStore((s) => s.setLiveReading)

  const sampleBufferRef = useRef<TelemetrySample[]>([])
  const liveAccumRef = useRef(0)
  const pushAccumRef = useRef(0)
  const simTimeRef = useRef(0)
  const prevVelRef = useRef(new THREE.Vector3())
  const hasPrevRef = useRef(false)
  const lastTrackedRef = useRef<string | null>(null)

  // Reset local timing state when sampling toggles or tracked target changes.
  useEffect(() => {
    simTimeRef.current = 0
    hasPrevRef.current = false
    sampleBufferRef.current = []
    pushAccumRef.current = 0
  }, [sampling, trackedId])

  useFrame((_, delta) => {
    if (!isRunning || !world?.isReady || !trackedId) return
    const record = world.getBody(trackedId)
    if (!record) return
    const item = items.find((it) => it.id === trackedId)
    if (!item) return

    if (lastTrackedRef.current !== trackedId) {
      hasPrevRef.current = false
      lastTrackedRef.current = trackedId
    }

    const scaledDelta = delta * timeScale
    simTimeRef.current += scaledDelta

    const rb = record.rigidBody
    const pos = rb.translation()
    const v = rb.linvel()
    const speed = Math.hypot(v.x, v.y, v.z)
    const mass = item.mass

    let accel = 0
    if (hasPrevRef.current && scaledDelta > 0) {
      const ax = (v.x - prevVelRef.current.x) / scaledDelta
      const ay = (v.y - prevVelRef.current.y) / scaledDelta
      const az = (v.z - prevVelRef.current.z) / scaledDelta
      accel = Math.hypot(ax, ay, az)
    }
    prevVelRef.current.set(v.x, v.y, v.z)
    hasPrevRef.current = true

    const ke = 0.5 * mass * speed * speed
    const pe = mass * Math.abs(gravity[1]) * Math.max(0, pos.y)

    const sample: TelemetrySample = {
      t: simTimeRef.current,
      pos: [pos.x, pos.y, pos.z],
      vel: [v.x, v.y, v.z],
      speed,
      accel,
      ke,
      pe,
    }

    liveAccumRef.current += delta
    if (liveAccumRef.current >= 0.1) {
      setLive(sample)
      liveAccumRef.current = 0
    }

    if (sampling) {
      sampleBufferRef.current.push(sample)
      pushAccumRef.current += scaledDelta
      if (pushAccumRef.current >= 0.033) {
        pushSamples(sampleBufferRef.current, pushAccumRef.current)
        sampleBufferRef.current = []
        pushAccumRef.current = 0
      }
    }
  })

  return null
}

function useFps(): number {
  const [fps, setFps] = useState(0)
  useEffect(() => {
    let frames = 0
    let raf = 0
    let last = performance.now()
    const tick = () => {
      frames++
      const now = performance.now()
      if (now - last >= 1000) {
        setFps(frames)
        frames = 0
        last = now
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return fps
}

export function Sandbox() {
  const { t } = useI18n()
  const items = useSandboxStore((s) => s.items)
  const joints = useSandboxStore((s) => s.joints)
  const gravity = useSandboxStore((s) => s.gravity)
  const selectedId = useSandboxStore((s) => s.selectedId)
  const multiSelectedIds = useSandboxStore((s) => s.multiSelectedIds)
  const clipboard = useSandboxStore((s) => s.clipboard)
  const isGizmoDragging = useSandboxStore((s) => s.isGizmoDragging)
  const editorConfig = useSandboxStore((s) => s.editorConfig)
  const ui = useSandboxStore((s) => s.ui)
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
  const setUI = useSandboxStore((s) => s.setUI)
  const addJoint = useSandboxStore((s) => s.addJoint)
  const requestStep = useSandboxStore((s) => s.requestStep)
  const setTelemetryTracked = useSandboxStore((s) => s.setTelemetryTracked)

  const [isRunning, setIsRunning] = useState(false)
  const [saved, setSaved] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [cameraResetKey, setCameraResetKey] = useState(0)
  const [showJointMenu, setShowJointMenu] = useState(false)
  const [cameraFocusKey, setCameraFocusKey] = useState(0)
  const [showPresetMenu, setShowPresetMenu] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const jointMenuRef = useRef<HTMLDivElement>(null)
  const presetMenuRef = useRef<HTMLDivElement>(null)
  const prevItemCountRef = useRef(items.length)

  const impulseMode = editorConfig.impulseMode
  const impulseStrength = editorConfig.impulseStrength
  const showTrajectory = editorConfig.showTrajectory
  const fps = useFps()

  const physicsConfig = useMemo(() => ({ gravity }), [gravity])

  useEffect(() => {
    const stored = loadStoredScene()
    if (stored) {
      loadScene(stored, { pushHistory: false })
    }
  }, [loadScene])

  // Auto-focus camera when a new item is added.
  useEffect(() => {
    if (items.length > prevItemCountRef.current && selectedId) {
      setCameraFocusKey((k) => k + 1)
    }
    prevItemCountRef.current = items.length
  }, [items.length, selectedId])

  // Keep telemetry tracking in sync with the current selection.
  useEffect(() => {
    setTelemetryTracked(selectedId)
  }, [selectedId, setTelemetryTracked])

  const debouncedSave = useDebouncedCallback((scene: SandboxScene) => {
    saveScene(scene)
    setSaved(true)
  }, 800)

  useEffect(() => {
    debouncedSave({ items, gravity, joints })
  }, [items, gravity, joints, debouncedSave])

  useEffect(() => {
    if (!saved) return
    const timer = setTimeout(() => setSaved(false), 2000)
    return () => clearTimeout(timer)
  }, [saved])

  useEffect(() => {
    if (!showJointMenu) return
    const handler = (e: MouseEvent) => {
      if (jointMenuRef.current && !jointMenuRef.current.contains(e.target as Node)) {
        setShowJointMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showJointMenu])

  useEffect(() => {
    if (!showPresetMenu) return
    const handler = (e: MouseEvent) => {
      if (presetMenuRef.current && !presetMenuRef.current.contains(e.target as Node)) {
        setShowPresetMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showPresetMenu])

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
    onToggleFullscreen: () => setUI({ isFullscreen: !ui.isFullscreen }),
    onToggleHelp: () => setUI({ isHelpOpen: !ui.isHelpOpen }),
    onStep: () => requestStep(),
    onToggleImpulse: () => {
      if (isRunning) {
        setEditorConfig({ impulseMode: !impulseMode })
      }
    },
    isGizmoActive: () => isGizmoDragging,
    hasSelection: !!selectedId,
  })

  const handleExport = () => {
    exportScene({ items, gravity, joints })
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

  const handleCreateJoint = (type: JointType) => {
    const allSelected = [selectedId, ...multiSelectedIds].filter(Boolean) as string[]
    if (allSelected.length < 2) return
    addJoint({
      type,
      bodyA: allSelected[0],
      bodyB: allSelected[1],
      anchorA: [0, 0, 0],
      anchorB: [0, 0, 0],
      ...(type === 'spring' ? { restLength: 1, stiffness: 100, damping: 5 } : {}),
      ...(type === 'rope' ? { maxDistance: 1.5 } : {}),
    })
    setShowJointMenu(false)
  }

  const canCreateJoint = [selectedId, ...multiSelectedIds].filter(Boolean).length >= 2

  const friendlyName = useMemo(() => {
    if (!selectedId) return ''
    return getFriendlyName(items, selectedId)
  }, [items, selectedId])

  const focusTarget = useMemo<[number, number, number] | undefined>(() => {
    if (!selectedId) return undefined
    const item = items.find((it) => it.id === selectedId)
    return item ? item.position : undefined
  }, [items, selectedId])

  const gizmoMode = editorConfig.gizmoMode
  const isFullscreen = ui.isFullscreen
  const leftOpen = ui.isLeftPanelOpen
  const rightOpen = ui.isRightPanelOpen

  const containerClass = useMemo(() => {
    if (isFullscreen) {
      return 'fixed inset-0 z-50 flex flex-col bg-paper p-2'
    }
    return 'flex flex-col py-4'
  }, [isFullscreen])

  const canvasHeight = isFullscreen ? 'flex-1' : 'h-[calc(100vh-180px)] min-h-[400px]'

  return (
    <div className={containerClass}>
      {/* Compact toolbar */}
      <div className={cn('mb-2 flex flex-wrap items-center gap-2', isFullscreen && 'px-1 pt-1')}>
        <div className="flex items-center gap-2">
          {!isFullscreen && (
            <h1 className="font-heading text-xl text-text-primary">{t('nav.sandbox')}</h1>
          )}
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
        </div>

        <div className="flex items-center gap-1">
          <ToolButton icon={Undo2} onClick={undo} title={t('sandbox.undo')} size="sm" />
          <ToolButton icon={Redo2} onClick={redo} title={t('sandbox.redo')} size="sm" />
        </div>

        <ToolButton
          icon={SkipForward}
          onClick={requestStep}
          title={t('sandbox.step')}
          disabled={isRunning}
          size="sm"
        />

        <Divider />

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
                  'rounded-md px-2 py-1 text-xs font-medium transition-colors',
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

        {isRunning && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-paper px-2 py-1">
            <ToolButton
              icon={Zap}
              onClick={() => setEditorConfig({ impulseMode: !impulseMode })}
              title={t('sandbox.impulseMode')}
              active={impulseMode}
            />
            {impulseMode && (
              <>
                <span className="text-xs text-text-secondary">{t('sandbox.impulseStrength')}</span>
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={0.5}
                  value={impulseStrength}
                  onChange={(e) => setEditorConfig({ impulseStrength: Number(e.target.value) })}
                  className="h-1.5 w-16 cursor-pointer appearance-none rounded-full bg-paper-tertiary accent-accent"
                />
                <span className="w-8 text-right text-xs font-mono text-text-secondary">
                  {impulseStrength.toFixed(1)}
                </span>
              </>
            )}
            <ToolButton
              icon={Route}
              onClick={() => setEditorConfig({ showTrajectory: !showTrajectory })}
              title={t('sandbox.trajectory')}
              active={showTrajectory}
            />
          </div>
        )}

        <ToolButton
          icon={Magnet}
          onClick={() => setEditorConfig({ snapEnabled: !editorConfig.snapEnabled })}
          title={t('sandbox.snap')}
          active={editorConfig.snapEnabled}
        />

        <div className="flex items-center rounded-lg border border-border bg-paper p-0.5">
          <Camera className="ml-1.5 mr-0.5 h-3.5 w-3.5 text-text-tertiary" />
          {CAMERA_VIEWS.map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setEditorConfig({ cameraView: view })}
              className={cn(
                'rounded-md px-1.5 py-1 text-xs font-medium transition-colors',
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
          <span className="text-xs text-text-secondary">{t('sandbox.timeScale')}</span>
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={editorConfig.timeScale}
            onChange={(e) => setEditorConfig({ timeScale: Number(e.target.value) })}
            className="h-1.5 w-16 cursor-pointer appearance-none rounded-full bg-paper-tertiary accent-accent"
          />
          <span className="w-8 text-right text-xs font-mono text-text-secondary">
            {editorConfig.timeScale.toFixed(1)}x
          </span>
        </div>

        <Divider />

        {/* Joint creation */}
        <div className="relative" ref={jointMenuRef}>
          <ToolButton
            icon={Link2}
            onClick={() => canCreateJoint && setShowJointMenu((s) => !s)}
            title={canCreateJoint ? t('sandbox.createJoint') : t('sandbox.createJointHint')}
            disabled={!canCreateJoint}
          />
          {showJointMenu && (
            <div className="absolute left-0 top-full z-20 mt-1 w-32 rounded-lg border border-border bg-paper py-1 shadow-lg">
              {JOINT_TYPES.map(({ type, labelKey }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleCreateJoint(type)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-text-primary hover:bg-accent-soft hover:text-accent"
                >
                  <Link2 className="h-3 w-3" />
                  {t(labelKey)}
                </button>
              ))}
            </div>
          )}
        </div>

        <ToolButton
          icon={Copy}
          onClick={() => selectedId && duplicateItem(selectedId)}
          title={t('sandbox.duplicate')}
          disabled={!selectedId}
        />
        <ToolButton
          icon={ClipboardCopy}
          onClick={() => selectedId && copyItem(selectedId)}
          title={t('sandbox.copy')}
          disabled={!selectedId}
        />
        <ToolButton
          icon={ClipboardPaste}
          onClick={() => pasteItem()}
          title={t('sandbox.paste')}
          disabled={!clipboard || clipboard.length === 0}
        />
        <ToolButton
          icon={Trash2}
          onClick={() => selectedId && removeItem(selectedId)}
          title={t('sandbox.delete')}
          disabled={!selectedId}
        />
        <ToolButton
          icon={Eraser}
          onClick={handleClear}
          title={t('sandbox.clear')}
          disabled={items.length === 0}
        />
        <ToolButton icon={RotateCcw} onClick={resetScene} title={t('sandbox.reset')} />
        <ToolButton
          icon={Camera}
          onClick={() => setCameraResetKey((k) => k + 1)}
          title={t('sandbox.cameraReset')}
        />
        <ToolButton
          icon={Crosshair}
          onClick={() => setCameraFocusKey((k) => k + 1)}
          title={t('sandbox.focusSelected')}
          disabled={!selectedId}
        />
        <ToolButton icon={Download} onClick={handleExport} title={t('sandbox.export')} />
        <ToolButton icon={Upload} onClick={handleImportClick} title={t('sandbox.import')} />

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="ml-auto flex items-center gap-1">
          <ToolButton
            icon={HelpCircle}
            onClick={() => setUI({ isHelpOpen: !ui.isHelpOpen })}
            title={t('sandbox.help')}
          />
          {!isFullscreen && (
            <>
              <ToolButton
                icon={leftOpen ? PanelLeftClose : PanelLeftOpen}
                onClick={() => setUI({ isLeftPanelOpen: !leftOpen })}
                title={leftOpen ? t('sandbox.hidePalette') : t('sandbox.showPalette')}
              />
              <ToolButton
                icon={rightOpen ? PanelRightClose : PanelRightOpen}
                onClick={() => setUI({ isRightPanelOpen: !rightOpen })}
                title={rightOpen ? t('sandbox.hideProperties') : t('sandbox.showProperties')}
              />
            </>
          )}
          <ToolButton
            icon={isFullscreen ? Minimize2 : Maximize2}
            onClick={() => setUI({ isFullscreen: !isFullscreen })}
            title={isFullscreen ? t('sandbox.exitFullscreen') : t('sandbox.fullscreen')}
            active={isFullscreen}
          />
        </div>
      </div>

      {/* Status bar */}
      {!isFullscreen && (
        <div className="mb-2 flex items-center gap-3 px-1 text-xs text-text-tertiary">
          <span className="flex items-center gap-1">
            <BoxIcon className="h-3 w-3" />
            {items.length} {t('sandbox.objects')}
          </span>
          {joints.length > 0 && (
            <span className="flex items-center gap-1">
              <Link2 className="h-3 w-3" />
              {joints.length} {t('sandbox.joints')}
            </span>
          )}
          {selectedId && (
            <span className="rounded bg-accent-soft px-1.5 py-0.5 text-accent">
              {t('sandbox.selected')}: {friendlyName}
            </span>
          )}
          <span className="ml-auto font-mono">FPS: {fps}</span>
        </div>
      )}

      <div className={cn('flex flex-col gap-2', canvasHeight)}>
        <div className="flex flex-1 gap-2 min-h-0">
          {leftOpen && !isFullscreen && (
            <div className="w-52 flex-shrink-0">
              <EquipmentPalette />
            </div>
          )}

          <div
            className="relative flex-1 overflow-hidden rounded-xl border border-border bg-paper-tertiary"
            data-sandbox-canvas
          >
            <Scene
              cameraPosition={[10, 8, 10]}
              cameraView={editorConfig.cameraView}
              cameraResetKey={cameraResetKey}
              focusTarget={focusTarget}
              focusKey={cameraFocusKey}
              showGrid
            >
              <PhysicsProvider
                config={physicsConfig}
                autoStep={isRunning}
                timeScale={editorConfig.timeScale}
              >
                <DeselectOnEmpty onSelect={() => selectItem(null)} />
                {!isRunning && <ManualStepper />}
                <TelemetrySampler isRunning={isRunning} />
                <LabTable position={[0, 0, 0]} size={[10, 8]} height={0.8} />
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
                    impulseMode={impulseMode}
                    impulseStrength={impulseStrength}
                    showTrajectory={showTrajectory}
                    onClick={(e) => {
                      e.stopPropagation()
                      const native = e.nativeEvent as MouseEvent
                      selectItem(item.id, native.ctrlKey || native.metaKey || native.shiftKey)
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

            {!isRunning && (
              <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-amber-300 bg-amber-50/95 px-3 py-1 text-xs font-medium text-amber-700 shadow-sm">
                {t('sandbox.pausedMode')}
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
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <p className="text-sm text-text-tertiary">{t('sandbox.empty')}</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setUI({ isLeftPanelOpen: true })}
                    className="rounded-lg border border-accent bg-accent-soft px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-white"
                  >
                    {t('sandbox.emptyBuild')}
                  </button>
                  <div className="relative" ref={presetMenuRef}>
                    <button
                      type="button"
                      onClick={() => setShowPresetMenu((s) => !s)}
                      className="rounded-lg border border-border bg-paper px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-border-strong"
                    >
                      {t('sandbox.emptyLoadPreset')}
                    </button>
                    {showPresetMenu && (
                      <div className="absolute left-0 top-full z-20 mt-1 w-40 rounded-lg border border-border bg-paper py-1 shadow-lg">
                        {SANDBOX_PRESETS.map(({ id, label, scene }) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              if (window.confirm(t('sandbox.presetConfirm', { name: label }))) {
                                loadScene(scene)
                              }
                              setShowPresetMenu(false)
                            }}
                            className="block w-full px-3 py-1.5 text-left text-xs text-text-primary hover:bg-accent-soft hover:text-accent"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setUI({ isHelpOpen: true })}
                    className="rounded-lg border border-border bg-paper px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-border-strong"
                  >
                    {t('sandbox.emptyTutorial')}
                  </button>
                </div>
              </div>
            )}

            {isFullscreen && (
              <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-border bg-paper/90 px-3 py-1 text-xs text-text-tertiary shadow-sm">
                {t('sandbox.fullscreenHint')}
              </div>
            )}
          </div>

          {rightOpen && !isFullscreen && (
            <div className="flex w-64 flex-shrink-0 flex-col gap-2">
              <SceneHierarchyPanel />
              <div className="min-h-0 flex-1">
                <PropertiesPanel />
              </div>
            </div>
          )}
        </div>

        {!isFullscreen && <DataPanel />}
      </div>

      <HelpOverlay />
    </div>
  )
}

interface ToolButtonProps {
  icon: typeof Undo2
  onClick: () => void
  title: string
  active?: boolean
  disabled?: boolean
  size?: 'sm' | 'md'
}

function ToolButton({
  icon: Icon,
  onClick,
  title,
  active,
  disabled,
  size = 'md',
}: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'flex items-center justify-center rounded-lg border transition-colors',
        size === 'sm' ? 'h-7 w-7' : 'h-8 w-8',
        active
          ? 'border-accent bg-accent-soft text-accent'
          : 'border-border bg-paper text-text-secondary hover:border-border-strong hover:text-text-primary',
        disabled && 'cursor-not-allowed opacity-40 hover:border-border hover:text-text-secondary'
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  )
}

function Divider() {
  return <div className="h-5 w-px bg-border" />
}
