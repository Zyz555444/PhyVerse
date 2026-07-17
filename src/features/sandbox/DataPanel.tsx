import { useMemo, useState } from 'react'
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
} from 'lucide-react'
import { useI18n } from '@/shared/hooks/useI18n'
import { cn } from '@/shared/utils/cn'
import { useSandboxStore, type TelemetrySample } from './sandboxStore'
import { getFriendlyName } from './friendlyName'
import { exportTelemetryCsv } from './sceneStorage'

const CHART_W = 320
const CHART_H = 110
const PAD_L = 36
const PAD_R = 8
const PAD_T = 8
const PAD_B = 18

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

function buildPolyline(samples: TelemetrySample[], maxT: number, maxSpeed: number): string {
  if (samples.length < 2) return ''
  const plotW = CHART_W - PAD_L - PAD_R
  const plotH = CHART_H - PAD_T - PAD_B
  const denomT = Math.max(maxT, 0.001)
  const denomV = Math.max(maxSpeed, 0.001)
  return samples
    .map((s) => {
      const x = PAD_L + (s.t / denomT) * plotW
      const y = PAD_T + plotH - (s.speed / denomV) * plotH
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
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
  const points = useMemo(() => buildPolyline(samples, maxT, maxSpeed), [samples, maxT, maxSpeed])

  const handleExportCsv = () => {
    if (samples.length === 0) return
    const label = trackedItem ? getFriendlyName(items, trackedItem.id) : 'telemetry'
    exportTelemetryCsv(samples, label)
  }

  const trackedName = trackedItem
    ? (trackedItem.displayName ?? getFriendlyName(items, trackedItem.id))
    : null

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
              <span className="text-[10px] font-medium text-text-secondary">
                {t('sandbox.dataSpeedTimeChart')}
              </span>
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
            <svg
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              className="h-28 w-full"
              preserveAspectRatio="none"
            >
              {/* Grid lines */}
              <line
                x1={PAD_L}
                y1={PAD_T}
                x2={PAD_L}
                y2={CHART_H - PAD_B}
                stroke="currentColor"
                className="text-border"
                strokeWidth={1}
              />
              <line
                x1={PAD_L}
                y1={CHART_H - PAD_B}
                x2={CHART_W - PAD_R}
                y2={CHART_H - PAD_B}
                stroke="currentColor"
                className="text-border"
                strokeWidth={1}
              />
              {/* Mid grid */}
              <line
                x1={PAD_L}
                y1={PAD_T + (CHART_H - PAD_T - PAD_B) / 2}
                x2={CHART_W - PAD_R}
                y2={PAD_T + (CHART_H - PAD_T - PAD_B) / 2}
                stroke="currentColor"
                className="text-border"
                strokeWidth={0.5}
                strokeDasharray="2 2"
              />

              {/* Axis labels */}
              <text
                x={PAD_L - 4}
                y={PAD_T + 4}
                textAnchor="end"
                className="fill-text-tertiary"
                fontSize={8}
              >
                {maxSpeed.toFixed(1)}
              </text>
              <text
                x={PAD_L - 4}
                y={CHART_H - PAD_B}
                textAnchor="end"
                className="fill-text-tertiary"
                fontSize={8}
              >
                0
              </text>
              <text
                x={CHART_W - PAD_R}
                y={CHART_H - 4}
                textAnchor="end"
                className="fill-text-tertiary"
                fontSize={8}
              >
                {maxT.toFixed(1)}s
              </text>

              {/* Polyline */}
              {points && (
                <polyline
                  points={points}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}

              {/* Current point marker */}
              {samples.length > 0 &&
                points &&
                (() => {
                  const last = samples[samples.length - 1]
                  const plotW = CHART_W - PAD_L - PAD_R
                  const plotH = CHART_H - PAD_T - PAD_B
                  const x = PAD_L + (last.t / Math.max(maxT, 0.001)) * plotW
                  const y = PAD_T + plotH - (last.speed / Math.max(maxSpeed, 0.001)) * plotH
                  return <circle cx={x} cy={y} r={2} fill="#3b82f6" />
                })()}

              {!points && (
                <text
                  x={CHART_W / 2}
                  y={CHART_H / 2}
                  textAnchor="middle"
                  className="fill-text-tertiary"
                  fontSize={10}
                >
                  {t('sandbox.dataEmptyHint')}
                </text>
              )}
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}
