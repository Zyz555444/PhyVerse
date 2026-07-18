import { useMemo, useRef, useState } from 'react'
import {
  Trash2,
  Copy,
  RotateCcw,
  Link2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ArrowDownToLine,
  ChevronDown,
} from 'lucide-react'
import { useI18n } from '@/shared/hooks/useI18n'
import { Slider } from '@/shared/ui/Slider'
import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/utils/cn'
import {
  useSandboxStore,
  type SandboxItem,
  type SandboxCameraView,
  type SandboxJoint,
} from './sandboxStore'
import { getFriendlyName } from './friendlyName'

const MATERIALS = ['metal', 'plastic', 'glass', 'wood', 'rubber', 'paper'] as const

const CAMERA_VIEWS: SandboxCameraView[] = ['free', 'top', 'front', 'side']

export function PropertiesPanel() {
  const { t } = useI18n()
  const items = useSandboxStore((s) => s.items)
  const joints = useSandboxStore((s) => s.joints)
  const selectedId = useSandboxStore((s) => s.selectedId)
  const gravity = useSandboxStore((s) => s.gravity)
  const editorConfig = useSandboxStore((s) => s.editorConfig)
  const updateItem = useSandboxStore((s) => s.updateItem)
  const updateItemAndCommit = useSandboxStore((s) => s.updateItemAndCommit)
  const removeItem = useSandboxStore((s) => s.removeItem)
  const duplicateItem = useSandboxStore((s) => s.duplicateItem)
  const setGravity = useSandboxStore((s) => s.setGravity)
  const setEditorConfig = useSandboxStore((s) => s.setEditorConfig)
  const removeJoint = useSandboxStore((s) => s.removeJoint)
  const updateJoint = useSandboxStore((s) => s.updateJoint)
  const toggleLock = useSandboxStore((s) => s.toggleLock)
  const toggleVisibility = useSandboxStore((s) => s.toggleVisibility)
  const snapToGround = useSandboxStore((s) => s.snapToGround)
  const [selectedJointId, setSelectedJointId] = useState<string | null>(null)

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  )

  const selectedJoint = useMemo(
    () => joints.find((joint) => joint.id === selectedJointId) ?? null,
    [joints, selectedJointId]
  )

  return (
    <div className="h-full overflow-y-auto rounded-lg border border-border bg-paper-secondary p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
        {t('sandbox.properties')}
      </h3>

      <GravityEditor
        key={gravity.join(',')}
        gravity={gravity}
        onCommit={(g) => {
          setGravity(g)
        }}
      />

      <section className="mb-5 border-t border-border pt-4">
        <h4 className="mb-2 text-xs font-medium text-text-secondary">
          {t('sandbox.editorSettings')}
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs text-text-secondary">{t('sandbox.snap')}</label>
            <button
              type="button"
              onClick={() => setEditorConfig({ snapEnabled: !editorConfig.snapEnabled })}
              className={cn(
                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                editorConfig.snapEnabled ? 'bg-accent' : 'bg-paper-tertiary'
              )}
            >
              <span
                className={cn(
                  'inline-block h-3.5 w-3.5 transform rounded-full bg-paper shadow transition-transform',
                  editorConfig.snapEnabled ? 'translate-x-5' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>
          <Slider
            label={t('sandbox.snapSize')}
            value={[editorConfig.snapSize]}
            min={0.01}
            max={1}
            step={0.01}
            onValueChange={(v) => setEditorConfig({ snapSize: v[0] })}
            valueFormatter={(v) => `${v.toFixed(2)} m`}
            disabled={!editorConfig.snapEnabled}
          />

          <div className="flex items-center justify-between">
            <label className="text-xs text-text-secondary">{t('sandbox.angleSnap')}</label>
            <button
              type="button"
              onClick={() => setEditorConfig({ angleSnapEnabled: !editorConfig.angleSnapEnabled })}
              className={cn(
                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                editorConfig.angleSnapEnabled ? 'bg-accent' : 'bg-paper-tertiary'
              )}
            >
              <span
                className={cn(
                  'inline-block h-3.5 w-3.5 transform rounded-full bg-paper shadow transition-transform',
                  editorConfig.angleSnapEnabled ? 'translate-x-5' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>
          <Slider
            label={t('sandbox.angleSnapSize')}
            value={[Math.round((editorConfig.angleSnapSize * 180) / Math.PI)]}
            min={5}
            max={45}
            step={5}
            onValueChange={(v) => setEditorConfig({ angleSnapSize: (v[0] * Math.PI) / 180 })}
            valueFormatter={(v) => `${v}°`}
            disabled={!editorConfig.angleSnapEnabled}
          />

          <Slider
            label={t('sandbox.timeScale')}
            value={[editorConfig.timeScale]}
            min={0}
            max={2}
            step={0.1}
            onValueChange={(v) => setEditorConfig({ timeScale: v[0] })}
            valueFormatter={(v) => `${v.toFixed(1)}x`}
          />

          <div>
            <label className="mb-1.5 block text-xs text-text-secondary">
              {t('sandbox.cameraView')}
            </label>
            <div className="grid grid-cols-4 gap-1">
              {CAMERA_VIEWS.map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => setEditorConfig({ cameraView: view })}
                  className={cn(
                    'rounded-md border px-1 py-1 text-[10px] font-medium capitalize',
                    editorConfig.cameraView === view
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-border bg-paper text-text-secondary hover:border-border-strong'
                  )}
                >
                  {t(`sandbox.view${view.charAt(0).toUpperCase() + view.slice(1)}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {joints.length > 0 && (
        <section className="mb-5 border-t border-border pt-4">
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
            <Link2 className="h-3 w-3" />
            {t('sandbox.joints')} ({joints.length})
          </h4>
          <div className="space-y-1.5">
            {joints.map((joint) => (
              <JointListItem
                key={joint.id}
                joint={joint}
                items={items}
                selected={joint.id === selectedJointId}
                onSelect={() => setSelectedJointId(joint.id)}
                onRemove={() => removeJoint(joint.id)}
              />
            ))}
          </div>
          {selectedJoint && (
            <JointEditor
              key={selectedJoint.id}
              joint={selectedJoint}
              onCommit={(patch) => updateJoint(selectedJoint.id, patch)}
            />
          )}
        </section>
      )}

      {!selectedItem ? (
        <p className="text-sm text-text-tertiary">{t('sandbox.selectHint')}</p>
      ) : (
        <SelectedItemProperties
          item={selectedItem}
          friendlyName={getFriendlyName(items, selectedItem.id)}
          onChange={(patch) => updateItem(selectedItem.id, patch)}
          onCommit={(patch) => updateItemAndCommit(selectedItem.id, patch)}
          onRemove={() => removeItem(selectedItem.id)}
          onDuplicate={() => duplicateItem(selectedItem.id)}
          onToggleLock={() => toggleLock(selectedItem.id)}
          onToggleVisibility={() => toggleVisibility(selectedItem.id)}
          onSnapToGround={() => snapToGround(selectedItem.id)}
        />
      )}
    </div>
  )
}

interface JointListItemProps {
  joint: SandboxJoint
  items: SandboxItem[]
  selected: boolean
  onSelect: () => void
  onRemove: () => void
}

function JointListItem({ joint, items, selected, onSelect, onRemove }: JointListItemProps) {
  const { t } = useI18n()
  const typeLabels: Record<string, string> = {
    spring: t('sandbox.shape.spring'),
    rope: t('sandbox.jointRope'),
    fixed: t('sandbox.jointFixed'),
    revolute: t('sandbox.jointRevolute'),
    prismatic: t('sandbox.jointPrismatic'),
    motor: t('sandbox.jointMotor'),
    gear: t('sandbox.jointGear'),
  }
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect()
        }
      }}
      className={cn(
        'flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-xs transition-colors',
        selected
          ? 'border-accent bg-accent-soft'
          : 'border-border bg-paper hover:bg-paper-tertiary/40'
      )}
    >
      <div className="flex items-center gap-1.5 overflow-hidden">
        <Link2
          className={cn('h-3 w-3 shrink-0', selected ? 'text-accent' : 'text-text-tertiary')}
        />
        <span className="shrink-0 font-medium text-text-secondary">
          {typeLabels[joint.type] ?? joint.type}
        </span>
        <span className="truncate text-text-tertiary">
          {getFriendlyName(items, joint.bodyA)} ↔ {getFriendlyName(items, joint.bodyB)}
        </span>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="shrink-0 rounded p-0.5 text-text-tertiary hover:text-red-500"
        title={t('sandbox.delete')}
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  )
}

interface JointEditorProps {
  joint: SandboxJoint
  onCommit: (patch: Partial<SandboxJoint>) => void
}

function JointEditor({ joint, onCommit }: JointEditorProps) {
  const { t } = useI18n()
  const [anchorA, setAnchorA] = useState<[number, number, number]>(
    (joint.anchorA ?? [0, 0, 0]) as [number, number, number]
  )
  const [anchorB, setAnchorB] = useState<[number, number, number]>(
    (joint.anchorB ?? [0, 0, 0]) as [number, number, number]
  )
  const [axis, setAxis] = useState<[number, number, number]>(
    (joint.axis ?? [0, 1, 0]) as [number, number, number]
  )
  const [limits, setLimits] = useState<[number, number]>(
    (joint.limits ?? [0, 0]) as [number, number]
  )
  const [restLength, setRestLength] = useState(joint.restLength ?? 1)
  const [stiffness, setStiffness] = useState(joint.stiffness ?? 100)
  const [damping, setDamping] = useState(joint.damping ?? 5)
  const [maxDistance, setMaxDistance] = useState(joint.maxDistance ?? 1)
  const [targetVelocity, setTargetVelocity] = useState(joint.targetVelocity ?? 1)
  const [maxMotorForce, setMaxMotorForce] = useState(joint.maxMotorForce ?? 10)
  const [gearRatio, setGearRatio] = useState(joint.gearRatio ?? 1)

  const needsAxis =
    joint.type === 'revolute' ||
    joint.type === 'prismatic' ||
    joint.type === 'motor' ||
    joint.type === 'gear'

  return (
    <div className="mt-3 space-y-3 rounded-md border border-border bg-paper p-2.5">
      <h5 className="text-xs font-medium text-text-secondary">{t('sandbox.jointParams')}</h5>

      <Vector3Group
        label={t('sandbox.jointAnchorA')}
        values={anchorA}
        min={-5}
        max={5}
        step={0.05}
        onChange={setAnchorA}
        onCommit={(v) => onCommit({ anchorA: v })}
      />
      <Vector3Group
        label={t('sandbox.jointAnchorB')}
        values={anchorB}
        min={-5}
        max={5}
        step={0.05}
        onChange={setAnchorB}
        onCommit={(v) => onCommit({ anchorB: v })}
      />

      {needsAxis && (
        <Vector3Group
          label={t('sandbox.jointAxis')}
          values={axis}
          min={-1}
          max={1}
          step={0.05}
          onChange={setAxis}
          onCommit={(v) => onCommit({ axis: v })}
        />
      )}

      {(joint.type === 'revolute' || joint.type === 'prismatic') && (
        <>
          <Slider
            label={t('sandbox.jointLimits') + ' (min)'}
            value={[limits[0]]}
            min={-10}
            max={10}
            step={0.1}
            onValueChange={(v) => setLimits((prev) => [v[0], prev[1]])}
            onValueCommit={(v) => onCommit({ limits: [v[0], limits[1]] })}
            valueFormatter={(v) => `${v.toFixed(1)}`}
          />
          <Slider
            label={t('sandbox.jointLimits') + ' (max)'}
            value={[limits[1]]}
            min={-10}
            max={10}
            step={0.1}
            onValueChange={(v) => setLimits((prev) => [prev[0], v[0]])}
            onValueCommit={(v) => onCommit({ limits: [limits[0], v[0]] })}
            valueFormatter={(v) => `${v.toFixed(1)}`}
          />
        </>
      )}

      {joint.type === 'spring' && (
        <>
          <Slider
            label={t('sandbox.jointRestLength')}
            value={[restLength]}
            min={0.1}
            max={10}
            step={0.1}
            onValueChange={(v) => setRestLength(v[0])}
            onValueCommit={(v) => onCommit({ restLength: v[0] })}
            valueFormatter={(v) => `${v.toFixed(1)} m`}
          />
          <Slider
            label={t('sandbox.jointStiffness')}
            value={[stiffness]}
            min={1}
            max={500}
            step={1}
            onValueChange={(v) => setStiffness(v[0])}
            onValueCommit={(v) => onCommit({ stiffness: v[0] })}
            valueFormatter={(v) => `${v.toFixed(0)} N/m`}
          />
          <Slider
            label={t('sandbox.jointDamping')}
            value={[damping]}
            min={0}
            max={50}
            step={0.1}
            onValueChange={(v) => setDamping(v[0])}
            onValueCommit={(v) => onCommit({ damping: v[0] })}
            valueFormatter={(v) => `${v.toFixed(1)}`}
          />
        </>
      )}

      {joint.type === 'rope' && (
        <Slider
          label={t('sandbox.jointMaxDistance')}
          value={[maxDistance]}
          min={0.1}
          max={10}
          step={0.1}
          onValueChange={(v) => setMaxDistance(v[0])}
          onValueCommit={(v) => onCommit({ maxDistance: v[0] })}
          valueFormatter={(v) => `${v.toFixed(1)} m`}
        />
      )}

      {joint.type === 'motor' && (
        <>
          <Slider
            label={t('sandbox.jointTargetVelocity')}
            value={[targetVelocity]}
            min={-10}
            max={10}
            step={0.1}
            onValueChange={(v) => setTargetVelocity(v[0])}
            onValueCommit={(v) => onCommit({ targetVelocity: v[0] })}
            valueFormatter={(v) => `${v.toFixed(1)} rad/s`}
          />
          <Slider
            label={t('sandbox.jointMaxMotorForce')}
            value={[maxMotorForce]}
            min={0}
            max={100}
            step={1}
            onValueChange={(v) => setMaxMotorForce(v[0])}
            onValueCommit={(v) => onCommit({ maxMotorForce: v[0] })}
            valueFormatter={(v) => `${v.toFixed(0)} N`}
          />
        </>
      )}

      {joint.type === 'gear' && (
        <Slider
          label={t('sandbox.jointGearRatio')}
          value={[gearRatio]}
          min={-5}
          max={5}
          step={0.1}
          onValueChange={(v) => setGearRatio(v[0])}
          onValueCommit={(v) => onCommit({ gearRatio: v[0] })}
          valueFormatter={(v) => `${v.toFixed(1)}:1`}
        />
      )}
    </div>
  )
}

interface GravityEditorProps {
  gravity: [number, number, number]
  onCommit: (gravity: [number, number, number]) => void
}

function GravityEditor({ gravity, onCommit }: GravityEditorProps) {
  const { t } = useI18n()
  const [values, setValues] = useState<[number, number, number]>(gravity)
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const committedRef = useRef(gravity)

  const updateAxis = (idx: number, value: number) => {
    setValues((prev) => {
      const next: [number, number, number] = [...prev]
      next[idx] = value
      return next
    })
  }

  const debouncedCommit = (newValues: [number, number, number]) => {
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current)
    commitTimerRef.current = setTimeout(() => {
      const last = committedRef.current
      if (last[0] !== newValues[0] || last[1] !== newValues[1] || last[2] !== newValues[2]) {
        committedRef.current = newValues
        onCommit(newValues)
      }
    }, 300)
  }

  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-medium text-text-secondary">{t('sandbox.gravity')}</h4>
        <button
          type="button"
          onClick={() => {
            const defaultG: [number, number, number] = [0, -9.81, 0]
            setValues(defaultG)
            onCommit(defaultG)
          }}
          className="flex items-center gap-1 text-[10px] text-text-tertiary hover:text-accent"
          title={t('sandbox.resetGravity')}
        >
          <RotateCcw className="h-3 w-3" />
          {t('sandbox.reset')}
        </button>
      </div>
      <div className="space-y-3">
        <VectorSlider
          label="X"
          value={values[0]}
          min={-20}
          max={20}
          step={0.1}
          onChange={(v) => updateAxis(0, v)}
          onCommit={() => debouncedCommit(values)}
          unit="m/s²"
        />
        <VectorSlider
          label="Y"
          value={values[1]}
          min={-20}
          max={20}
          step={0.1}
          onChange={(v) => updateAxis(1, v)}
          onCommit={() => debouncedCommit(values)}
          unit="m/s²"
        />
        <VectorSlider
          label="Z"
          value={values[2]}
          min={-20}
          max={20}
          step={0.1}
          onChange={(v) => updateAxis(2, v)}
          onCommit={() => debouncedCommit(values)}
          unit="m/s²"
        />
      </div>
    </section>
  )
}

interface SelectedItemPropertiesProps {
  item: SandboxItem
  friendlyName: string
  onChange: (patch: Partial<SandboxItem>) => void
  onCommit: (patch: Partial<SandboxItem>) => void
  onRemove: () => void
  onDuplicate: () => void
  onToggleLock: () => void
  onToggleVisibility: () => void
  onSnapToGround: () => void
}

function SelectedItemProperties({
  item,
  friendlyName,
  onChange,
  onCommit,
  onRemove,
  onDuplicate,
  onToggleLock,
  onToggleVisibility,
  onSnapToGround,
}: SelectedItemPropertiesProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState<Record<string, boolean>>({
    transform: true,
    physics: true,
    appearance: true,
    actions: true,
  })

  const toggleSection = (section: string) => {
    setOpen((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span
          className="max-w-[60%] truncate rounded bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent"
          title={item.id}
        >
          {friendlyName}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onToggleVisibility}
            title={item.hidden ? t('sandbox.show') : t('sandbox.hide')}
            className={cn(
              'rounded p-1 transition-colors',
              item.hidden
                ? 'text-accent hover:bg-accent-soft'
                : 'text-text-tertiary hover:bg-paper-tertiary hover:text-text-primary'
            )}
          >
            {item.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={onToggleLock}
            title={item.locked ? t('sandbox.unlock') : t('sandbox.lock')}
            className={cn(
              'rounded p-1 transition-colors',
              item.locked
                ? 'text-accent hover:bg-accent-soft'
                : 'text-text-tertiary hover:bg-paper-tertiary hover:text-text-primary'
            )}
          >
            {item.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span className="text-text-tertiary">{t('sandbox.shapeLabel')}</span>
        <span className="capitalize text-text-secondary">{t(`sandbox.shape.${item.shape}`)}</span>
        {(item.locked || item.hidden) && (
          <span className="ml-auto flex gap-1">
            {item.locked && (
              <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] text-accent">
                {t('sandbox.lockedBadge')}
              </span>
            )}
            {item.hidden && (
              <span className="rounded bg-paper-tertiary px-1.5 py-0.5 text-[10px] text-text-tertiary">
                {t('sandbox.hiddenBadge')}
              </span>
            )}
          </span>
        )}
      </div>

      <CollapsibleSection
        title={t('sandbox.transform')}
        open={open.transform}
        onToggle={() => toggleSection('transform')}
      >
        <div className="space-y-4">
          <Vector3Group
            label={t('sandbox.position')}
            values={item.position}
            min={-10}
            max={10}
            step={0.1}
            disabled={item.locked}
            onChange={(v) => onChange({ position: v })}
            onCommit={(v) => onCommit({ position: v })}
          />
          <Vector3Group
            label={t('sandbox.rotation')}
            values={item.rotation}
            min={-Math.PI}
            max={Math.PI}
            step={0.05}
            valueFormatter={(v) => `${v.toFixed(2)} rad`}
            disabled={item.locked}
            onChange={(v) => onChange({ rotation: v })}
            onCommit={(v) => onCommit({ rotation: v })}
          />
          <Vector3Group
            label={t('sandbox.scale')}
            values={item.scale}
            min={0.1}
            max={3}
            step={0.1}
            disabled={item.locked}
            onChange={(v) => onChange({ scale: v })}
            onCommit={(v) => onCommit({ scale: v })}
          />
          <Vector3Group
            label={t('sandbox.size')}
            values={item.size}
            min={0.05}
            max={5}
            step={0.05}
            disabled={item.locked}
            onChange={(v) => onChange({ size: v })}
            onCommit={(v) => onCommit({ size: v })}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title={t('sandbox.physics')}
        open={open.physics}
        onToggle={() => toggleSection('physics')}
      >
        <div className="space-y-3">
          <Slider
            label={t('sandbox.mass')}
            value={[item.mass]}
            min={0.1}
            max={20}
            step={0.1}
            onValueChange={(v) => onChange({ mass: v[0] })}
            onValueCommit={(v) => onCommit({ mass: v[0] })}
            valueFormatter={(v) => `${v.toFixed(1)} kg`}
          />
          <Slider
            label={t('sandbox.friction')}
            value={[item.friction]}
            min={0}
            max={1}
            step={0.05}
            onValueChange={(v) => onChange({ friction: v[0] })}
            onValueCommit={(v) => onCommit({ friction: v[0] })}
            valueFormatter={(v) => v.toFixed(2)}
          />
          <Slider
            label={t('sandbox.restitution')}
            value={[item.restitution]}
            min={0}
            max={1.5}
            step={0.05}
            onValueChange={(v) => onChange({ restitution: v[0] })}
            onValueCommit={(v) => onCommit({ restitution: v[0] })}
            valueFormatter={(v) => v.toFixed(2)}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title={t('sandbox.appearance')}
        open={open.appearance}
        onToggle={() => toggleSection('appearance')}
      >
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 text-xs font-medium text-text-secondary">
              {t('sandbox.material')}
            </h4>
            <div className="grid grid-cols-3 gap-1.5">
              {MATERIALS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onCommit({ material: m })}
                  className={cn(
                    'rounded-md border px-2 py-1 text-xs font-medium capitalize transition-colors',
                    item.material === m
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-border bg-paper text-text-secondary hover:border-border-strong hover:text-text-primary'
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-medium text-text-secondary">{t('sandbox.color')}</h4>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={item.color}
                onChange={(e) => onChange({ color: e.target.value })}
                onBlur={() => onCommit({ color: item.color })}
                className="h-8 w-8 cursor-pointer rounded border border-border bg-transparent p-0.5"
              />
              <span className="font-mono text-xs text-text-tertiary">{item.color}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="dynamic-toggle"
              type="checkbox"
              checked={item.isDynamic}
              onChange={(e) => onCommit({ isDynamic: e.target.checked })}
              className="h-4 w-4 rounded border-border text-accent focus:ring-accent-soft"
            />
            <label htmlFor="dynamic-toggle" className="text-sm text-text-primary">
              {t('sandbox.dynamic')}
            </label>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title={t('sandbox.titleActions')}
        open={open.actions}
        onToggle={() => toggleSection('actions')}
      >
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDuplicate}
            leftIcon={<Copy className="h-4 w-4" />}
          >
            {t('sandbox.duplicate')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onSnapToGround}
            leftIcon={<ArrowDownToLine className="h-4 w-4" />}
            title={t('sandbox.snapToGround')}
          >
            {t('sandbox.snapToGround')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRemove}
            leftIcon={<Trash2 className="h-4 w-4" />}
          >
            {t('sandbox.delete')}
          </Button>
        </div>
      </CollapsibleSection>
    </div>
  )
}

function CollapsibleSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-paper p-2.5">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between text-xs font-medium text-text-secondary hover:text-text-primary"
      >
        {title}
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-text-tertiary transition-transform',
            open ? 'rotate-180' : 'rotate-0'
          )}
        />
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  )
}

interface Vector3GroupProps {
  label: string
  values: [number, number, number]
  min: number
  max: number
  step: number
  valueFormatter?: (v: number) => string
  disabled?: boolean
  onChange: (values: [number, number, number]) => void
  onCommit: (values: [number, number, number]) => void
}

function Vector3Group({
  label,
  values,
  min,
  max,
  step,
  valueFormatter,
  disabled,
  onChange,
  onCommit,
}: Vector3GroupProps) {
  const axes = ['X', 'Y', 'Z'] as const
  return (
    <div>
      <h4 className="mb-2 text-xs font-medium text-text-secondary">{label}</h4>
      <div className="space-y-3">
        {axes.map((axis, idx) => (
          <Slider
            key={axis}
            label={axis}
            value={[values[idx]]}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            onValueChange={(v) => {
              const next: [number, number, number] = [...values]
              next[idx] = v[0]
              onChange(next)
            }}
            onValueCommit={(v) => {
              const next: [number, number, number] = [...values]
              next[idx] = v[0]
              onCommit(next)
            }}
            valueFormatter={valueFormatter}
          />
        ))}
      </div>
    </div>
  )
}

interface VectorSliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  onCommit?: (value: number) => void
  unit?: string
}

function VectorSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  onCommit,
  unit,
}: VectorSliderProps) {
  return (
    <Slider
      label={label}
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={(v) => onChange(v[0])}
      onValueCommit={(v) => onCommit?.(v[0])}
      valueFormatter={(v) => `${v.toFixed(1)} ${unit ?? ''}`}
    />
  )
}
