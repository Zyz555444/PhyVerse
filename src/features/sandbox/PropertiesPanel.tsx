import { useMemo } from 'react'
import { Trash2 } from 'lucide-react'
import { Slider } from '@/shared/ui/Slider'
import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/utils/cn'
import { useSandboxStore, type SandboxItem } from './sandboxStore'

const MATERIALS = ['metal', 'plastic', 'glass', 'wood', 'rubber', 'paper'] as const

export function PropertiesPanel() {
  const items = useSandboxStore((s) => s.items)
  const selectedId = useSandboxStore((s) => s.selectedId)
  const gravity = useSandboxStore((s) => s.gravity)
  const updateItem = useSandboxStore((s) => s.updateItem)
  const removeItem = useSandboxStore((s) => s.removeItem)
  const setGravity = useSandboxStore((s) => s.setGravity)

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  )

  return (
    <div className="h-full overflow-y-auto rounded-lg border border-border bg-paper-secondary p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
        属性
      </h3>

      <section className="mb-5">
        <h4 className="mb-2 text-xs font-medium text-text-secondary">全局重力</h4>
        <div className="space-y-3">
          <VectorSlider
            label="Y"
            value={gravity[1]}
            min={-20}
            max={0}
            step={0.1}
            onChange={(v) => setGravity([gravity[0], v, gravity[2]])}
            unit="m/s²"
          />
        </div>
      </section>

      {!selectedItem ? (
        <p className="text-sm text-text-tertiary">在场景中点击器材以编辑属性。</p>
      ) : (
        <SelectedItemProperties
          item={selectedItem}
          onUpdate={(patch) => updateItem(selectedItem.id, patch)}
          onRemove={() => removeItem(selectedItem.id)}
        />
      )}
    </div>
  )
}

interface SelectedItemPropertiesProps {
  item: SandboxItem
  onUpdate: (patch: Partial<SandboxItem>) => void
  onRemove: () => void
}

function SelectedItemProperties({ item, onUpdate, onRemove }: SelectedItemPropertiesProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="rounded bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
          {item.id}
        </span>
        <span className="text-xs capitalize text-text-tertiary">{item.shape}</span>
      </div>

      <Vector3Group
        label="位置"
        values={item.position}
        min={-10}
        max={10}
        step={0.1}
        onChange={(v) => onUpdate({ position: v })}
      />

      <Vector3Group
        label="旋转"
        values={item.rotation}
        min={-Math.PI}
        max={Math.PI}
        step={0.05}
        valueFormatter={(v) => `${v.toFixed(2)} rad`}
        onChange={(v) => onUpdate({ rotation: v })}
      />

      <Vector3Group
        label="缩放"
        values={item.scale}
        min={0.1}
        max={3}
        step={0.1}
        onChange={(v) => onUpdate({ scale: v })}
      />

      <Vector3Group
        label="尺寸"
        values={item.size}
        min={0.05}
        max={5}
        step={0.05}
        onChange={(v) => onUpdate({ size: v })}
      />

      <div>
        <h4 className="mb-2 text-xs font-medium text-text-secondary">材质</h4>
        <div className="grid grid-cols-3 gap-1.5">
          {MATERIALS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onUpdate({ material: m })}
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
        <h4 className="mb-2 text-xs font-medium text-text-secondary">颜色</h4>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={item.color}
            onChange={(e) => onUpdate({ color: e.target.value })}
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
          onChange={(e) => onUpdate({ isDynamic: e.target.checked })}
          className="h-4 w-4 rounded border-border text-accent focus:ring-accent-soft"
        />
        <label htmlFor="dynamic-toggle" className="text-sm text-text-primary">
          受物理影响（动态）
        </label>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onRemove}
        leftIcon={<Trash2 className="h-4 w-4" />}
      >
        删除器材
      </Button>
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
}

function Vector3Group({
  label,
  values,
  min,
  max,
  step,
  valueFormatter,
  onChange,
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
  unit?: string
}

function VectorSlider({ label, value, min, max, step, onChange, unit }: VectorSliderProps) {
  return (
    <Slider
      label={label}
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={(v) => onChange(v[0])}
      valueFormatter={(v) => `${v.toFixed(1)} ${unit ?? ''}`}
    />
  )
}
