import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useShallow } from 'zustand/shallow'
import { usePhysics } from '@/features/physics/usePhysics'
import {
  useSandboxStore,
  type RecordedFrame,
  type RecordedBodyState,
} from '@/features/sandbox/sandboxStore'

/**
 * Invisible component that captures the full scene state at a configurable
 * frame rate and pushes it into the recording store. Default FPS reduced from 30 to 24.
 */
export function RecorderSampler({ isRunning }: { isRunning: boolean }) {
  const { world } = usePhysics()
  const { isRecording, isPlaying, recordingFps, timeScale, items } = useSandboxStore(
    useShallow((s) => ({
      isRecording: s.recording.isRecording,
      isPlaying: s.recording.isPlaying,
      recordingFps: s.recording.fps,
      timeScale: s.editorConfig.timeScale,
      items: s.items,
    }))
  )
  const pushRecordedFrame = useSandboxStore((s) => s.pushRecordedFrame)

  const accumRef = useRef(0)
  const frameTimeRef = useRef(0)

  // Use resolved FPS with default fallback
  const fps = recordingFps || 24

  // Reset accumulators when recording starts/stops
  useEffect(() => {
    accumRef.current = 0
    frameTimeRef.current = 0
  }, [isRecording])

  useFrame((_, delta) => {
    if (!isRunning || !isRecording || !world?.isReady) return
    if (isPlaying) return

    const scaledDelta = delta * timeScale
    frameTimeRef.current += scaledDelta

    const interval = 1 / fps
    accumRef.current += scaledDelta

    if (accumRef.current >= interval) {
      accumRef.current -= interval

      const bodies: Record<string, RecordedBodyState> = {}
      for (const item of items) {
        const record = world.getBody(item.id)
        if (!record) continue
        const rb = record.rigidBody
        const pos = rb.translation()
        const rot = rb.rotation()
        const vel = rb.linvel()
        bodies[item.id] = {
          position: [pos.x, pos.y, pos.z],
          rotation: [rot.x, rot.y, rot.z, rot.w],
          velocity: [vel.x, vel.y, vel.z],
        }
      }

      const frame: RecordedFrame = {
        time: frameTimeRef.current,
        bodies,
      }

      pushRecordedFrame(frame)
    }
  })

  return null
}
