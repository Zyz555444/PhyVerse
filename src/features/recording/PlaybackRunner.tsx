import { useState, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSandboxStore } from '@/features/sandbox/sandboxStore'

export function PlaybackRunner() {
  const isPlaying = useSandboxStore((s) => s.recording.isPlaying)
  const frames = useSandboxStore((s) => s.recording.frames)
  const playbackSpeed = useSandboxStore((s) => s.recording.playbackSpeed)
  const setPlaybackFrame = useSandboxStore((s) => s.setPlaybackFrame)
  const stopPlayback = useSandboxStore((s) => s.stopPlayback)

  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const accumRef = useRef(0)
  const localIndexRef = useRef(0)
  const wasPlayingRef = useRef(false)

  useFrame((_, delta) => {
    // Reset when playback just ended
    if (!isPlaying && wasPlayingRef.current) {
      localIndexRef.current = 0
      accumRef.current = 0
      setCurrentFrameIndex(0)
    }
    wasPlayingRef.current = isPlaying

    if (!isPlaying || frames.length === 0) return

    accumRef.current += delta * playbackSpeed
    const frameInterval = 1 / 30

    while (accumRef.current >= frameInterval && localIndexRef.current < frames.length) {
      accumRef.current -= frameInterval
      localIndexRef.current++
      setCurrentFrameIndex(localIndexRef.current)
      setPlaybackFrame(localIndexRef.current)
    }

    if (localIndexRef.current >= frames.length) {
      stopPlayback()
    }
  })

  if (!isPlaying || frames.length === 0) return null

  const idx = Math.min(currentFrameIndex, frames.length - 1)
  const currentFrame = frames[idx]
  if (!currentFrame) return null

  const bodyIds = Object.keys(currentFrame.bodies)

  return (
    <group>
      {bodyIds.map((id) => {
        const body = currentFrame.bodies[id]
        const [px, py, pz] = body.position
        return (
          <group key={id}>
            <mesh position={[px, py, pz]}>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshBasicMaterial color="#ff6b6b" transparent opacity={0.5} depthTest={false} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
