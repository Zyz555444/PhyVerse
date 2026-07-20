import { useRef, useEffect, useCallback } from 'react'
import type { TelemetrySample } from './sandboxStore'

const CHART_W = 320
const CHART_H = 110
const PAD_L = 36
const PAD_R = 8
const PAD_T = 8
const PAD_B = 18

const COLORS = {
  bg: '#fafafa',
  grid: '#e0e0e0',
  axis: '#999999',
  line: '#3b82f6',
  crosshair: '#999999',
  dot: '#3b82f6',
  dotFill: '#ffffff',
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
  const idx =
    lo === 0
      ? 0
      : Math.abs(samples[lo].t - targetT) < Math.abs(samples[lo - 1].t - targetT)
        ? lo
        : lo - 1
  return samples[Math.min(idx, samples.length - 1)]
}

function timeToX(t: number, viewMin: number, viewMax: number, plotW: number): number {
  const denom = Math.max(viewMax - viewMin, 0.001)
  return PAD_L + ((t - viewMin) / denom) * plotW
}

function speedToY(v: number, maxSpeed: number, plotH: number): number {
  const denom = Math.max(maxSpeed, 0.001)
  return PAD_T + plotH - (v / denom) * plotH
}

function screenToTime(
  screenX: number,
  viewMin: number,
  viewMax: number,
  plotW: number
): number {
  const denom = Math.max(viewMax - viewMin, 0.001)
  return viewMin + ((screenX - PAD_L) / plotW) * denom
}

export interface CanvasChartInteraction {
  hoverSample: TelemetrySample | null
  /** Chart-space x coordinate of hover (for tooltip positioning) */
  hoverX: number
  /** Chart-space y coordinate of hover */
  hoverY: number
}

export interface CanvasChartProps {
  samples: TelemetrySample[]
  maxT: number
  maxSpeed: number
  viewMin: number
  viewExtent: number
  onViewChange: (viewMin: number, viewExtent: number) => void
  onInteraction: (interaction: CanvasChartInteraction) => void
  emptyText: string
}

export function CanvasChart({
  samples,
  maxT,
  maxSpeed,
  viewMin,
  viewExtent,
  onViewChange,
  onInteraction,
  emptyText,
}: CanvasChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x: number; viewMin: number } | null>(null)

  const viewMax =
    viewExtent > 0 ? Math.min(viewMin + viewExtent, maxT) : maxT
  const plotW = CHART_W - PAD_L - PAD_R
  const plotH = CHART_H - PAD_T - PAD_B

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    const width = CHART_W
    const height = CHART_H
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)

    // Background
    ctx.fillStyle = COLORS.bg
    ctx.fillRect(PAD_L, PAD_T, plotW, plotH)

    // Grid lines
    ctx.strokeStyle = COLORS.grid
    ctx.lineWidth = 0.5

    // Y axis
    ctx.beginPath()
    ctx.moveTo(PAD_L, PAD_T)
    ctx.lineTo(PAD_L, CHART_H - PAD_B)
    ctx.strokeStyle = COLORS.axis
    ctx.lineWidth = 1
    ctx.stroke()

    // X axis
    ctx.beginPath()
    ctx.moveTo(PAD_L, CHART_H - PAD_B)
    ctx.lineTo(CHART_W - PAD_R, CHART_H - PAD_B)
    ctx.stroke()

    // Mid horizontal grid
    ctx.beginPath()
    ctx.moveTo(PAD_L, PAD_T + plotH / 2)
    ctx.lineTo(CHART_W - PAD_R, PAD_T + plotH / 2)
    ctx.setLineDash([2, 3])
    ctx.strokeStyle = COLORS.grid
    ctx.lineWidth = 0.5
    ctx.stroke()
    ctx.setLineDash([])

    // Vertical grid ticks (every 25%)
    for (let i = 0; i <= 4; i++) {
      const x = PAD_L + (plotW * i) / 4
      ctx.beginPath()
      ctx.moveTo(x, PAD_T)
      ctx.lineTo(x, CHART_H - PAD_B)
      ctx.setLineDash([1, 4])
      ctx.strokeStyle = COLORS.grid
      ctx.lineWidth = 0.3
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Axis labels
    ctx.fillStyle = COLORS.axis
    ctx.font = '8px sans-serif'
    ctx.textAlign = 'end'
    ctx.fillText(maxSpeed.toFixed(1), PAD_L - 4, PAD_T + 4)
    ctx.fillText('0', PAD_L - 4, CHART_H - PAD_B - 2)
    ctx.textAlign = 'start'
    ctx.fillText(`${maxT.toFixed(1)}s`, CHART_W - PAD_R + 2, CHART_H - 4)

    // Empty state
    if (samples.length < 2) {
      ctx.textAlign = 'center'
      ctx.fillText(emptyText, CHART_W / 2, CHART_H / 2)
      return
    }

    // Data polyline
    ctx.beginPath()
    let firstDrawn = false
    for (const s of samples) {
      if (viewExtent > 0 && (s.t < viewMin || s.t > viewMax)) continue
      const x = timeToX(s.t, viewMin, viewMax, plotW)
      const y = speedToY(s.speed, maxSpeed, plotH)
      if (!firstDrawn) {
        ctx.moveTo(x, y)
        firstDrawn = true
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.strokeStyle = COLORS.line
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.stroke()
  }, [samples, maxT, maxSpeed, viewMin, viewMax, viewExtent, emptyText, plotW, plotH])

  const getCanvasCoords = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      const scaleX = CHART_W / rect.width
      const scaleY = CHART_H / rect.height
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      }
    },
    []
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (samples.length < 2) return
      const coords = getCanvasCoords(e.clientX, e.clientY)
      const t = screenToTime(coords.x, viewMin, viewMax, plotW)
      const clampedX = Math.max(PAD_L, Math.min(PAD_L + plotW, coords.x))
      const clampedY = Math.max(PAD_T, Math.min(PAD_T + plotH, coords.y))

      const sample = findClosestSample(samples, t)
      onInteraction({
        hoverSample: sample,
        hoverX: clampedX,
        hoverY: clampedY,
      })

      // Handle drag pan
      const drag = dragRef.current
      if (!drag || viewExtent <= 0) return
      const dx = drag.x - e.clientX
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const scaleX = CHART_W / rect.width
      const timePerPixel = viewExtent / plotW
      const newMin = drag.viewMin + dx * scaleX * timePerPixel
      onViewChange(Math.max(0, Math.min(newMin, maxT - viewExtent)), viewExtent)
    },
    [
      samples,
      viewMin,
      viewMax,
      viewExtent,
      maxT,
      plotW,
      plotH,
      getCanvasCoords,
      onInteraction,
      onViewChange,
    ]
  )

  const handleMouseLeave = useCallback(() => {
    dragRef.current = null
    onInteraction({ hoverSample: null, hoverX: 0, hoverY: 0 })
  }, [onInteraction])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (viewExtent <= 0) return
      dragRef.current = { x: e.clientX, viewMin }
    },
    [viewMin, viewExtent]
  )

  const handleMouseUp = useCallback(() => {
    dragRef.current = null
  }, [])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      if (maxT <= 0) return

      const coords = getCanvasCoords(e.clientX, e.clientY)
      const cursorT = screenToTime(coords.x, viewMin, viewMax, plotW)
      const currentExtent = viewExtent > 0 ? viewExtent : maxT

      const zoomFactor = e.deltaY < 0 ? 0.85 : 1.18
      let newExtent = currentExtent * zoomFactor
      newExtent = Math.max(0.5, Math.min(newExtent, maxT))

      const cursorRatio = currentExtent > 0 ? (cursorT - viewMin) / currentExtent : 0
      let newMin = cursorT - cursorRatio * newExtent
      newMin = Math.max(0, Math.min(newMin, maxT - newExtent))

      onViewChange(newMin, newExtent < maxT * 0.99 ? newExtent : 0)
    },
    [maxT, viewMin, viewMax, viewExtent, plotW, getCanvasCoords, onViewChange]
  )

  return (
    <div ref={containerRef} className="relative">
      <canvas
        ref={canvasRef}
        className="h-28 w-full cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  )
}

