import { useMemo, useState, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Gauge, Ruler, ChevronDown, ChevronUp } from 'lucide-react'
import { useI18n } from '@/shared/hooks/useI18n'
import { Button } from '@/shared/ui/Button'
import { usePhysics } from '@/features/physics/usePhysics'
import { useSandboxStore } from '@/features/sandbox/sandboxStore'
import { getFriendlyName } from '@/features/sandbox/friendlyName'

interface MeasurementReading {
  speed: number
  accel: number
  ke: number
  pe: number
  totalEnergy: number
  posY: number
}

export function MeasurementToolbar() {
  const { t } = useI18n()
  const { world } = usePhysics()
  const items = useSandboxStore((s) => s.items)
  const selectedId = useSandboxStore((s) => s.selectedId)
  const gravity = useSandboxStore((s) => s.gravity)
  const [expanded, setExpanded] = useState(false)
  const [reading, setReading] = useState<MeasurementReading>({
    speed: 0,
    accel: 0,
    ke: 0,
    pe: 0,
    totalEnergy: 0,
    posY: 0,
  })
  const [distanceTargets, setDistanceTargets] = useState<[string, string] | null>(null)
  const [distance, setDistance] = useState(0)

  const selectedItem = useMemo(() => items.find((it) => it.id === selectedId), [items, selectedId])

  const selectedName = useMemo(() => {
    if (!selectedId) return ''
    return getFriendlyName(items, selectedId)
  }, [items, selectedId])

  const throttleRef = useRef(0)

  // Update readings from physics (throttled to ~10fps)
  useFrame((_, delta) => {
    throttleRef.current += delta
    if (throttleRef.current < 0.1) return
    throttleRef.current = 0

    if (!selectedId || !world?.isReady) return
    const record = world.getBody(selectedId)
    if (!record) return
    const item = items.find((it) => it.id === selectedId)
    if (!item) return

    const rb = record.rigidBody
    const pos = rb.translation()
    const v = rb.linvel()
    const speed = Math.hypot(v.x, v.y, v.z)
    const ke = 0.5 * item.mass * speed * speed
    const pe = item.mass * Math.abs(gravity[1]) * Math.max(0, pos.y)

    setReading({
      speed,
      accel: 0, // would need delta tracking
      ke,
      pe,
      totalEnergy: ke + pe,
      posY: pos.y,
    })

    // Distance measurement
    if (distanceTargets) {
      const [aId, bId] = distanceTargets
      const a = world.getBody(aId)
      const b = world.getBody(bId)
      if (a && b) {
        const pa = a.rigidBody.translation()
        const pb = b.rigidBody.translation()
        setDistance(Math.sqrt((pb.x - pa.x) ** 2 + (pb.y - pa.y) ** 2 + (pb.z - pa.z) ** 2))
      }
    }
  })

  const dynamicItems = useMemo(() => items.filter((it) => it.isDynamic), [items])

  const handleToggleDistance = () => {
    if (distanceTargets) {
      setDistanceTargets(null)
      setDistance(0)
    } else {
      const dynItems = items.filter((it) => it.isDynamic)
      if (dynItems.length >= 2) {
        setDistanceTargets([dynItems[0].id, dynItems[1].id])
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
                {distanceTargets ? t('measurement.clear') : t('measurement.measure')}
              </Button>
            </div>

            {distanceTargets && (
              <div className="rounded bg-background px-2 py-1.5 text-center animate-in fade-in">
                <span className="font-mono text-sm font-bold text-accent">
                  {distance.toFixed(2)} m
                </span>
                <div className="mt-0.5 text-[9px] text-text-tertiary">
                  {getFriendlyName(items, distanceTargets[0])} →{' '}
                  {getFriendlyName(items, distanceTargets[1])}
                </div>
              </div>
            )}

            {!distanceTargets && dynamicItems.length >= 2 && (
              <p className="text-[9px] text-text-tertiary">{t('measurement.distanceHint')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
