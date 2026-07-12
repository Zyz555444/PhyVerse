import {
  Box,
  Circle,
  CircleDashed,
  Cylinder,
  Cone,
  Pill,
  Square,
  Spline,
  Layers,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/shared/hooks/useI18n'
import { useSandboxStore, type SandboxShape } from './sandboxStore'
import { SANDBOX_PRESETS } from './presets'
import { cn } from '@/shared/utils/cn'

interface PaletteItem {
  shape: SandboxShape
  icon: LucideIcon
}

const paletteItems: PaletteItem[] = [
  { shape: 'box', icon: Box },
  { shape: 'sphere', icon: Circle },
  { shape: 'cylinder', icon: Cylinder },
  { shape: 'capsule', icon: Pill },
  { shape: 'cone', icon: Cone },
  { shape: 'plane', icon: Square },
  { shape: 'torus', icon: CircleDashed },
  { shape: 'spring', icon: Spline },
]

export function EquipmentPalette() {
  const { t } = useI18n()
  const addItem = useSandboxStore((s) => s.addItem)
  const loadScene = useSandboxStore((s) => s.loadScene)

  const handleAdd = (shape: SandboxShape) => {
    addItem(shape)
  }

  const handleLoadPreset = (scene: (typeof SANDBOX_PRESETS)[number]['scene'], label: string) => {
    if (window.confirm(t('sandbox.presetConfirm', { name: label }))) {
      loadScene(scene)
    }
  }

  return (
    <div className="h-full overflow-y-auto rounded-lg border border-border bg-paper-secondary p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
        {t('sandbox.equipment')}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {paletteItems.map(({ shape, icon: Icon }) => (
          <button
            key={shape}
            type="button"
            onClick={() => handleAdd(shape)}
            title={t(`sandbox.shape.${shape}`)}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-lg border border-border p-3',
              'bg-paper transition-colors hover:border-accent hover:text-accent'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs font-medium">{t(`sandbox.shape.${shape}`)}</span>
          </button>
        ))}
      </div>

      <h3 className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
        {t('sandbox.presets')}
      </h3>
      <div className="space-y-2">
        {SANDBOX_PRESETS.map(({ id, label, scene }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleLoadPreset(scene, label)}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg border border-border p-2.5',
              'bg-paper text-left text-xs font-medium transition-colors hover:border-accent hover:text-accent'
            )}
          >
            <Layers className="h-4 w-4 shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-text-tertiary">
        {t('sandbox.paletteHint')}
      </p>
    </div>
  )
}
