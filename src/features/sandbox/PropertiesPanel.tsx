import { useMemo, useState } from 'react'
import { Trash2, Copy, RotateCcw } from 'lucide-react'
import { useI18n } from '@/shared/hooks/useI18n'
import { Slider } from '@/shared/ui/Slider'
import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/utils/cn'
import { useSandboxStore, type SandboxItem, type SandboxCameraView } from './sandboxStore'

const MATERIALS = ['metal', 'plastic', 'glass', 'wood', 'rubber', 'paper'] as const

const CAMERA_VIEWS: SandboxCameraView[] = ['free', 'top', 'front', 'side']

export function PropertiesPanel() {
  const { t } = useI18n()
  const items = useSandboxStore((s) => s.items)
  const selectedId = useSandboxStore((s) => s.selectedId)
  const gravity = useSandboxStore((s) => s.gravity)
  const editorConfig = useSandboxStore((s) => s.editorConfig)
  const updateItem = useSandboxStore((s) => s.updateItem)
  const updateItemAndCommit = useSandboxStore((s) => s.updateItemAndCommit)
  const removeItem = useSandboxStore((s) => s.removeItem)
  const duplicateItem = useSandboxStore((s) => s.duplicateItem)
  const setGravity = useSandboxStore((s) => s.setGravity)
  const commitHistory = useSandboxStore((s) => s.commitHistory)
  const setEditorConfig = useSandboxStore((s) => s.setEditorConfig)

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
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
          commitHistory()
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

      {!selectedItem ? (
        <p className="text-sm text-text-tertiary">{t('sandbox.selectHint')}</p>
      ) : (
        <SelectedItemProperties
          item={selectedItem}
          onChange={(patch) => updateItem(selectedItem.id, patch)}
          onCommit={(patch) => updateItemAndCommit(selectedItem.id, patch)}
          onRemove={() => removeItem(selectedItem.id)}
          onDuplicate={() => duplicateItem(selectedItem.id)}
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

  const updateAxis = (idx: number, value: number) => {
    setValues((prev) => {
      const next: [number, number, number] = [...prev]
      next[idx] = value
      return next
    })
  }

  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-medium text-text-secondary">{t('sandbox.gravity')}</h4>
        <button
          type="button"
          onClick={() => onCommit([0, -9.81, 0])}
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
          onCommit={() => onCommit(values)}
          unit="m/s²"
        />
        <VectorSlider
          label="Y"
          value={values[1]}
          min={-20}
          max={20}
          step={0.1}
          onChange={(v) => updateAxis(1, v)}
          onCommit={() => onCommit(values)}
          unit="m/s²"
        />
        <VectorSlider
          label="Z"
          value={values[2]}
          min={-20}
          max={20}
          step={0.1}
          onChange={(v) => updateAxis(2, v)}
          onCommit={() => onCommit(values)}
          unit="m/s²"
        />
      </div>
    </section>
  )
}

interface SelectedItemPropertiesProps {
  item: SandboxItem
  onChange: (patch: Partial<SandboxItem>) => void
  onCommit: (patch: Partial<SandboxItem>) => void
  onRemove: () => void
  onDuplicate: () => void
}

function SelectedItemProperties({
  item,
  onChange,
  onCommit,
  onRemove,
  onDuplicate,
}: SelectedItemPropertiesProps) {
  const { t } = useI18n()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span
          className="max-w-[70%] truncate rounded bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent"
          title={item.id}
        >
          {item.id}
        </span>
        <span className="text-xs capitalize text-text-tertiary">{item.shape}</span>
      </div>

      <Vector3Group
        label={t('sandbox.position')}
        values={item.position}
        min={-10}
        max={10}
        step={0.1}
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
        onChange={(v) => onChange({ rotation: v })}
        onCommit={(v) => onCommit({ rotation: v })}
      />

      <Vector3Group
        label={t('sandbox.scale')}
        values={item.scale}
        min={0.1}
        max={3}
        step={0.1}
        onChange={(v) => onChange({ scale: v })}
        onCommit={(v) => onCommit({ scale: v })}
      />

      <Vector3Group
        label={t('sandbox.size')}
        values={item.size}
        min={0.05}
        max={5}
        step={0.05}
        onChange={(v) => onChange({ size: v })}
        onCommit={(v) => onCommit({ size: v })}
      />

      <section>
        <h4 className="mb-2 text-xs font-medium text-text-secondary">{t('sandbox.physics')}</h4>
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
      </section>

      <div>
        <h4 className="mb-2 text-xs font-medium text-text-secondary">{t('sandbox.material')}</h4>
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
          onClick={onRemove}
          leftIcon={<Trash2 className="h-4 w-4" />}
        >
          {t('sandbox.delete')}
        </Button>
      </div>
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
