import { useMemo, useState, useRef, useCallback } from 'react'
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

function findClosestSample(
  samples: TelemetrySample[],
  targetT: number
): TelemetrySample | null {
  if (samples.length === 0) return null
  let lo = 0
  let hi = samples.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (samples[mid].t < targetT) {
      lo = mid + 1
    } else {
      hi = mid
    }
  }
  const idx = lo === 0 ? 0 : Math.abs(samples[lo].t - targetT) < Math.abs(samples[lo - 1].t - targetT) ? lo : lo - 1
  return samples[Math.min(idx, samples.length - 1)]
}

function buildPolyline(
  samples: TelemetrySample[],
  viewMin: number,
  viewMax: number,
  maxSpeed: number
): string {
  if (samples.length < 2) return ''
  const plotW = CHART_W - PAD_L - PAD_R
  const plotH = CHART_H - PAD_T - PAD_B
  const denomT = Math.max(viewMax - viewMin, 0.001)
  const denomV = Math.max(maxSpeed, 0.001)
  return samples
    .map((s) => {
      const x = PAD_L + ((s.t - viewMin) / denomT) * plotW
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
  const [viewMin, setViewMin] = useState(0)
  const [viewExtent, setViewExtent] = useState(0)
  const [hovering, setHovering] = useState(false)
  const [hoverSample, setHoverSample] = useState<TelemetrySample | null>(null)
  const [hoverX, setHoverX] = useState(0)
  const [hoverY, setHoverY] = useState(0)
  const [dragStart, setDragStart] = useState<{ x: number; viewMin: number } | null>(null)

  const svgRef = useRef<SVGSVGElement>(null)

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

  // When maxT changes (new data), auto-scroll to show latest unless user has panned
  const prevMaxT = useRef(0)
  if (maxT !== prevMaxT.current && !dragStart && viewExtent === 0) {
    prevMaxT.current = maxT
    setViewMin(0)
  } else {
    prevMaxT.current = maxT
  }

  const visibleSamples = useMemo(() => {
    if (viewExtent === 0) return samples
    return samples.filter((s) => s.t >= viewMin && s.t <= viewMax)
  }, [samples, viewMin, viewMax, viewExtent])

  const points = useMemo(
    () => buildPolyline(samples, viewMin, viewMax, maxSpeed),
    [samples, viewMin, viewMax, maxSpeed]
  )

  const handleExportCsv = () => {
    if (samples.length === 0) return
    const label = trackedItem ? getFriendlyName(items, trackedItem.id) : 'telemetry'
    exportTelemetryCsv(samples, label)
  }

  const trackedName = trackedItem
    ? (trackedItem.displayName ?? getFriendlyName(items, trackedItem.id))
    : null

  // Chart interaction helpers
  const getChartCoords = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current
      if (!svg) return { x: 0, y: 0 }
      const rect = svg.getBoundingClientRect()
      const scaleX = CHART_W / rect.width
      const scaleY = CHART_H / rect.height
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      }
    },
    []
  )

  const screenToTime = useCallback(
    (x: number) => {
      const plotW = CHART_W - PAD_L - PAD_R
      const denomT = Math.max(viewMax - viewMin, 0.001)
      return viewMin + ((x - PAD_L) / plotW) * denomT
    },
    [viewMin, viewMax]
  )

  const timeToScreen = useCallback(
    (t: number) => {
      const plotW = CHART_W - PAD_L - PAD_R
      const denomT = Math.max(viewMax - viewMin, 0.001)
      return PAD_L + ((t - viewMin) / denomT) * plotW
    },
    [viewMin, viewMax]
  )

  const speedToScreen = useCallback(
    (v: number) => {
      const plotH = CHART_H - PAD_T - PAD_B
      const denomV = Math.max(maxSpeed, 0.001)
      return PAD_T + plotH - (v / denomV) * plotH
    },
    [maxSpeed]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!samples.length) return
      const coords = getChartCoords(e.clientX, e.clientY)
      const t = screenToTime(coords.x)

      // Clamp to plot area
      const plotW = CHART_W - PAD_L - PAD_R
      const plotH = CHART_H - PAD_T - PAD_B
      const clampedX = Math.max(PAD_L, Math.min(PAD_L + plotW, coords.x))
      const clampedY = Math.max(PAD_T, Math.min(PAD_T + plotH, coords.y))

      const sample = findClosestSample(samples, t)

      setHovering(true)
      setHoverX(clampedX)
      setHoverY(clampedY)
      setHoverSample(sample)
    },
    [samples, getChartCoords, screenToTime]
  )

  const handleMouseLeave = useCallback(() => {
    setHovering(false)
    setHoverSample(null)
    setDragStart(null)
  }, [])

  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault()
      if (maxT <= 0) return

      const coords = getChartCoords(e.clientX, e.clientY)
      const cursorT = screenToTime(coords.x)
      const currentExtent = viewExtent > 0 ? viewExtent : maxT

      const zoomFactor = e.deltaY < 0 ? 0.85 : 1.18
      let newExtent = currentExtent * zoomFactor

      // Clamp: minimum 0.5s view, maximum full range
      newExtent = Math.max(0.5, Math.min(newExtent, maxT))

      // Keep the cursor position fixed during zoom
      const cursorRatio = currentExtent > 0 ? (cursorT - viewMin) / currentExtent : 0
      let newMin = cursorT - cursorRatio * newExtent

      // Clamp viewMin
      newMin = Math.max(0, Math.min(newMin, maxT - newExtent))

      setViewMin(newMin)
      setViewExtent(newExtent < maxT * 0.99 ? newExtent : 0)
    },
    [maxT, viewMin, viewExtent, getChartCoords, screenToTime]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (viewExtent === 0) return // No pan needed at full view
      setDragStart({ x: e.clientX, viewMin })
    },
    [viewMin, viewExtent]
  )

  const handleMouseUp = useCallback(() => {
    setDragStart(null)
  }, [])

  const handleMouseMoveForDrag = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      handleMouseMove(e)
      if (!dragStart || viewExtent === 0) return
      const dx = dragStart.x - e.clientX
      const currentExtent = viewExtent > 0 ? viewExtent : maxT
      const rect = svgRef.current?.getBoundingClientRect()
      if (!rect) return
      const scaleX = CHART_W / rect.width
      const plotW = CHART_W - PAD_L - PAD_R
      const timePerPixel = currentExtent / plotW
      const newMin = dragStart.viewMin + dx * scaleX * timePerPixel
      setViewMin(Math.max(0, Math.min(newMin, maxT - currentExtent)))
    },
    [dragStart, viewExtent, maxT, handleMouseMove]
  )

  const handleResetView = () => {
    setViewMin(0)
    setViewExtent(0)
  }

  const isZoomed = viewExtent > 0

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
              <svg
                ref={svgRef}
                viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                className="h-28 w-full cursor-crosshair"
                preserveAspectRatio="none"
                onMouseMove={dragStart ? handleMouseMoveForDrag : handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
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

                {/* Crosshair tooltip */}
                {hovering && points && (
                  <>
                    {/* Vertical line */}
                    <line
                      x1={hoverX}
                      y1={PAD_T}
                      x2={hoverX}
                      y2={CHART_H - PAD_B}
                      stroke="currentColor"
                      className="text-text-tertiary"
                      strokeWidth={0.5}
                      strokeDasharray="3 3"
                    />
                    {/* Horizontal line */}
                    <line
                      x1={PAD_L}
                      y1={hoverY}
                      x2={CHART_W - PAD_R}
                      y2={hoverY}
                      stroke="currentColor"
                      className="text-text-tertiary"
                      strokeWidth={0.5}
                      strokeDasharray="3 3"
                    />
                    {/* Hover dot on the line at current x */}
                    {hoverSample && (() => {
                      const dx = timeToScreen(hoverSample.t)
                      const dy = speedToScreen(hoverSample.speed)
                      return (
                        <circle
                          cx={dx}
                          cy={dy}
                          r={3}
                          fill="white"
                          stroke="#3b82f6"
                          strokeWidth={1.5}
                        />
                      )
                    })()}
                  </>
                )}

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

              {/* Tooltip */}
              {hovering && hoverSample && (
                <div
                  className="pointer-events-none absolute z-10 -translate-x-1/2 rounded border border-border bg-paper px-2 py-1 shadow-md"
                  style={{
                    left: `${(hoverX / CHART_W) * 100}%`,
                    top: `${((hoverY) / CHART_H) * 100}%`,
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
