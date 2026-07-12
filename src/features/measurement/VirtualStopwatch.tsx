import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, Timer } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { useExperimentStore } from '@/features/panels/experimentStore'
import { cn } from '@/shared/utils/cn'

export function VirtualStopwatch() {
  const visible = useExperimentStore((s) => s.tools.stopwatch)
  const toggleTool = useExperimentStore((s) => s.toggleTool)
  const isPaused = useExperimentStore((s) => s.isPaused)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [running, setRunning] = useState(false)
  const lastTickRef = useRef<number | null>(null)

  useEffect(() => {
    if (!running) {
      lastTickRef.current = null
      return
    }
    let raf = 0
    const tick = (now: number) => {
      if (lastTickRef.current === null) {
        lastTickRef.current = now
      }
      const delta = now - lastTickRef.current
      lastTickRef.current = now
      setElapsedMs((prev) => prev + delta)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running])

  if (!visible) return null

  const formatTime = (ms: number) => {
    const totalSeconds = ms / 1000
    const seconds = Math.floor(totalSeconds)
    const decimals = Math.floor((totalSeconds - seconds) * 1000)
      .toString()
      .padStart(3, '0')
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = (seconds % 60).toString().padStart(2, '0')
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds}.${decimals}`
  }

  return (
    <div
      className={cn(
        'pointer-events-auto absolute left-3 top-3 z-10 w-56',
        'rounded-lg border border-border bg-paper/95 p-3 shadow-md backdrop-blur-sm'
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Timer className="h-3.5 w-3.5 text-accent" />
          <span className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            秒表
          </span>
        </div>
        <button
          type="button"
          onClick={() => toggleTool('stopwatch')}
          className="text-xs text-text-tertiary transition-colors hover:text-text-primary"
          aria-label="关闭秒表"
        >
          ✕
        </button>
      </div>

      <div className="mb-3 text-center font-mono text-2xl tabular-nums text-text-primary">
        {formatTime(elapsedMs)}
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
            setElapsedMs(0)
          }}
          leftIcon={<RotateCcw className="h-3 w-3" />}
        >
          重置
        </Button>
      </div>

      {!running && isPaused && (
        <p className="mt-2 text-center text-[10px] text-text-tertiary">
          实验已暂停，请先运行实验再启动秒表
        </p>
      )}
    </div>
  )
}
