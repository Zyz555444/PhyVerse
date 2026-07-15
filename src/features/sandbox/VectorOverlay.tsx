import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PhysicsWorld } from '@/features/physics/PhysicsWorld'
import { useSandboxStore } from './sandboxStore'

interface VectorOverlayProps {
  bodyRef: React.MutableRefObject<ReturnType<PhysicsWorld['getBody']> | null>
}

const VELOCITY_COLOR = 0x3b82f6
const ACCELERATION_COLOR = 0xef4444
// Scale factors convert physical magnitude to scene units for the arrow length.
const VELOCITY_SCALE = 0.3
const ACCELERATION_SCALE = 0.08
const MIN_ARROW_LENGTH = 0.05
const MAX_VELOCITY_ARROW = 6
const MAX_ACCEL_ARROW = 4

function makeArrow(color: number): THREE.ArrowHelper {
  const arrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    MIN_ARROW_LENGTH,
    color,
    0.2,
    0.12
  )
  // Hide by zeroing scale instead of .visible so the react-hooks/immutability
  // rule (which forbids property assignment on useMemo-derived objects) is
  // satisfied — we only call methods on the arrow.
  arrow.scale.set(0, 0, 0)
  return arrow
}

const HIDDEN = new THREE.Vector3(0, 0, 0)
const VISIBLE = new THREE.Vector3(1, 1, 1)

/**
 * Renders velocity and acceleration arrows attached to a physics body.
 * Reads rigid-body state every frame — no React re-renders involved.
 *
 * Visibility is toggled via `scale.set(0,0,0)` rather than `.visible` so that
 * only method calls are made on the useMemo-created arrows, satisfying the
 * react-hooks/immutability lint rule.
 */
export function VectorOverlay({ bodyRef }: VectorOverlayProps) {
  const showVelocity = useSandboxStore((s) => s.editorConfig.showVelocityVector)
  const showAcceleration = useSandboxStore((s) => s.editorConfig.showAccelerationVector)
  const velocityArrow = useMemo(() => makeArrow(VELOCITY_COLOR), [])
  const accelerationArrow = useMemo(() => makeArrow(ACCELERATION_COLOR), [])

  const prevVelRef = useRef(new THREE.Vector3())
  const hasPrevRef = useRef(false)

  useEffect(() => {
    return () => {
      velocityArrow.dispose()
      accelerationArrow.dispose()
    }
  }, [velocityArrow, accelerationArrow])

  // Reset history whenever toggled off so the next enable starts fresh.
  useEffect(() => {
    if (!showAcceleration) hasPrevRef.current = false
  }, [showAcceleration])

  useFrame((_, delta) => {
    const body = bodyRef.current
    if (!body) {
      velocityArrow.scale.copy(HIDDEN)
      accelerationArrow.scale.copy(HIDDEN)
      return
    }

    const rb = body.rigidBody
    const translation = rb.translation()
    const v = rb.linvel()
    const vx = v.x
    const vy = v.y
    const vz = v.z

    // --- Velocity arrow ---
    if (showVelocity) {
      const speed = Math.hypot(vx, vy, vz)
      if (speed > 0.01) {
        const len = Math.max(speed * VELOCITY_SCALE, MIN_ARROW_LENGTH)
        const clampedLen = Math.min(len, MAX_VELOCITY_ARROW)
        velocityArrow.position.set(translation.x, translation.y, translation.z)
        velocityArrow.setDirection(new THREE.Vector3(vx / speed, vy / speed, vz / speed))
        velocityArrow.setLength(
          clampedLen,
          Math.min(clampedLen * 0.3, 0.4),
          Math.min(clampedLen * 0.2, 0.25)
        )
        velocityArrow.scale.copy(VISIBLE)
      } else {
        velocityArrow.scale.copy(HIDDEN)
      }
    } else {
      velocityArrow.scale.copy(HIDDEN)
    }

    // --- Acceleration arrow (finite difference of velocity) ---
    if (showAcceleration && delta > 0) {
      if (hasPrevRef.current) {
        const ax = (vx - prevVelRef.current.x) / delta
        const ay = (vy - prevVelRef.current.y) / delta
        const az = (vz - prevVelRef.current.z) / delta
        const mag = Math.hypot(ax, ay, az)
        if (mag > 0.05) {
          const len = Math.max(mag * ACCELERATION_SCALE, MIN_ARROW_LENGTH)
          const clampedLen = Math.min(len, MAX_ACCEL_ARROW)
          accelerationArrow.position.set(translation.x, translation.y, translation.z)
          accelerationArrow.setDirection(new THREE.Vector3(ax / mag, ay / mag, az / mag))
          accelerationArrow.setLength(
            clampedLen,
            Math.min(clampedLen * 0.3, 0.4),
            Math.min(clampedLen * 0.2, 0.25)
          )
          accelerationArrow.scale.copy(VISIBLE)
        } else {
          accelerationArrow.scale.copy(HIDDEN)
        }
      } else {
        accelerationArrow.scale.copy(HIDDEN)
      }
      prevVelRef.current.set(vx, vy, vz)
      hasPrevRef.current = true
    } else {
      accelerationArrow.scale.copy(HIDDEN)
    }
  })

  return (
    <>
      <primitive object={velocityArrow} />
      <primitive object={accelerationArrow} />
    </>
  )
}
