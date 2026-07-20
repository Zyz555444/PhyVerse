import { useMemo, useState, useRef, useCallback, memo } from 'react'
import {
  Activity,
  Play,
  Square,
  Trash2,
  Download,
  ChevronDown,
  ChevronRight,
  Move3d,
  Gauge,
  ZoomOut,
} from 'lucide-react'
import { useI18n } from '@/shared/hooks/useI18n'
import { cn } from '@/shared/utils/cn'
import { useSandboxStore, type TelemetrySample } from './sandboxStore'
import { getFriendlyName } from './friendlyName'
import { exportTelemetryCsv } from './sceneStorage'
import { CanvasChart, CrosshairCanvas, type CanvasChartInteraction } from './CanvasChart'

const CHART_W = 320
const CHART_H = 110

function Reading({
  label,
  value,
  unit,
  accent,
}: {
  label: string
  value: string
  unit: string
  accent?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-text-tertiary">{label}</span>
      <span
        className={cn(
          'font-mono tabular-nums',
          accent ? 'font-semibold text-accent' : 'text-text-primary'
        )}
      >
        {value}
        <span className="ml-1 text-[10px] text-text-tertiary">{unit}</span>
      </span>
    </div>
  )
}

export function DataPanel() {
  const { t } = useI18n()
  const telemetry = useSandboxStore((s) => s.telemetry)
  const items = useSandboxStore((s) => s.items)
  const selectedId = useSandboxStore((s) => s.selectedId)
  const editorConfig = useSandboxStore((s) => s.editorConfig)
  const toggleSampling = useSandboxStore((s) => s.toggleTelemetrySampling)
  const clearTelemetry = useSandboxStore((s) => s.clearTelemetry)
  const setEditorConfig = useSandboxStore((s) => s.setEditorConfig)

  const [collapsed, setCollapsed] = useState(true)
  const [viewMin, setViewMin] = useState(0)
  const [viewExtent, setViewExtent] = useState(0)
  const [hoverSample, setHoverSample] = useState<TelemetrySample | null>(null)
  const [hoverX, setHoverX] = useState(0)
  const [hoverY, setHoverY] = useState(0)

  const trackedId = telemetry.trackedId ?? selectedId
  const trackedItem = useMemo(
    () => items.find((it) => it.id === trackedId) ?? null,
    [items, trackedId]
  )

  const live = telemetry.live
  const samples = telemetry.samples
  const sampling = telemetry.sampling

  const maxSpeed = useMemo(() => {
    let m = 1
    for (const s of samples) if (s.speed > m) m = s.speed
    return m
  }, [samples])

  const maxT = samples.length > 0 ? samples[samples.length - 1].t : 0
  const viewMax =
    viewExtent > 0
      ? Math.min(viewMin + viewExtent, maxT)
      : maxT

  // Auto-scroll to latest when new data arrives (only when not zoomed/panned)
  const prevMaxT = useRef(0)
  const [dragRef] = useState<{ current: boolean }>({ current: false })
  if (maxT !== prevMaxT.current && !dragRef.current && viewExtent === 0) {
    prevMaxT.current = maxT
    setViewMin(0)
  } else {
    prevMaxT.current = maxT
  }

  const handleExportCsv = () => {
    if (samples.length === 0) return
    const label = trackedItem ? getFriendlyName(items, trackedItem.id) : 'telemetry'
    exportTelemetryCsv(samples, label)
  }

  const trackedName = trackedItem
    ? (trackedItem.displayName ?? getFriendlyName(items, trackedItem.id))
    : null

  const handleInteraction = useCallback((interaction: CanvasChartInteraction) => {
    setHoverSample(interaction.hoverSample)
    setHoverX(interaction.hoverX)
    setHoverY(interaction.hoverY)
  }, [])

  const handleViewChange = useCallback(
    (newViewMin: number, newViewExtent: number) => {
      setViewMin(newViewMin)
      setViewExtent(newViewExtent)
    },
    []
  )

  const handleResetView = () => {
    setViewMin(0)
    setViewExtent(0)
  }

  const isZoomed = viewExtent > 0
  const hovering = hoverSample !== null

  return (
    <div className="flex-shrink-0 rounded-lg border border-border bg-paper-secondary">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-1.5">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="text-text-tertiary hover:text-text-primary"
          title={collapsed ? t('sandbox.dataExpand') : t('sandbox.dataCollapse')}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
        <Activity className="h-3.5 w-3.5 text-accent" />
        <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {t('sandbox.dataMonitor')}
        </span>
        {trackedName && (
          <span className="max-w-[8rem] truncate rounded bg-accent-soft px-1.5 py-0.5 text-[10px] text-accent">
            {trackedName}
          </span>
        )}
        {!trackedItem && (
          <span className="text-[10px] text-text-tertiary">{t('sandbox.dataNoTarget')}</span>
        )}

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={toggleSampling}
            disabled={!trackedItem}
            className={cn(
              'flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors',
              sampling
                ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
                : 'border-accent bg-accent-soft text-accent hover:bg-accent hover:text-white',
              !trackedItem && 'cursor-not-allowed opacity-40'
            )}
          >
            {sampling ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {sampling ? t('sandbox.dataStop') : t('sandbox.dataSample')}
          </button>
          <button
            type="button"
            onClick={clearTelemetry}
            disabled={samples.length === 0}
            className={cn(
              'flex items-center gap-1 rounded-md border border-border bg-paper px-2 py-1 text-[11px] text-text-secondary hover:text-text-primary',
              samples.length === 0 && 'cursor-not-allowed opacity-40'
            )}
          >
            <Trash2 className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={samples.length === 0}
            className={cn(
              'flex items-center gap-1 rounded-md border border-border bg-paper px-2 py-1 text-[11px] text-text-secondary hover:text-text-primary',
              samples.length === 0 && 'cursor-not-allowed opacity-40'
            )}
            title={t('sandbox.dataExportCsv')}
          >
            <Download className="h-3 w-3" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="flex gap-3 p-3">
          {/* Live readings */}
          <div className="w-44 space-y-1.5">
            <Reading
              label={t('sandbox.dataPosition')}
              value={
                live
                  ? `(${live.pos[0].toFixed(2)}, ${live.pos[1].toFixed(2)}, ${live.pos[2].toFixed(2)})`
                  : '—'
              }
              unit="m"
            />
            <Reading
              label={t('sandbox.dataSpeed')}
              value={live ? live.speed.toFixed(2) : '—'}
              unit="m/s"
              accent
            />
            <Reading
              label={t('sandbox.dataAccel')}
              value={live ? live.accel.toFixed(2) : '—'}
              unit="m/s²"
            />
            <Reading label={t('sandbox.dataKE')} value={live ? live.ke.toFixed(2) : '—'} unit="J" />
            <Reading label={t('sandbox.dataPE')} value={live ? live.pe.toFixed(2) : '—'} unit="J" />
            <Reading
              label={t('sandbox.dataTotalE')}
              value={live ? (live.ke + live.pe).toFixed(2) : '—'}
              unit="J"
              accent
            />
          </div>

          {/* Chart */}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-text-secondary">
                  {t('sandbox.dataSpeedTimeChart')}
                </span>
                {isZoomed && (
                  <button
                    type="button"
                    onClick={handleResetView}
                    className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] text-accent hover:bg-accent hover:text-white"
                    title={t('sandbox.dataResetView')}
                  >
                    <ZoomOut className="inline h-2.5 w-2.5" /> {t('sandbox.dataResetView')}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditorConfig({
                      showVelocityVector: !editorConfig.showVelocityVector,
                    })
                  }
                  className={cn(
                    'flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors',
                    editorConfig.showVelocityVector
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-text-tertiary hover:text-text-primary'
                  )}
                  title={t('sandbox.showVelocityVector')}
                >
                  <Move3d className="h-2.5 w-2.5" />v
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEditorConfig({
                      showAccelerationVector: !editorConfig.showAccelerationVector,
                    })
                  }
                  className={cn(
                    'flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors',
                    editorConfig.showAccelerationVector
                      ? 'bg-red-100 text-red-600'
                      : 'text-text-tertiary hover:text-text-primary'
                  )}
                  title={t('sandbox.showAccelerationVector')}
                >
                  <Gauge className="h-2.5 w-2.5" />a
                </button>
              </div>
            </div>

            <div className="relative">
              <CanvasChart
                samples={samples}
                maxT={maxT}
                maxSpeed={maxSpeed}
                viewMin={viewMin}
                viewExtent={viewExtent}
                onViewChange={handleViewChange}
                onInteraction={handleInteraction}
                emptyText={t('sandbox.dataEmptyHint')}
              />
              <CrosshairCanvas
                hoverSample={hoverSample}
                hoverX={hoverX}
                hoverY={hoverY}
                maxSpeed={maxSpeed}
                viewMin={viewMin}
                viewMax={viewMax}
              />

              {/* Tooltip */}
              {hovering && hoverSample && (
                <div
                  className="pointer-events-none absolute z-10 -translate-x-1/2 rounded border border-border bg-paper px-2 py-1 shadow-md"
                  style={{
                    left: `${(hoverX / CHART_W) * 100}%`,
                    top: `${(hoverY / CHART_H) * 100}%`,
                    marginTop: '-2.5rem',
                  }}
                >
                  <div className="whitespace-nowrap text-[10px] leading-relaxed">
                    <span className="text-text-tertiary">t: </span>
                    <span className="font-mono text-text-primary">{hoverSample.t.toFixed(2)}s</span>
                    <span className="mx-1.5 text-border">|</span>
                    <span className="text-text-tertiary">v: </span>
                    <span className="font-mono font-semibold text-accent">
                      {hoverSample.speed.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-text-tertiary"> m/s</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(DataPanel)
