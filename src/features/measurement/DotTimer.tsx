import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, Zap } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { Slider } from '@/shared/ui/Slider'
import { useExperimentStore } from '@/features/panels/experimentStore'
import { cn } from '@/shared/utils/cn'

interface Dot {
  id: number
  t: number
}

export function DotTimer() {
  const visible = useExperimentStore((s) => s.tools.dotTimer)
  const toggleTool = useExperimentStore((s) => s.toggleTool)
  const isPaused = useExperimentStore((s) => s.isPaused)

  const [frequency, setFrequency] = useState(50)
  const [running, setRunning] = useState(false)
  const [dots, setDots] = useState<Dot[]>([])
  const lastTickRef = useRef<number | null>(null)
  const dotIdRef = useRef(0)

  useEffect(() => {
    if (!running || isPaused) {
      lastTickRef.current = null
      return
    }
    const intervalMs = 1000 / frequency
    const interval = setInterval(() => {
      const now = performance.now()
      if (lastTickRef.current === null) lastTickRef.current = now
      const t = (now - lastTickRef.current) / 1000
      setDots((prev) => {
        const next = [...prev, { id: dotIdRef.current++, t }]
        if (next.length > 200) next.splice(0, next.length - 200)
        return next
      })
    }, intervalMs)
    return () => clearInterval(interval)
  }, [running, isPaused, frequency])

  if (!visible) return null

  const stripWidth = 320
  const pxPerSecond = 40
  const stripDurationSec = stripWidth / pxPerSecond
  const latestT = dots.length > 0 ? dots[dots.length - 1].t : 0
  const windowStart = Math.max(0, latestT - stripDurationSec)
  const visibleDots = dots.filter((d) => d.t >= windowStart)
  const dotPositions = visibleDots.map((d) => ((d.t - windowStart) * pxPerSecond) % stripWidth)

  return (
    <div
      className={cn(
        'pointer-events-auto absolute left-3 bottom-3 z-10 w-80',
        'rounded-lg border border-border bg-paper/95 p-3 shadow-md backdrop-blur-sm'
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-accent" />
          <span className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            打点计时器
          </span>
        </div>
        <button
          type="button"
          onClick={() => toggleTool('dotTimer')}
          className="text-xs text-text-tertiary transition-colors hover:text-text-primary"
          aria-label="关闭打点计时器"
        >
          ✕
        </button>
      </div>

      <div className="mb-2">
        <Slider
          label="频率"
          value={[frequency]}
          min={10}
          max={100}
          step={5}
          onValueChange={(v) => setFrequency(v[0])}
          valueFormatter={(v) => `${v} Hz`}
        />
      </div>

      <div className="relative mb-2 h-12 overflow-hidden rounded border border-border bg-amber-50">
        <div className="absolute inset-0 flex items-center">
          <div className="relative h-full w-full">
            {dotPositions.map((x, idx) => (
              <div
                key={visibleDots[idx]?.id ?? idx}
                className="absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-text-primary"
                style={{ left: `${x}px` }}
              />
            ))}
            <div className="absolute inset-y-0 left-1/2 w-px bg-accent/30" />
          </div>
        </div>
        <div className="absolute right-1 top-0.5 text-[9px] text-text-tertiary">→</div>
      </div>

      <div className="mb-2 flex items-center justify-between text-xs text-text-tertiary">
        <span>已打点: {dots.length}</span>
        <span>
          {frequency} Hz · 间隔 {(1000 / frequency).toFixed(1)} ms
        </span>
      </div>

      <div className="flex justify-center gap-1.5">
        <Button
          size="sm"
          variant={running ? 'secondary' : 'primary'}
          onClick={() => setRunning((r) => !r)}
          disabled={!running && isPaused}
          leftIcon={running ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        >
          {running ? '停止' : '开始'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setRunning(false)
            setDots([])
            dotIdRef.current = 0
          }}
          leftIcon={<RotateCcw className="h-3 w-3" />}
        >
          清空
        </Button>
      </div>
    </div>
  )
}
