import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useShallow } from 'zustand/shallow'
import { Sphere, Ring } from '@react-three/drei'
import { DoubleSide } from 'three'
import { usePhysics } from '@/features/physics/usePhysics'
import { useSandboxStore, getForceFieldType, getForceFieldStrength } from '@/features/sandbox/sandboxStore'

const FORCE_FIELD_COLOR = '#8b5cf6'
const FORCE_SCALE = 50
const FORCE_FIELD_SKIP_FRAMES = 3 // Apply force every N frames to reduce CPU load

/**
 * Renders force field sources as pulsing spheres and applies
 * gravitational/repulsive forces to nearby dynamic bodies.
 * Force calculations are throttled to every 3rd frame.
 */
export function ForceFieldRenderer({ isRunning }: { isRunning: boolean }) {
  const { world } = usePhysics()
  const { items, timeScale } = useSandboxStore(
    useShallow((s) => ({
      items: s.items,
      timeScale: s.editorConfig.timeScale,
    }))
  )

  const frameCounter = useRef(0)

  const forceFields = useMemo(() => items.filter((item) => item.shape === 'force_field'), [items])

  useFrame((_, delta) => {
    if (!isRunning || !world?.isReady || forceFields.length === 0) return

    // Throttle: only apply forces every FORCE_FIELD_SKIP_FRAMES
    frameCounter.current = (frameCounter.current + 1) % FORCE_FIELD_SKIP_FRAMES
    if (frameCounter.current !== 0) return

    const dynamicItems = items.filter((it) => it.isDynamic)
    if (dynamicItems.length === 0) return
    const scaledDt = delta * timeScale * FORCE_FIELD_SKIP_FRAMES

    for (const field of forceFields) {
      const [fx, fy, fz] = field.position
      const fieldRadius = field.size[0] / 2
      const fieldStrength = getForceFieldStrength(field)
      const fieldType = getForceFieldType(field)

      for (const dynItem of dynamicItems) {
        const record = world.getBody(dynItem.id)
        if (!record) continue

        const pos = record.rigidBody.translation()
        const dx = pos.x - fx
        const dy = pos.y - fy
        const dz = pos.z - fz
        const distSq = dx * dx + dy * dy + dz * dz

        // Coarse reject: skip if outside field radius (using squared distance)
        if (distSq >= fieldRadius * fieldRadius || distSq < 0.0001) continue

        const dist = Math.sqrt(distSq)
        const invDist = 1 / dist
        const dirX = dx * invDist
        const dirY = dy * invDist
        const dirZ = dz * invDist

        // Force magnitude: inverse square law within field radius
        const forceMag = (fieldStrength / (dist * dist)) * FORCE_SCALE * scaledDt

        const sign = fieldType === 'repel' ? 1 : -1
        record.rigidBody.applyImpulse(
          { x: sign * dirX * forceMag, y: sign * dirY * forceMag, z: sign * dirZ * forceMag },
          true
        )
      }
    }
  })

  if (forceFields.length === 0) return null

  return (
    <group>
      {forceFields.map((field, _i) => {
        const [x, y, z] = field.position
        const radius = field.size[0] / 2
        const isAttractive = getForceFieldType(field) === 'attract'

        return (
          <group key={field.id}>
            {/* Field center sphere */}
            <Sphere args={[0.2, 16, 16]} position={[x, y, z]}>
              <meshStandardMaterial
                color={isAttractive ? '#3b82f6' : '#ef4444'}
                emissive={isAttractive ? '#1d4ed8' : '#b91c1c'}
                emissiveIntensity={0.5}
                transparent
                opacity={0.9}
              />
            </Sphere>

            {/* Field range indicator */}
            <Sphere args={[radius, 32, 32]} position={[x, y, z]}>
              <meshBasicMaterial
                color={FORCE_FIELD_COLOR}
                transparent
                opacity={0.08}
                depthTest={false}
                depthWrite={false}
              />
            </Sphere>

            {/* Pulsing ring */}
            <Ring
              args={[radius - 0.05, radius, 64]}
              position={[x, y, z]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <meshBasicMaterial
                color={FORCE_FIELD_COLOR}
                transparent
                opacity={0.2}
                side={DoubleSide}
                depthTest={false}
                depthWrite={false}
              />
            </Ring>

            {/* Field direction arrows */}
            {isAttractive ? (
              <ArrowRing x={x} y={y} z={z} radius={radius} inward />
            ) : (
              <ArrowRing x={x} y={y} z={z} radius={radius} inward={false} />
            )}
          </group>
        )
      })}
    </group>
  )
}

function ArrowRing({
  x,
  y,
  z,
  radius,
  inward,
}: {
  x: number
  y: number
  z: number
  radius: number
  inward: boolean
}) {
  const arrowCount = 8
  const elements = []
  for (let ai = 0; ai < arrowCount; ai++) {
    const angle = (ai / arrowCount) * Math.PI * 2
    const ax = x + Math.cos(angle) * radius
    const az = z + Math.sin(angle) * radius
    const tipX = inward
      ? x + Math.cos(angle) * (radius - 0.3)
      : x + Math.cos(angle) * (radius + 0.3)
    const tipZ = inward
      ? z + Math.sin(angle) * (radius - 0.3)
      : z + Math.sin(angle) * (radius + 0.3)

    const dx = tipX - ax
    const dz = tipZ - az
    const angle2 = Math.atan2(dz, dx)

    elements.push(
      <group key={ai}>
        {/* Arrow body */}
        <mesh position={[ax + dx * 0.5, y, az + dz * 0.5]} rotation={[0, -angle2, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
          <meshBasicMaterial
            color={FORCE_FIELD_COLOR}
            transparent
            opacity={0.5}
            depthTest={false}
          />
        </mesh>
        {/* Arrow head */}
        <mesh position={[tipX, y, tipZ]} rotation={[0, -angle2, 0]}>
          <coneGeometry args={[0.06, 0.15, 8]} />
          <meshBasicMaterial
            color={FORCE_FIELD_COLOR}
            transparent
            opacity={0.7}
            depthTest={false}
          />
        </mesh>
      </group>
    )
  }
  return <>{elements}</>
}
