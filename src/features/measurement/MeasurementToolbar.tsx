import { useMemo, useState, useSyncExternalStore } from 'react'
import { Gauge, Ruler, ChevronDown, ChevronUp } from 'lucide-react'
import { useI18n } from '@/shared/hooks/useI18n'
import { Button } from '@/shared/ui/Button'
import { useSandboxStore } from '@/features/sandbox/sandboxStore'
import { getFriendlyName } from '@/features/sandbox/friendlyName'
import {
  getMeasurementData,
  subscribeMeasurementData,
  setMeasurementData,
} from './measurementDataStore'

export function MeasurementToolbar() {
  const { t } = useI18n()
  const items = useSandboxStore((s) => s.items)
  const selectedId = useSandboxStore((s) => s.selectedId)
  const [expanded, setExpanded] = useState(false)

  const reading = useSyncExternalStore(subscribeMeasurementData, getMeasurementData)

  const selectedItem = useMemo(() => items.find((it) => it.id === selectedId), [items, selectedId])

  const selectedName = useMemo(() => {
    if (!selectedId) return ''
    return getFriendlyName(items, selectedId)
  }, [items, selectedId])

  const dynamicItems = useMemo(() => items.filter((it) => it.isDynamic), [items])

  const handleToggleDistance = () => {
    if (reading.distanceTargets) {
      setMeasurementData({ distanceTargets: null, distance: 0 })
    } else {
      const dynItems = items.filter((it) => it.isDynamic)
      if (dynItems.length >= 2) {
        setMeasurementData({ distanceTargets: [dynItems[0].id, dynItems[1].id] })
      }
    }
  }

  return (
    <div className="rounded-lg border border-border bg-paper">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary"
      >
        <div className="flex items-center gap-2">
          <Gauge className="h-3.5 w-3.5 text-accent" />
          {t('measurement.title')}
        </div>
        {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
      </button>

      {expanded && (
        <div className="border-t border-border px-3 pb-3 space-y-3">
          {/* Speed & Energy readings */}
          {selectedItem && selectedItem.isDynamic && (
            <div className="space-y-2">
              <div className="text-[10px] font-medium text-text-tertiary">
                {t('measurement.selectedObject')}: {selectedName}
              </div>

              {/* Speed gauge */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-text-tertiary">{t('measurement.speed')}</span>
                  <span className="font-mono font-medium text-accent">
                    {reading.speed.toFixed(2)} m/s
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${Math.min(reading.speed * 5, 100)}%` }}
                  />
                </div>
              </div>

              {/* Energy bars */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-text-tertiary">{t('measurement.kineticEnergy')}</span>
                    <span className="font-mono" style={{ color: '#f97316' }}>
                      {reading.ke.toFixed(2)} J
                    </span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(reading.ke * 10, 100)}%`,
                        backgroundColor: '#f97316',
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-text-tertiary">{t('measurement.potentialEnergy')}</span>
                    <span className="font-mono" style={{ color: '#3b82f6' }}>
                      {reading.pe.toFixed(2)} J
                    </span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(reading.pe * 10, 100)}%`,
                        backgroundColor: '#3b82f6',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Total energy */}
              <div className="flex justify-between rounded bg-background px-2 py-1 text-[10px]">
                <span className="text-text-tertiary">{t('measurement.totalEnergy')}</span>
                <span className="font-mono font-medium text-text-primary">
                  {reading.totalEnergy.toFixed(2)} J
                </span>
              </div>

              {/* Height */}
              <div className="flex justify-between rounded bg-background px-2 py-1 text-[10px]">
                <span className="text-text-tertiary">{t('measurement.height')}</span>
                <span className="font-mono font-medium text-text-primary">
                  {reading.posY.toFixed(2)} m
                </span>
              </div>
            </div>
          )}

          {!selectedItem && (
            <p className="text-[10px] text-text-tertiary italic">{t('measurement.selectHint')}</p>
          )}

          {/* Distance measurement */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-text-tertiary">
                <Ruler className="h-3 w-3" />
                {t('measurement.distance')}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleDistance}
                disabled={dynamicItems.length < 2}
                className="text-[10px] h-6 px-2"
              >
                {reading.distanceTargets ? t('measurement.clear') : t('measurement.measure')}
              </Button>
            </div>

            {reading.distanceTargets && (
              <div className="rounded bg-background px-2 py-1.5 text-center animate-in fade-in">
                <span className="font-mono text-sm font-bold text-accent">
                  {reading.distance.toFixed(2)} m
                </span>
                <div className="mt-0.5 text-[9px] text-text-tertiary">
                  {getFriendlyName(items, reading.distanceTargets[0])} →{' '}
                  {getFriendlyName(items, reading.distanceTargets[1])}
                </div>
              </div>
            )}

            {!reading.distanceTargets && dynamicItems.length >= 2 && (
              <p className="text-[9px] text-text-tertiary">{t('measurement.distanceHint')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
