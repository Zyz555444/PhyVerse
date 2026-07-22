import { useEffect, useRef } from 'react'
import { Circle, Square, Download, Play, Pause, Trash2, FileJson } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useSandboxStore } from '@/features/sandbox/sandboxStore'
import { useI18n } from '@/shared/hooks/useI18n'
import { cn } from '@/shared/utils/cn'
import { exportRecordingAsWebM, exportRecordingAsJSON } from './RecordingExporter'

const MAX_RECORDING_DURATION = 30 // seconds

export function RecorderControls() {
  const { t } = useI18n()
  const { isRecording, isPlaying, frames, recording } = useSandboxStore(
    useShallow((s) => ({
      isRecording: s.recording.isRecording,
      isPlaying: s.recording.isPlaying,
      frames: s.recording.frames,
      recording: s.recording,
    }))
  )
  const startRecording = useSandboxStore((s) => s.startRecording)
  const stopRecording = useSandboxStore((s) => s.stopRecording)
  const startPlayback = useSandboxStore((s) => s.startPlayback)
  const stopPlayback = useSandboxStore((s) => s.stopPlayback)
  const clearRecording = useSandboxStore((s) => s.clearRecording)

  const duration = frames.length > 0 ? frames[frames.length - 1].time : 0
  const limitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-stop recording when duration limit is reached
  useEffect(() => {
    if (!isRecording) {
      if (limitTimerRef.current) {
        clearTimeout(limitTimerRef.current)
        limitTimerRef.current = null
      }
      return
    }

    limitTimerRef.current = setTimeout(() => {
      stopRecording()
    }, MAX_RECORDING_DURATION * 1000)

    return () => {
      if (limitTimerRef.current) {
        clearTimeout(limitTimerRef.current)
      }
    }
  }, [isRecording, stopRecording])

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 10)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`
  }

  const handleExportWebM = () => {
    exportRecordingAsWebM(recording)
  }

  const handleExportJSON = () => {
    exportRecordingAsJSON(recording)
  }

  return (
    <div
      className={cn(
        'pointer-events-auto absolute right-3 bottom-3 z-10',
        'rounded-lg border border-border bg-paper/95 p-2 shadow-md backdrop-blur-sm'
      )}
    >
      <div className="flex items-center gap-2">
        {isPlaying ? (
          <>
            <span className="text-xs font-mono tabular-nums text-text-primary">
              {formatDuration(duration)}
            </span>
            <button
              type="button"
              onClick={stopPlayback}
              className="flex items-center gap-1 rounded-lg border border-border bg-paper px-2 py-1 text-xs font-medium text-text-primary hover:border-border-strong"
            >
              <Pause className="h-3 w-3" />
              {t('sandbox.recording.stopPlayback')}
            </button>
          </>
        ) : isRecording ? (
          <>
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-danger" />
              </span>
              <span className="text-xs font-mono tabular-nums text-text-primary">
                {formatDuration(duration)}
              </span>
            </span>
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-1 rounded-lg border border-border bg-paper px-2 py-1 text-xs font-medium text-text-primary hover:border-border-strong"
            >
              <Square className="h-3 w-3 fill-current" />
              {t('sandbox.recording.stop')}
            </button>
          </>
        ) : frames.length > 0 ? (
          <>
            <button
              type="button"
              onClick={startPlayback}
              className="flex items-center gap-1 rounded-lg border border-accent bg-accent-soft px-2 py-1 text-xs font-medium text-accent hover:bg-accent hover:text-white"
            >
              <Play className="h-3 w-3" />
              {t('sandbox.recording.playback')}
            </button>
            <button
              type="button"
              onClick={clearRecording}
              title={t('sandbox.recording.clear')}
              className="flex items-center justify-center h-7 w-7 rounded-lg border border-border bg-paper text-text-secondary hover:border-border-strong hover:text-text-primary"
            >
              <Trash2 className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={handleExportWebM}
              className="flex items-center gap-1 rounded-lg border border-border bg-paper px-2 py-1 text-xs font-medium text-text-secondary hover:border-border-strong hover:text-text-primary"
            >
              <Download className="h-3 w-3" />
              {t('sandbox.recording.export')}
            </button>
            <button
              type="button"
              onClick={handleExportJSON}
              title={t('sandbox.recording.exportJson')}
              className="flex items-center justify-center h-7 w-7 rounded-lg border border-border bg-paper text-text-secondary hover:border-border-strong hover:text-text-primary"
            >
              <FileJson className="h-3 w-3" />
            </button>
            <span className="text-xs text-text-tertiary">
              {formatDuration(duration)} · {t('sandbox.recording.frames', { count: frames.length })}
            </span>
          </>
        ) : (
          <button
            type="button"
            onClick={() => startRecording()}
            className="flex items-center gap-1 rounded-lg border border-accent bg-accent px-2 py-1 text-xs font-medium text-white hover:bg-accent-hover"
          >
            <Circle className="h-3 w-3 fill-danger text-danger" />
            {t('sandbox.recording.start')}
          </button>
        )}
      </div>
    </div>
  )
}
