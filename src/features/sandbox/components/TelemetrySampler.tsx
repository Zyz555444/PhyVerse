import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSandboxStore, type TelemetrySample } from '../sandboxStore'
import { usePhysics } from '@/features/physics/usePhysics'

/**
 * Samples physics state of the tracked body each frame and feeds it into the
 * telemetry store. Live readings update ~10Hz; historical samples flush ~30Hz.
 */
export function TelemetrySampler({ isRunning }: { isRunning: boolean }) {
  const { world } = usePhysics()
  const trackedId = useSandboxStore((s) => s.telemetry.trackedId)
  const sampling = useSandboxStore((s) => s.telemetry.sampling)
  const gravity = useSandboxStore((s) => s.gravity)
  const items = useSandboxStore((s) => s.items)
  const timeScale = useSandboxStore((s) => s.editorConfig.timeScale)
  const pushSamples = useSandboxStore((s) => s.pushTelemetrySamples)
  const setLive = useSandboxStore((s) => s.setLiveReading)

  const sampleBufferRef = useRef<TelemetrySample[]>([])
  const liveAccumRef = useRef(0)
  const pushAccumRef = useRef(0)
  const simTimeRef = useRef(0)
  const prevVelRef = useRef(new THREE.Vector3())
  const hasPrevRef = useRef(false)
  const lastTrackedRef = useRef<string | null>(null)

  // Reset local timing state when sampling toggles or tracked target changes.
  useEffect(() => {
    simTimeRef.current = 0
    hasPrevRef.current = false
    sampleBufferRef.current = []
    pushAccumRef.current = 0
  }, [sampling, trackedId])

  useFrame((_, delta) => {
    if (!isRunning || !world?.isReady || !trackedId) return
    const record = world.getBody(trackedId)
    if (!record) return
    const item = items.find((it) => it.id === trackedId)
    if (!item) return

    if (lastTrackedRef.current !== trackedId) {
      hasPrevRef.current = false
      lastTrackedRef.current = trackedId
    }

    const scaledDelta = delta * timeScale
    simTimeRef.current += scaledDelta

    const rb = record.rigidBody
    const pos = rb.translation()
    const v = rb.linvel()
    const speed = Math.hypot(v.x, v.y, v.z)
    const mass = item.mass

    let accel = 0
    let accelX = 0
    let accelY = 0
    let accelZ = 0
    if (hasPrevRef.current && scaledDelta > 0) {
      const ax = (v.x - prevVelRef.current.x) / scaledDelta
      const ay = (v.y - prevVelRef.current.y) / scaledDelta
      const az = (v.z - prevVelRef.current.z) / scaledDelta
      accelX = ax
      accelY = ay
      accelZ = az
      accel = Math.hypot(ax, ay, az)
    }
    prevVelRef.current.set(v.x, v.y, v.z)
    hasPrevRef.current = true

    const ke = 0.5 * mass * speed * speed
    const pe = mass * Math.abs(gravity[1]) * Math.max(0, pos.y)

    const sample: TelemetrySample = {
      t: simTimeRef.current,
      pos: [pos.x, pos.y, pos.z],
      vel: [v.x, v.y, v.z],
      speed,
      accel,
      accelX,
      accelY,
      accelZ,
      ke,
      pe,
    }

    liveAccumRef.current += delta
    if (liveAccumRef.current >= 0.1) {
      setLive(sample)
      liveAccumRef.current = 0
    }

    if (sampling) {
      sampleBufferRef.current.push(sample)
      pushAccumRef.current += scaledDelta
      if (pushAccumRef.current >= 0.033) {
        pushSamples(sampleBufferRef.current, pushAccumRef.current)
        sampleBufferRef.current = []
        pushAccumRef.current = 0
      }
    }
  })

  return null
}
