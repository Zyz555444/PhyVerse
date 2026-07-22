import { useState, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { useShallow } from 'zustand/shallow'
import { usePhysics } from '@/features/physics/usePhysics'
import { useSandboxStore } from '@/features/sandbox/sandboxStore'

const GRAVITY_COLOR = '#fbbf24'
const SPRING_COLOR = '#4ade80'
const NET_FORCE_COLOR = '#ffffff'
const FORCE_SCALE = 0.05

interface ForceDisplayData {
  id: string
  position: [number, number, number]
  gravEnd: [number, number, number]
  netForceEnd: [number, number, number]
  springForces: Array<{ end: [number, number, number] }>
}

export function ForceVisualizer({ isRunning }: { isRunning: boolean }) {
  const { world } = usePhysics()
  const { items, joints, gravity, showForceVectors } = useSandboxStore(
    useShallow((s) => ({
      items: s.items,
      joints: s.joints,
      gravity: s.gravity,
      showForceVectors: s.editorConfig.showForceVectors,
    }))
  )

  const [forceData, setForceData] = useState<ForceDisplayData[]>([])
  const prevVelRef = useRef<Map<string, THREE.Vector3>>(new Map())
  const hasPrevRef = useRef(false)

  useFrame((_, _delta) => {
    if (!isRunning || !showForceVectors || !world?.isReady) {
      if (forceData.length > 0) setForceData([])
      return
    }

    const data: ForceDisplayData[] = []

    for (const item of items) {
      if (!item.isDynamic) continue
      const record = world.getBody(item.id)
      if (!record) continue

      const rb = record.rigidBody
      const pos = rb.translation()
      const v = rb.linvel()
      const mass = item.mass
      const p: [number, number, number] = [pos.x, pos.y, pos.z]

      const gravEnd: [number, number, number] = [
        p[0] + gravity[0] * FORCE_SCALE * mass,
        p[1] + gravity[1] * FORCE_SCALE * mass,
        p[2] + gravity[2] * FORCE_SCALE * mass,
      ]

      let netForceEnd: [number, number, number] = [p[0], p[1], p[2]]
      const prevV = prevVelRef.current.get(item.id)
      if (prevV && hasPrevRef.current) {
        const ax = (v.x - prevV.x) / 0.016
        const ay = (v.y - prevV.y) / 0.016
        const az = (v.z - prevV.z) / 0.016
        const netLen = Math.hypot(ax, ay, az) * mass * FORCE_SCALE * 0.5
        const netDir = new THREE.Vector3(ax, ay, az).normalize()
        netForceEnd = [p[0] + netDir.x * netLen, p[1] + netDir.y * netLen, p[2] + netDir.z * netLen]
      }

      prevVelRef.current.set(item.id, new THREE.Vector3(v.x, v.y, v.z))

      const springForces = joints
        .filter((j) => j.type === 'spring' && (j.bodyA === item.id || j.bodyB === item.id))
        .map((j) => {
          const otherId = j.bodyA === item.id ? j.bodyB : j.bodyA
          const otherRecord = world.getBody(otherId)
          if (!otherRecord) return null
          const otherPos = otherRecord.rigidBody.translation()
          const dx = otherPos.x - pos.x
          const dy = otherPos.y - pos.y
          const dz = otherPos.z - pos.z
          const dist = Math.hypot(dx, dy, dz)
          const restLen = j.restLength ?? 1
          const stiffness = j.stiffness ?? 100
          const extension = dist - restLen
          const forceMag = stiffness * Math.abs(extension) * FORCE_SCALE * 0.01
          const dir = new THREE.Vector3(dx, dy, dz).normalize()
          const sign = item.id === j.bodyA ? 1 : -1
          return {
            end: [
              p[0] + dir.x * forceMag * sign,
              p[1] + dir.y * forceMag * sign,
              p[2] + dir.z * forceMag * sign,
            ] as [number, number, number],
          }
        })
        .filter(Boolean) as Array<{ end: [number, number, number] }>

      data.push({ id: item.id, position: p, gravEnd, netForceEnd, springForces })
    }

    hasPrevRef.current = true
    setForceData(data)
  })

  if (!showForceVectors) return null

  return (
    <group>
      {forceData.map((d) => (
        <group key={d.id}>
          <Line
            points={[d.position, d.gravEnd]}
            color={GRAVITY_COLOR}
            lineWidth={2}
            transparent
            opacity={0.8}
            depthTest={false}
          />
          <Line
            points={[d.position, d.netForceEnd]}
            color={NET_FORCE_COLOR}
            lineWidth={3}
            transparent
            opacity={0.9}
            depthTest={false}
          />
          {d.springForces.map((sf, i) => (
            <Line
              key={`spring-${i}`}
              points={[d.position, sf.end]}
              color={SPRING_COLOR}
              lineWidth={2}
              transparent
              opacity={0.7}
              depthTest={false}
            />
          ))}
        </group>
      ))}
    </group>
  )
}