/** Draw crosshair overlay on a secondary canvas (avoids full redraw on hover) */
export function CrosshairCanvas({
  hoverSample,
  hoverX,
  hoverY,
  maxSpeed,
  viewMin,
  viewMax,
}: {
  hoverSample: TelemetrySample | null
  hoverX: number
  hoverY: number
  maxSpeed: number
  viewMin: number
  viewMax: number
}) {
  const crosshairRef = useRef<HTMLCanvasElement>(null)
  const plotW = CHART_W - PAD_L - PAD_R
  const plotH = CHART_H - PAD_T - PAD_B

  useEffect(() => {
    const canvas = crosshairRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = CHART_W * dpr
    canvas.height = CHART_H * dpr
    canvas.style.width = `${CHART_W}px`
    canvas.style.height = `${CHART_H}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, CHART_W, CHART_H)

    if (!hoverSample) return

    // Crosshair lines
    ctx.strokeStyle = COLORS.crosshair
    ctx.lineWidth = 0.5
    ctx.setLineDash([3, 3])

    ctx.beginPath()
    ctx.moveTo(hoverX, PAD_T)
    ctx.lineTo(hoverX, CHART_H - PAD_B)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(PAD_L, hoverY)
    ctx.lineTo(CHART_W - PAD_R, hoverY)
    ctx.stroke()
    ctx.setLineDash([])

    // Dot on line
    const dx = timeToX(hoverSample.t, viewMin, viewMax, plotW)
    const dy = speedToY(hoverSample.speed, maxSpeed, plotH)

    ctx.beginPath()
    ctx.arc(dx, dy, 3, 0, Math.PI * 2)
    ctx.fillStyle = COLORS.dotFill
    ctx.fill()
    ctx.strokeStyle = COLORS.dot
    ctx.lineWidth = 1.5
    ctx.stroke()
  }, [hoverSample, hoverX, hoverY, maxSpeed, viewMin, viewMax, plotW, plotH])

  return (
    <canvas
      ref={crosshairRef}
      className="pointer-events-none absolute inset-0"
      style={{ width: '100%', height: '100%' }}
    />
  )
}
