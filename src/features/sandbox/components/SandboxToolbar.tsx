import { type FC } from 'react'
import { useI18n } from '@/shared/hooks/useI18n'
import { useSandboxStore, type JointType } from '../sandboxStore'
import { ToolButton, Divider } from './ToolButton'
import { cn } from '@/shared/utils/cn'
import type { LucideIcon } from 'lucide-react'
import {
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Copy,
  ClipboardCopy,
  ClipboardPaste,
  Eraser,
  Camera,
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
  Sparkles,
  Box as BoxIcon,
  Eye,
  BarChart3,
  Magnet,
  Menu,
  Upload,
  Download,
  Cloud,
  Circle,
  Square,
} from 'lucide-react'
import { SANDBOX_PRESETS } from '../presets'
import type { SandboxCameraView } from '../sandboxStore'

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

function SceneMenuItem({
  icon: Icon,
  label,
  onClick,
  active,
  disabled,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors',
        active
          ? 'bg-accent-soft text-accent'
          : 'text-text-primary hover:bg-accent-soft hover:text-accent',
        disabled && 'cursor-not-allowed opacity-40'
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

interface SandboxToolbarProps {
  isFullscreen: boolean
  isMobile: boolean
  cloudOpen: boolean
  sceneMenuOpen: boolean
  showJointMenu: boolean
  sceneMenuRef: React.RefObject<HTMLDivElement | null>
  jointMenuRef: React.RefObject<HTMLDivElement | null>
  fileInputRef: React.RefObject<HTMLInputElement | null>
  mobileSheet: 'equipment' | 'tasks' | 'hierarchy' | 'properties' | 'data' | 'ai' | null
  setCameraResetKey: (key: number | ((prev: number) => number)) => void
  setCameraFocusKey: (key: number | ((prev: number) => number)) => void
  setCloudOpen: (open: boolean | ((prev: boolean) => boolean)) => void
  setSceneMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void
  setShowJointMenu: (open: boolean | ((prev: boolean) => boolean)) => void
  setMobileSheet: (sheet: 'equipment' | 'tasks' | 'hierarchy' | 'properties' | 'data' | 'ai' | null) => void
  onImportClick: () => void
  onExport: () => void
  onSaveTemplate: () => void
  onClear: () => void
  onCreateJoint: (type: JointType) => void
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const SandboxToolbar: FC<SandboxToolbarProps> = ({
  isFullscreen,
  isMobile,
  cloudOpen,
  sceneMenuOpen,
  showJointMenu,
  sceneMenuRef,
  jointMenuRef,
  fileInputRef,
  mobileSheet,
  setCameraResetKey,
  setCameraFocusKey,
  setCloudOpen,
  setSceneMenuOpen,
  setShowJointMenu,
  setMobileSheet,
  onImportClick,
  onExport,
  onSaveTemplate,
  onClear,
  onCreateJoint,
  handleFileChange,
}) => {
  const { t } = useI18n()
  const isRunning = useSandboxStore((s) => s.isRunning)
  const setRunning = useSandboxStore((s) => s.setRunning)
  const isPlaying = useSandboxStore((s) => s.recording.isPlaying)
  const isRecording = useSandboxStore((s) => s.recording.isRecording)
  const recordingFrames = useSandboxStore((s) => s.recording.frames)
  const startRecording = useSandboxStore((s) => s.startRecording)
  const stopRecording = useSandboxStore((s) => s.stopRecording)
  const clearRecording = useSandboxStore((s) => s.clearRecording)
  const selectedId = useSandboxStore((s) => s.selectedId)
  const multiSelectedIds = useSandboxStore((s) => s.multiSelectedIds)
  const clipboard = useSandboxStore((s) => s.clipboard)
  const editorConfig = useSandboxStore((s) => s.editorConfig)
  const ui = useSandboxStore((s) => s.ui)
  const removeItem = useSandboxStore((s) => s.removeItem)
  const duplicateItem = useSandboxStore((s) => s.duplicateItem)
  const copyItem = useSandboxStore((s) => s.copyItem)
  const pasteItem = useSandboxStore((s) => s.pasteItem)
  const resetScene = useSandboxStore((s) => s.resetScene)
  const loadScene = useSandboxStore((s) => s.loadScene)
  const undo = useSandboxStore((s) => s.undo)
  const redo = useSandboxStore((s) => s.redo)
  const setEditorConfig = useSandboxStore((s) => s.setEditorConfig)
  const setUI = useSandboxStore((s) => s.setUI)
  const requestStep = useSandboxStore((s) => s.requestStep)
  const items = useSandboxStore((s) => s.items)

  const gizmoMode = editorConfig.gizmoMode
  const gizmoSpace = editorConfig.gizmoSpace
  const impulseMode = editorConfig.impulseMode
  const impulseStrength = editorConfig.impulseStrength
  const showTrajectory = editorConfig.showTrajectory
  const showForceVectors = editorConfig.showForceVectors
  const showEnergyBar = editorConfig.showEnergyBar
  const leftOpen = ui.isLeftPanelOpen
  const centerOpen = ui.isRightPanelOpen
  const aiOpen = ui.isAiPanelOpen

  const canCreateJoint = [selectedId, ...multiSelectedIds].filter(Boolean).length >= 2

  return (
    <div
      className={cn(
        'mb-2 flex items-center gap-2',
        isMobile ? 'overflow-x-auto flex-nowrap' : 'flex-wrap',
        isFullscreen && 'px-1 pt-1'
      )}
    >
      {/* Title + Playback */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {!isFullscreen && !isMobile && (
          <h1 className="font-heading text-xl text-text-primary">{t('nav.sandbox')}</h1>
        )}
        <button
          type="button"
          onClick={() => {
            if (isPlaying) return
            setRunning(!isRunning)
          }}
          disabled={isPlaying}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            isPlaying || isRunning
              ? 'bg-accent-soft text-accent border border-accent'
              : 'bg-accent text-white border border-accent'
          )}
        >
          {isPlaying ? (
            <Play className="h-3.5 w-3.5" />
          ) : isRunning ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          {isPlaying ? t('sandbox.playing') : isRunning ? t('sandbox.pause') : t('sandbox.run')}
        </button>

        {/* Recording button */}
        {isRecording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-1.5 rounded-lg border border-danger bg-red-50 px-3 py-1.5 text-sm font-medium text-danger hover:bg-red-100"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-danger" />
            </span>
            <Square className="h-3.5 w-3.5 fill-current" />
            {t('sandbox.recording.stop')}
          </button>
        ) : recordingFrames.length > 0 ? (
          <button
            type="button"
            onClick={clearRecording}
            title={t('sandbox.recording.clear')}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-paper px-3 py-1.5 text-sm text-text-secondary hover:border-border-strong hover:text-text-primary"
          >
            <Circle className="h-3.5 w-3.5 text-accent" />
            {t('sandbox.recording.frames', { count: recordingFrames.length })}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => startRecording()}
            disabled={isPlaying}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
              isPlaying
                ? 'cursor-not-allowed border-border bg-paper text-text-tertiary opacity-40'
                : 'border-danger/30 bg-paper text-danger hover:bg-red-50'
            )}
          >
            <Circle className="h-3.5 w-3.5 fill-danger text-danger" />
            {t('sandbox.recording.start')}
          </button>
        )}
      </div>

      <div className="flex items-center gap-1">
        <ToolButton
          icon={SkipForward}
          onClick={requestStep}
          title={t('sandbox.step')}
          disabled={isRunning}
          size="sm"
        />
        <ToolButton icon={Undo2} onClick={undo} title={t('sandbox.undo')} size="sm" />
        <ToolButton icon={Redo2} onClick={redo} title={t('sandbox.redo')} size="sm" />
      </div>

      <Divider />

      {/* Edit / simulation controls */}
      {!isRunning && selectedId && (
        <div className="flex items-center gap-1">
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
          <button
            type="button"
            onClick={() =>
              setEditorConfig({ gizmoSpace: gizmoSpace === 'world' ? 'local' : 'world' })
            }
            title={t(gizmoSpace === 'world' ? 'sandbox.gizmoWorld' : 'sandbox.gizmoLocal')}
            className="rounded-lg border border-border bg-paper px-2 py-1 text-xs font-medium text-text-secondary hover:text-text-primary"
          >
            {gizmoSpace === 'world' ? 'W' : 'L'}
          </button>
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
          <ToolButton
            icon={Eye}
            onClick={() => setEditorConfig({ showForceVectors: !showForceVectors })}
            title={t('sandbox.forceVectors')}
            active={showForceVectors}
          />
          <ToolButton
            icon={BarChart3}
            onClick={() => setEditorConfig({ showEnergyBar: !showEnergyBar })}
            title={t('sandbox.energyBar')}
            active={showEnergyBar}
          />
        </div>
      )}

      <ToolButton
        icon={Magnet}
        onClick={() => setEditorConfig({ snapEnabled: !editorConfig.snapEnabled })}
        title={t('sandbox.snap')}
        active={editorConfig.snapEnabled}
      />

      <Divider />

      {/* View controls */}
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

      <Divider />

      {/* Time scale */}
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

      <div className="ml-auto flex items-center gap-1">
        {/* Edit clipboard */}
        <div className="flex items-center gap-1">
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
            <div className="absolute right-0 top-full z-20 mt-1 w-32 rounded-lg border border-border bg-paper py-1 shadow-lg">
              {JOINT_TYPES.map(({ type, labelKey }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onCreateJoint(type)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-text-primary hover:bg-accent-soft hover:text-accent"
                >
                  <Link2 className="h-3 w-3" />
                  {t(labelKey)}
                </button>
              ))}
            </div>
          )}
        </div>

        <Divider />

        {/* Scene menu */}
        <div className="relative" ref={sceneMenuRef}>
          <ToolButton
            icon={Menu}
            onClick={() => setSceneMenuOpen((s) => !s)}
            title={t('sandbox.sceneMenu')}
            active={sceneMenuOpen}
          />
          {sceneMenuOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-border bg-paper py-1 shadow-lg">
              <SceneMenuItem
                icon={Upload}
                label={t('sandbox.import')}
                onClick={() => {
                  onImportClick()
                  setSceneMenuOpen(false)
                }}
              />
              <SceneMenuItem
                icon={Download}
                label={t('sandbox.export')}
                onClick={() => {
                  onExport()
                  setSceneMenuOpen(false)
                }}
              />
              <SceneMenuItem
                icon={Cloud}
                label={t('cloud.title')}
                active={cloudOpen}
                onClick={() => {
                  setCloudOpen((open) => !open)
                  setSceneMenuOpen(false)
                }}
              />
              <div className="my-1 h-px bg-border" />
              <SceneMenuItem
                icon={Download}
                label={t('sandbox.templateSave')}
                disabled={items.length === 0}
                onClick={() => {
                  onSaveTemplate()
                  setSceneMenuOpen(false)
                }}
              />
              <div className="my-1 h-px bg-border" />
              <div className="px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
                {t('sandbox.presets')}
              </div>
              {SANDBOX_PRESETS.map(({ id, label, labelKey, scene }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    if (window.confirm(t('sandbox.presetConfirm', { name: label }))) {
                      loadScene(scene)
                    }
                    setSceneMenuOpen(false)
                  }}
                  className="block w-full px-3 py-1.5 text-left text-xs text-text-primary hover:bg-accent-soft hover:text-accent"
                >
                  {t(labelKey)}
                </button>
              ))}
              <div className="my-1 h-px bg-border" />
              <SceneMenuItem
                icon={Eraser}
                label={t('sandbox.clear')}
                disabled={items.length === 0}
                onClick={() => {
                  onClear()
                  setSceneMenuOpen(false)
                }}
              />
              <SceneMenuItem
                icon={RotateCcw}
                label={t('sandbox.reset')}
                onClick={() => {
                  resetScene()
                  setSceneMenuOpen(false)
                }}
              />
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleFileChange}
          className="hidden"
        />

        <Divider />

        {isMobile && (
          <>
            <ToolButton
              icon={BoxIcon}
              onClick={() => setMobileSheet(mobileSheet === 'equipment' ? null : 'equipment')}
              title={t('sandbox.equipment')}
              active={mobileSheet === 'equipment'}
            />
            <ToolButton
              icon={PanelLeftOpen}
              onClick={() => setMobileSheet(mobileSheet === 'hierarchy' ? null : 'hierarchy')}
              title={t('sandbox.hierarchy')}
              active={mobileSheet === 'hierarchy'}
            />
            <ToolButton
              icon={PanelRightOpen}
              onClick={() => setMobileSheet(mobileSheet === 'properties' ? null : 'properties')}
              title={t('sandbox.properties')}
              active={mobileSheet === 'properties'}
            />
            <ToolButton
              icon={BarChart3}
              onClick={() => setMobileSheet(mobileSheet === 'data' ? null : 'data')}
              title={t('sandbox.telemetry')}
              active={mobileSheet === 'data'}
            />
            <ToolButton
              icon={Sparkles}
              onClick={() => setMobileSheet(mobileSheet === 'ai' ? null : 'ai')}
              title={t('ai.agent.title')}
              active={mobileSheet === 'ai'}
            />
          </>
        )}

        <ToolButton
          icon={HelpCircle}
          onClick={() => setUI({ isHelpOpen: !ui.isHelpOpen })}
          title={t('sandbox.help')}
        />
        {!isFullscreen && !isMobile && (
          <>
            <ToolButton
              icon={leftOpen ? PanelLeftClose : PanelLeftOpen}
              onClick={() => setUI({ isLeftPanelOpen: !leftOpen })}
              title={leftOpen ? t('sandbox.hidePalette') : t('sandbox.showPalette')}
            />
            <ToolButton
              icon={centerOpen ? PanelRightClose : PanelRightOpen}
              onClick={() => setUI({ isRightPanelOpen: !centerOpen })}
              title={centerOpen ? t('sandbox.hideProperties') : t('sandbox.showProperties')}
            />
            <ToolButton
              icon={Sparkles}
              onClick={() => setUI({ isAiPanelOpen: !aiOpen })}
              title={aiOpen ? t('ai.agent.hide') : t('ai.agent.show')}
              active={aiOpen}
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
  )
}
