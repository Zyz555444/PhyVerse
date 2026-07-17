import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { usePhysics } from '@/features/physics/usePhysics'
import { useSandboxStore } from '@/features/sandbox/sandboxStore'

export interface MeasurementData {
  speed: number
  ke: number
  pe: number
  totalEnergy: number
  posY: number
  distance: number
  distanceTargets: [string, string] | null
}

/** Shared store for measurement data, updated from within PhysicsProvider */
let _data: MeasurementData = {
  speed: 0,
  ke: 0,
  pe: 0,
  totalEnergy: 0,
  posY: 0,
  distance: 0,
  distanceTargets: null,
}

const listeners = new Set<() => void>()

export function getMeasurementData(): MeasurementData {
  return _data
}

export function subscribeMeasurementData(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notifyListeners() {
  listeners.forEach((fn) => fn())
}

export function setMeasurementData(partial: Partial<MeasurementData>) {
  _data = { ..._data, ...partial }
  notifyListeners()
}

/**
 * Component that sits inside PhysicsProvider and collects real-time physics data.
 * Must be rendered inside the 3D scene.
 */
export function MeasurementDataCollector() {
  const { world } = usePhysics()
  const items = useSandboxStore((s) => s.items)
  const selectedId = useSandboxStore((s) => s.selectedId)
  const gravity = useSandboxStore((s) => s.gravity)
  const throttleRef = useRef(0)

  useFrame((_, delta) => {
    throttleRef.current += delta
    if (throttleRef.current < 0.1) return
    throttleRef.current = 0

    if (!selectedId || !world?.isReady) {
      setMeasurementData({ speed: 0, ke: 0, pe: 0, totalEnergy: 0, posY: 0 })
      return
    }

    const record = world.getBody(selectedId)
    const item = items.find((it) => it.id === selectedId)
    if (!record || !item) {
      setMeasurementData({ speed: 0, ke: 0, pe: 0, totalEnergy: 0, posY: 0 })
      return
    }

    const v = record.rigidBody.linvel()
    const pos = record.rigidBody.translation()
    const speed = Math.hypot(v.x, v.y, v.z)
    const ke = 0.5 * item.mass * speed * speed
    const pe = item.mass * Math.abs(gravity[1]) * Math.max(0, pos.y)

    setMeasurementData({
      speed,
      ke,
      pe,
      totalEnergy: ke + pe,
      posY: pos.y,
    })
  })

  return null
}
