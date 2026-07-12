import { Circle, Square, Download } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { useExperimentStore } from '@/features/panels/experimentStore'
import { cn } from '@/shared/utils/cn'

export function PlaybackControls() {
  const isRecording = useExperimentStore((s) => s.isRecording)
  const duration = useExperimentStore((s) => s.recordingDuration)
  const startRecording = useExperimentStore((s) => s.startRecording)
  const stopRecording = useExperimentStore((s) => s.stopRecording)
  const isPaused = useExperimentStore((s) => s.isPaused)

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 10)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`
  }

  return (
    <div
      className={cn(
        'pointer-events-auto absolute right-3 bottom-3 z-10',
        'rounded-lg border border-border bg-paper/95 p-2 shadow-md backdrop-blur-sm'
      )}
    >
      <div className="flex items-center gap-2">
        {isRecording ? (
          <>
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-danger" />
              </span>
              <span className="font-mono text-xs tabular-nums text-text-primary">
                {formatDuration(duration)}
              </span>
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={stopRecording}
              leftIcon={<Square className="h-3 w-3 fill-current" />}
            >
              停止
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="primary"
              onClick={startRecording}
              disabled={isPaused}
              leftIcon={<Circle className="h-3 w-3 fill-danger text-danger" />}
            >
              录制
            </Button>
            {duration > 0 && (
              <span className="text-xs text-text-tertiary">已录制 {formatDuration(duration)}</span>
            )}
            <Button
              size="sm"
              variant="ghost"
              disabled
              leftIcon={<Download className="h-3 w-3" />}
              title="导出功能即将推出"
            >
              导出
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
