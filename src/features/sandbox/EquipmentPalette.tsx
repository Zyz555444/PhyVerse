import { useMemo, useState } from 'react'
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
  RotateCw,
  Ruler,
  BrickWall,
  Weight,
  Atom,
  Search,
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

const geometryItems: PaletteItem[] = [
  { shape: 'box', icon: Box },
  { shape: 'sphere', icon: Circle },
  { shape: 'cylinder', icon: Cylinder },
  { shape: 'capsule', icon: Pill },
  { shape: 'cone', icon: Cone },
  { shape: 'plane', icon: Square },
  { shape: 'torus', icon: CircleDashed },
  { shape: 'spring', icon: Spline },
]

const equipmentItems: PaletteItem[] = [
  { shape: 'pulley', icon: RotateCw },
  { shape: 'slope', icon: Ruler },
  { shape: 'barrier', icon: BrickWall },
  { shape: 'force_meter', icon: Weight },
  { shape: 'force_field', icon: Atom },
]

type PaletteTab = 'all' | 'geometry' | 'equipment' | 'presets'

export function EquipmentPalette() {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<PaletteTab>('all')
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

  const normalizedQuery = query.trim().toLowerCase()

  const filteredGeometry = useMemo(() => {
    return geometryItems.filter((item) =>
      t(`sandbox.shape.${item.shape}`).toLowerCase().includes(normalizedQuery)
    )
  }, [normalizedQuery, t])

  const filteredEquipment = useMemo(() => {
    return equipmentItems.filter((item) =>
      t(`sandbox.shape.${item.shape}`).toLowerCase().includes(normalizedQuery)
    )
  }, [normalizedQuery, t])

  const filteredPresets = useMemo(() => {
    return SANDBOX_PRESETS.filter((preset) => preset.label.toLowerCase().includes(normalizedQuery))
  }, [normalizedQuery])

  const showGeometry = tab === 'all' || tab === 'geometry'
  const showEquipment = tab === 'all' || tab === 'equipment'
  const showPresets = tab === 'all' || tab === 'presets'

  const tabs: { key: PaletteTab; labelKey: string }[] = [
    { key: 'all', labelKey: 'sandbox.tabAll' },
    { key: 'geometry', labelKey: 'sandbox.tabGeometry' },
    { key: 'equipment', labelKey: 'sandbox.tabEquipment' },
    { key: 'presets', labelKey: 'sandbox.tabPresets' },
  ]

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-paper-secondary">
      <div className="border-b border-border p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          {t('sandbox.equipment')}
        </h3>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('sandbox.paletteSearch')}
            className="w-full rounded-md border border-border bg-paper py-1.5 pl-7 pr-2 text-xs text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
          />
        </div>
        <div className="mt-2 flex gap-1">
          {tabs.map(({ key, labelKey }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'flex-1 rounded-md px-1 py-1 text-[10px] font-medium transition-colors',
                tab === key
                  ? 'bg-accent-soft text-accent'
                  : 'text-text-secondary hover:bg-paper hover:text-text-primary'
              )}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {showGeometry && filteredGeometry.length > 0 && (
          <>
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
              {t('sandbox.geometryShapes')}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {filteredGeometry.map(({ shape, icon: Icon }) => (
                <PaletteButton
                  key={shape}
                  icon={Icon}
                  label={t(`sandbox.shape.${shape}`)}
                  onClick={() => handleAdd(shape)}
                />
              ))}
            </div>
          </>
        )}

        {showEquipment && filteredEquipment.length > 0 && (
          <>
            <h4 className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
              {t('sandbox.labEquipment')}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {filteredEquipment.map(({ shape, icon: Icon }) => (
                <PaletteButton
                  key={shape}
                  icon={Icon}
                  label={t(`sandbox.shape.${shape}`)}
                  onClick={() => handleAdd(shape)}
                />
              ))}
            </div>
          </>
        )}

        {showPresets && filteredPresets.length > 0 && (
          <>
            <h4 className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
              {t('sandbox.presets')}
            </h4>
            <div className="space-y-2">
              {filteredPresets.map(({ id, label, scene }) => (
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
          </>
        )}

        {filteredGeometry.length === 0 &&
          filteredEquipment.length === 0 &&
          filteredPresets.length === 0 && (
            <p className="py-6 text-center text-xs text-text-tertiary">
              {t('sandbox.paletteNoResults')}
            </p>
          )}

        {tab === 'all' && query === '' && (
          <p className="mt-4 text-[10px] leading-relaxed text-text-tertiary">
            {t('sandbox.paletteHint')}
          </p>
        )}
      </div>
    </div>
  )
}

function PaletteButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-lg border border-border p-3',
        'bg-paper transition-colors hover:border-accent hover:text-accent'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}
