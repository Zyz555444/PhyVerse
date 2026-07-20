import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '@/shared/hooks/useI18n'
import { useDebouncedCallback } from '@/shared/hooks/useDebounce'
import { useIsMobile } from '@/shared/hooks/useIsMobile'
import { MobileBottomSheet } from '@/shared/ui/MobileBottomSheet'
import { Scene } from '@/features/canvas/Scene'
import { PhysicsProvider } from '@/features/physics/PhysicsProvider'
import {
  useSandboxStore,
  type SandboxScene,
  type JointType,
} from '@/features/sandbox/sandboxStore'
import { EquipmentPalette } from '@/features/sandbox/EquipmentPalette'
import { PropertiesPanel } from '@/features/sandbox/PropertiesPanel'
import { SandboxItemRenderer } from '@/features/sandbox/SandboxItemRenderer'
import { SandboxJoints } from '@/features/sandbox/SandboxJoints'
import { BoxSelection } from '@/features/sandbox/BoxSelection'
import { MultiSelectionGizmo } from '@/features/sandbox/MultiSelectionGizmo'
import { SceneContextMenu } from '@/features/sandbox/SceneContextMenu'
import { SceneHierarchyPanel } from '@/features/sandbox/SceneHierarchyPanel'
import { HelpOverlay } from '@/features/sandbox/HelpOverlay'
import { DataPanel } from '@/features/sandbox/DataPanel'
import { useSandboxShortcuts } from '@/features/sandbox/useSandboxShortcuts'
import {
  saveScene,
  loadStoredScene,
  exportScene,
  importScene,
} from '@/features/sandbox/sceneStorage'
import { saveTemplate } from '@/features/sandbox/sceneTemplates'
import { SANDBOX_PRESETS } from '@/features/sandbox/presets'
import { TaskPanel } from '@/features/sandbox/TaskPanel'
import { useTaskMonitor } from '@/features/sandbox/useTaskMonitor'
import { RecorderSampler } from '@/features/recording/RecorderSampler'
import { RecorderControls } from '@/features/recording/RecorderControls'
import { PlaybackRunner } from '@/features/recording/PlaybackRunner'
import { ForceVisualizer } from '@/features/sandbox/ForceVisualizer'
import { EnergyBar } from '@/features/sandbox/EnergyBar'
import { ForceFieldRenderer } from '@/features/sandbox/ForceFieldRenderer'
import { AiAgentPanel } from '@/features/ai/AiAgentPanel'
import { AiSettingsModal } from '@/features/ai/AiSettingsModal'
import { RecipePanel } from '@/features/recipe/RecipePanel'
import { type Recipe } from '@/features/recipe/recipeTypes'
import { MeasurementOverlay } from '@/features/measurement/MeasurementOverlay'
import { MeasurementDataCollector } from '@/features/measurement/measurementDataStore'
import { MeasurementToolbar } from '@/features/measurement/MeasurementToolbar'
import { CloudSyncPanel } from '@/features/cloud/CloudSyncPanel'
import { type SandboxTask } from '@/features/sandbox/taskRegistry'
import { ManualStepper } from '@/features/sandbox/components/ManualStepper'
import { ImpulseApplier } from '@/features/sandbox/components/ImpulseApplier'
import { TelemetrySampler } from '@/features/sandbox/components/TelemetrySampler'
import { SandboxToolbar } from '@/features/sandbox/components/SandboxToolbar'
import { SandboxStatusBar } from '@/features/sandbox/components/SandboxStatusBar'
import { cn } from '@/shared/utils/cn'
import { Check, X } from 'lucide-react'

