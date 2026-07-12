import { useMemo } from 'react'
import { Line, Text } from '@react-three/drei'
import * as THREE from 'three'
import { useExperimentStore } from '@/features/panels/experimentStore'

interface VirtualRulerProps {
  length?: number
  position?: [number, number, number]
}

export function VirtualRuler({ length = 10, position = [0, 0.01, 3.2] }: VirtualRulerProps) {
  const visible = useExperimentStore((s) => s.tools.ruler)

  const ticks = useMemo(() => {
    const items: Array<{ x: number; height: number; label?: string }> = []
    const halfLength = length / 2
    for (let i = 0; i <= length * 10; i++) {
      const x = -halfLength + i * 0.1
      const isMajor = i % 10 === 0
      items.push({
        x,
        height: isMajor ? 0.25 : 0.12,
        label: isMajor ? (i / 10).toString() : undefined,
      })
    }
    return items
  }, [length])

  if (!visible) return null

  const points: THREE.Vector3[] = [
    new THREE.Vector3(-length / 2, 0, 0),
    new THREE.Vector3(length / 2, 0, 0),
  ]

  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[length, 0.3]} />
        <meshStandardMaterial color="#f5deb3" transparent opacity={0.85} />
      </mesh>

      <Line points={points} color="#8b6f47" lineWidth={1.5} />

      {ticks.map((tick, idx) => {
        const tickPoints: THREE.Vector3[] = [
          new THREE.Vector3(tick.x, 0, 0.15),
          new THREE.Vector3(tick.x, 0, 0.15 + tick.height * 0.1),
        ]
        return (
          <group key={idx}>
            <Line points={tickPoints} color="#8b6f47" lineWidth={1} />
            {tick.label !== undefined && (
              <Text
                position={[tick.x, 0.01, 0.45]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.12}
                color="#5a4a30"
                anchorX="center"
                anchorY="middle"
              >
                {tick.label}
              </Text>
            )}
          </group>
        )
      })}
    </group>
  )
}
