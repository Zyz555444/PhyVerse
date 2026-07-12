import { Box, Circle, Cylinder, Cone, Square, Hexagon, Spline } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useSandboxStore, type SandboxShape } from './sandboxStore'
import { cn } from '@/shared/utils/cn'

interface PaletteItem {
  shape: SandboxShape
  label: string
  icon: LucideIcon
}

const paletteItems: PaletteItem[] = [
  { shape: 'box', label: '长方体', icon: Box },
  { shape: 'sphere', label: '球体', icon: Circle },
  { shape: 'cylinder', label: '圆柱', icon: Cylinder },
  { shape: 'capsule', label: '胶囊', icon: Hexagon },
  { shape: 'cone', label: '圆锥', icon: Cone },
  { shape: 'plane', label: '平面', icon: Square },
  { shape: 'torus', label: '圆环', icon: Circle },
  { shape: 'spring', label: '弹簧', icon: Spline },
]

export function EquipmentPalette() {
  const addItem = useSandboxStore((s) => s.addItem)

  const handleAdd = (shape: SandboxShape) => {
    addItem(shape)
  }

  return (
    <div className="h-full overflow-y-auto rounded-lg border border-border bg-paper-secondary p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
        器材库
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {paletteItems.map(({ shape, label, icon: Icon }) => (
          <button
            key={shape}
            type="button"
            onClick={() => handleAdd(shape)}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-lg border border-border p-3',
              'bg-paper transition-colors hover:border-accent hover:text-accent'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-text-tertiary">
        点击器材添加到场景。后续版本将支持拖拽放置。
      </p>
    </div>
  )
}