export function Sandbox() {
  const { t } = useI18n()
  const items = useSandboxStore((s) => s.items)
  const joints = useSandboxStore((s) => s.joints)
  const gravity = useSandboxStore((s) => s.gravity)
  const selectedId = useSandboxStore((s) => s.selectedId)
  const multiSelectedIds = useSandboxStore((s) => s.multiSelectedIds)
  const isGizmoDragging = useSandboxStore((s) => s.isGizmoDragging)
  const editorConfig = useSandboxStore((s) => s.editorConfig)
  const ui = useSandboxStore((s) => s.ui)
  const selectItem = useSandboxStore((s) => s.selectItem)
  const selectAll = useSandboxStore((s) => s.selectAll)
  const nudgeSelection = useSandboxStore((s) => s.nudgeSelection)
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
  const startTask = useSandboxStore((s) => s.startTask)
  const exitTask = useSandboxStore((s) => s.exitTask)
  const advanceTaskStep = useSandboxStore((s) => s.advanceTaskStep)
  const resetTaskStep = useSandboxStore((s) => s.resetTaskStep)
  const addTaskRecord = useSandboxStore((s) => s.addTaskRecord)
  const clearTelemetry = useSandboxStore((s) => s.clearTelemetry)
  const taskState = useSandboxStore((s) => s.task)
  const telemetry = useSandboxStore((s) => s.telemetry)
  const isPlaying = useSandboxStore((s) => s.recording.isPlaying)
  const isRunning = useSandboxStore((s) => s.isRunning)
  const setRunning = useSandboxStore((s) => s.setRunning)

  const [saved, setSaved] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [cameraResetKey, setCameraResetKey] = useState(0)
  const [showJointMenu, setShowJointMenu] = useState(false)
  const [cameraFocusKey, setCameraFocusKey] = useState(0)
  const [showPresetMenu, setShowPresetMenu] = useState(false)
  const [leftTab, setLeftTab] = useState<'equipment' | 'tasks' | 'recipes'>('equipment')
  const [centerTab, setCenterTab] = useState<'hierarchy' | 'properties'>('properties')
  const [cloudOpen, setCloudOpen] = useState(false)
  const [aiSettingsOpen, setAiSettingsOpen] = useState(false)
  const [sceneMenuOpen, setSceneMenuOpen] = useState(false)
  const sceneMenuRef = useRef<HTMLDivElement>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [recipeState, setRecipeState] = useState<{
    activeRecipeId: string | null
    currentStepIndex: number
    completedRecipeIds: string[]
  }>({ activeRecipeId: null, currentStepIndex: 0, completedRecipeIds: [] })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const jointMenuRef = useRef<HTMLDivElement>(null)
  const presetMenuRef = useRef<HTMLDivElement>(null)
  const prevItemCountRef = useRef(items.length)

  useTaskMonitor()

  const impulseMode = editorConfig.impulseMode
  const impulseStrength = editorConfig.impulseStrength
  const showTrajectory = editorConfig.showTrajectory
  const showForceVectors = editorConfig.showForceVectors
  const showEnergyBar = editorConfig.showEnergyBar

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

  useEffect(() => {
    if (!sceneMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (sceneMenuRef.current && !sceneMenuRef.current.contains(e.target as Node)) {
        setSceneMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [sceneMenuOpen])

  useSandboxShortcuts({
    onRunToggle: () => setRunning(!isRunning),
    onDelete: () => {
      if (selectedId) removeItem(selectedId)
    },
    onDuplicate: () => {
      if (selectedId) duplicateItem(selectedId)
    },
    onUndo: undo,
    onRedo: redo,
    onSetGizmoMode: (mode) => setEditorConfig({ gizmoMode: mode }),
    onSetGizmoSpace: (space) =>
      setEditorConfig({ gizmoSpace: space === 'local' ? 'world' : 'local' }),
    onDeselect: () => selectItem(null),
    onSelectAll: selectAll,
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
    onNudge: (axis, direction) => nudgeSelection(axis, direction),
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
      const result = await importScene(file)
      loadScene(result.scene)
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

  const handleSaveTemplate = () => {
    const name = window.prompt(t('sandbox.templateSaveTitle'), '')?.trim()
    if (!name) return
    saveTemplate(name, { items, gravity, joints })
    alert(t('sandbox.templateSaved'))
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

  const handleStartTask = (task: SandboxTask) => {
    loadScene(task.scene)
    startTask(task.id)
    clearTelemetry()
    setLeftTab('tasks')
    setRunning(false)
    const tracked =
      task.scene.items.find((it) => it.isDynamic)?.id ?? task.scene.items[0]?.id ?? null
    if (tracked) {
      selectItem(tracked)
    }
  }

  const handleExitTask = () => {
    exitTask()
    setLeftTab('equipment')
  }

  const handleStartRecipe = (recipe: Recipe) => {
    loadScene(recipe.scene)
    setRecipeState({
      activeRecipeId: recipe.id,
      currentStepIndex: 0,
      completedRecipeIds: recipeState.completedRecipeIds,
    })
    clearTelemetry()
    setLeftTab('recipes')
    setRunning(false)
    const tracked =
      recipe.scene.items.find((it) => it.isDynamic)?.id ?? recipe.scene.items[0]?.id ?? null
    if (tracked) {
      selectItem(tracked)
    }
  }

  const handleExitRecipe = () => {
    setRecipeState((prev) => ({
      ...prev,
      completedRecipeIds: prev.activeRecipeId
        ? [...new Set([...prev.completedRecipeIds, prev.activeRecipeId])]
        : prev.completedRecipeIds,
      activeRecipeId: null,
      currentStepIndex: 0,
    }))
    setLeftTab('equipment')
  }

  const handleAdvanceRecipeStep = () => {
    setRecipeState((prev) => ({
      ...prev,
      currentStepIndex: prev.currentStepIndex + 1,
    }))
  }

  const handleResetRecipeStep = () => {
    setRecipeState((prev) => ({
      ...prev,
      currentStepIndex: 0,
    }))
  }

  const handlePrevRecipeStep = () => {
    setRecipeState((prev) => ({
      ...prev,
      currentStepIndex: Math.max(0, prev.currentStepIndex - 1),
    }))
  }

  const handleAddRecord = () => {
    if (!telemetry.live) return
    addTaskRecord({
      simTime: telemetry.simTime,
      sample: telemetry.live,
    })
  }

  const handleExportRecords = () => {
    if (taskState.records.length === 0) return
    const header = 'time,posX,posY,posZ,velX,velY,velZ,speed,accel,KE,PE,totalEnergy'
    const rows = taskState.records.map((r) =>
      [
        r.simTime.toFixed(4),
        r.sample.pos[0].toFixed(4),
        r.sample.pos[1].toFixed(4),
        r.sample.pos[2].toFixed(4),
        r.sample.vel[0].toFixed(4),
        r.sample.vel[1].toFixed(4),
        r.sample.vel[2].toFixed(4),
        r.sample.speed.toFixed(4),
        r.sample.accel.toFixed(4),
        r.sample.ke.toFixed(4),
        r.sample.pe.toFixed(4),
        (r.sample.ke + r.sample.pe).toFixed(4),
      ].join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `task-records-${taskState.activeTaskId ?? 'sandbox'}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const focusTarget = useMemo<[number, number, number] | undefined>(() => {
    if (!selectedId) return undefined
    const item = items.find((it) => it.id === selectedId)
    return item ? item.position : undefined
  }, [items, selectedId])

  const gizmoMode = editorConfig.gizmoMode
  const gizmoSpace = editorConfig.gizmoSpace
  const isFullscreen = ui.isFullscreen
  const isMobile = useIsMobile()
  const leftOpen = !isMobile && ui.isLeftPanelOpen
  const centerOpen = !isMobile && ui.isRightPanelOpen
  const aiOpen = !isMobile && ui.isAiPanelOpen
  const [mobileSheet, setMobileSheet] = useState<
    'equipment' | 'tasks' | 'hierarchy' | 'properties' | 'data' | 'ai' | null
  >(null)

  const containerClass = useMemo(() => {
    if (isFullscreen) {
      return 'fixed inset-0 z-50 flex flex-col bg-paper p-2'
    }
    return isMobile ? 'flex flex-col' : 'flex flex-col min-h-0 flex-1'
  }, [isFullscreen, isMobile])

  return (
    <div className={containerClass}>
      <SandboxToolbar
        isFullscreen={isFullscreen}
        isMobile={isMobile}
        cameraResetKey={cameraResetKey}
        cloudOpen={cloudOpen}
        sceneMenuOpen={sceneMenuOpen}
        showJointMenu={showJointMenu}
        showPresetMenu={showPresetMenu}
        sceneMenuRef={sceneMenuRef}
        jointMenuRef={jointMenuRef}
        presetMenuRef={presetMenuRef}
        fileInputRef={fileInputRef}
        mobileSheet={mobileSheet}
        setCameraResetKey={setCameraResetKey}
        setCameraFocusKey={setCameraFocusKey}
        setCloudOpen={setCloudOpen}
        setSceneMenuOpen={setSceneMenuOpen}
        setShowJointMenu={setShowJointMenu}
        setShowPresetMenu={setShowPresetMenu}
        setMobileSheet={setMobileSheet}
        onImportClick={handleImportClick}
        onExport={handleExport}
        onSaveTemplate={handleSaveTemplate}
        onClear={handleClear}
        onCreateJoint={handleCreateJoint}
        handleFileChange={handleFileChange}
      />

      {!isFullscreen && !isMobile && <SandboxStatusBar />}

      <div className="flex flex-1 min-h-0 flex-col gap-2">
        <div className="flex flex-1 min-h-0 gap-2">
          {leftOpen && !isFullscreen && (
            <div className="flex w-56 flex-shrink-0 flex-col gap-2">
              <div className="flex rounded-lg border border-border bg-paper p-0.5">
                {(
                  [
                    ['equipment', 'sandbox.equipment'],
                    ['tasks', 'sandbox.taskLibrary'],
                    ['recipes', 'recipe.library'],
                  ] as const
                ).map(([tab, labelKey]) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setLeftTab(tab)}
                    className={cn(
                      'flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                      leftTab === tab
                        ? 'bg-accent-soft text-accent'
                        : 'text-text-secondary hover:text-text-primary'
                    )}
                  >
                    {t(labelKey)}
                  </button>
                ))}
              </div>
              <div className="min-h-0 flex-1 overflow-hidden">
                {leftTab === 'equipment' ? (
                  <EquipmentPalette />
                ) : leftTab === 'recipes' ? (
                  <RecipePanel
                    onStartRecipe={handleStartRecipe}
                    onExitRecipe={handleExitRecipe}
                    activeRecipeId={recipeState.activeRecipeId}
                    currentStepIndex={recipeState.currentStepIndex}
                    completedRecipeIds={recipeState.completedRecipeIds}
                    onAdvanceStep={handleAdvanceRecipeStep}
                    onPrevStep={handlePrevRecipeStep}
                    onResetStep={handleResetRecipeStep}
                  />
                ) : (
                  <TaskPanel
                    onStartTask={handleStartTask}
                    onExitTask={handleExitTask}
                    onAdvanceStep={advanceTaskStep}
                    onResetStep={resetTaskStep}
                    onAddRecord={handleAddRecord}
                    onExportRecords={handleExportRecords}
                  />
                )}
              </div>
            </div>
          )}

          <div
            className="relative flex-1 overflow-hidden rounded-xl border border-border bg-paper-tertiary"
            data-sandbox-canvas
            onContextMenu={(e) => {
              e.preventDefault()
              setContextMenu({ x: e.clientX, y: e.clientY })
            }}
          >
            <Scene
              cameraPosition={[10, 8, 10]}
              cameraView={editorConfig.cameraView}
              cameraResetKey={cameraResetKey}
              focusTarget={focusTarget}
              focusKey={cameraFocusKey}
              showGrid
              environment
            >
              <PhysicsProvider
                config={physicsConfig}
                autoStep={isRunning && !isPlaying}
                timeScale={editorConfig.timeScale}
              >
                {!isRunning && <ManualStepper />}
                <ImpulseApplier />
                <TelemetrySampler isRunning={isRunning} />
                <RecorderSampler isRunning={isRunning} />
                <PlaybackRunner />
                <ForceVisualizer isRunning={isRunning} />
                <EnergyBar isRunning={isRunning} />
                <ForceFieldRenderer isRunning={isRunning} />
                <MeasurementOverlay isRunning={isRunning} />
                <MeasurementDataCollector />
                <BoxSelection />
                <SandboxJoints />
                {items.map((item) => (
                  <SandboxItemRenderer
                    key={item.id}
                    item={item}
                    selected={item.id === selectedId}
                    multiSelected={multiSelectedIds.includes(item.id)}
                    editingEnabled={!isRunning}
                    gizmoMode={gizmoMode}
                    gizmoSpace={gizmoSpace}
                    multiSelectionActive={multiSelectedIds.length > 0}
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
                <MultiSelectionGizmo
                  selectedIds={[selectedId, ...multiSelectedIds].filter(Boolean) as string[]}
                  items={items}
                  mode={gizmoMode}
                  space={gizmoSpace}
                  snapEnabled={editorConfig.snapEnabled}
                  snapSize={editorConfig.snapSize}
                  angleSnapEnabled={editorConfig.angleSnapEnabled}
                  angleSnapSize={editorConfig.angleSnapSize}
                  enabled={!isRunning && multiSelectedIds.length > 0}
                  onChange={(id, patch) => updateItem(id, patch)}
                  onCommit={(id, patch) => {
                    updateItem(id, patch)
                    commitHistory()
                  }}
                />
              </PhysicsProvider>
            </Scene>

            {contextMenu && (
              <SceneContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                onClose={() => setContextMenu(null)}
              />
            )}

            {saved && !isMobile && (
              <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-border bg-paper/95 px-3 py-1.5 text-xs font-medium text-text-secondary shadow-sm">
                <Check className="h-3.5 w-3.5 text-green-500" />
                {t('sandbox.saved')}
              </div>
            )}

            {!isMobile && <RecorderControls />}

            {!isRunning && !isPlaying && !isMobile && (
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
                        {SANDBOX_PRESETS.map(({ id, label, labelKey, scene }) => (
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
                            {t(labelKey)}
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

          {centerOpen && !isFullscreen && (
            <div className="flex w-64 flex-shrink-0 flex-col gap-2">
              <div className="flex rounded-lg border border-border bg-paper p-0.5">
                {(
                  [
                    ['hierarchy', 'sandbox.hierarchy'],
                    ['properties', 'sandbox.properties'],
                  ] as const
                ).map(([tab, labelKey]) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setCenterTab(tab)}
                    className={cn(
                      'flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                      centerTab === tab
                        ? 'bg-accent-soft text-accent'
                        : 'text-text-secondary hover:text-text-primary'
                    )}
                  >
                    {t(labelKey)}
                  </button>
                ))}
              </div>
              <div className="min-h-0 flex-1 overflow-hidden">
                {centerTab === 'hierarchy' && <SceneHierarchyPanel />}
                {centerTab === 'properties' && <PropertiesPanel />}
              </div>
            </div>
          )}

          {aiOpen && !isFullscreen && (
            <div className="flex w-80 flex-shrink-0 flex-col">
              <AiAgentPanel onOpenSettings={() => setAiSettingsOpen(true)} />
            </div>
          )}
        </div>

        {!isFullscreen && !isMobile && <DataPanel />}
        {!isFullscreen && cloudOpen && (
          <div className="max-h-[260px] max-w-full overflow-hidden">
            <CloudSyncPanel
              currentScene={{ items, gravity, joints }}
              onLoadScene={(data) => {
                const scene = data as {
                  items: typeof items
                  gravity: typeof gravity
                  joints: typeof joints
                }
                loadScene(scene)
                setCloudOpen(false)
              }}
              onClose={() => setCloudOpen(false)}
            />
          </div>
        )}
        {!isFullscreen && (
          <div className="max-w-full">
            <MeasurementToolbar />
          </div>
        )}
      </div>

      <AiSettingsModal open={aiSettingsOpen} onOpenChange={setAiSettingsOpen} />
      <HelpOverlay />

      {/* Mobile bottom sheets */}
      <MobileBottomSheet
        open={isMobile && mobileSheet === 'equipment'}
        onClose={() => setMobileSheet(null)}
        title={
          leftTab === 'equipment'
            ? t('sandbox.equipment')
            : leftTab === 'recipes'
              ? t('recipe.library')
              : t('sandbox.taskLibrary')
        }
      >
        <div className="flex rounded-lg border border-border bg-paper p-0.5 mb-2">
          {(
            [
              ['equipment', 'sandbox.equipment'],
              ['tasks', 'sandbox.taskLibrary'],
              ['recipes', 'recipe.library'],
            ] as const
          ).map(([tab, labelKey]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setLeftTab(tab)}
              className={cn(
                'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                leftTab === tab
                  ? 'bg-accent-soft text-accent'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
        {leftTab === 'equipment' ? (
          <EquipmentPalette />
        ) : leftTab === 'recipes' ? (
          <RecipePanel
            onStartRecipe={handleStartRecipe}
            onExitRecipe={handleExitRecipe}
            activeRecipeId={recipeState.activeRecipeId}
            currentStepIndex={recipeState.currentStepIndex}
            completedRecipeIds={recipeState.completedRecipeIds}
            onAdvanceStep={handleAdvanceRecipeStep}
            onPrevStep={handlePrevRecipeStep}
            onResetStep={handleResetRecipeStep}
          />
        ) : (
          <TaskPanel
            onStartTask={handleStartTask}
            onExitTask={handleExitTask}
            onAdvanceStep={advanceTaskStep}
            onResetStep={resetTaskStep}
            onAddRecord={handleAddRecord}
            onExportRecords={handleExportRecords}
          />
        )}
      </MobileBottomSheet>

      <MobileBottomSheet
        open={isMobile && mobileSheet === 'hierarchy'}
        onClose={() => setMobileSheet(null)}
        title={t('sandbox.hierarchy')}
      >
        <SceneHierarchyPanel />
      </MobileBottomSheet>

      <MobileBottomSheet
        open={isMobile && mobileSheet === 'properties'}
        onClose={() => setMobileSheet(null)}
        title={t('sandbox.properties')}
      >
        <PropertiesPanel />
      </MobileBottomSheet>

      <MobileBottomSheet
        open={isMobile && mobileSheet === 'data'}
        onClose={() => setMobileSheet(null)}
        title={t('sandbox.telemetry')}
      >
        <DataPanel />
      </MobileBottomSheet>

      <MobileBottomSheet
        open={isMobile && mobileSheet === 'ai'}
        onClose={() => setMobileSheet(null)}
        title={t('ai.agent.title')}
      >
        <AiAgentPanel onOpenSettings={() => setAiSettingsOpen(true)} />
      </MobileBottomSheet>
    </div>
  )
}
