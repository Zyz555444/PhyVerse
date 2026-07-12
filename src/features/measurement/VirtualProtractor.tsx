import { useMemo } from 'react'
import { Line, Text } from '@react-three/drei'
import * as THREE from 'three'
import { useExperimentStore } from '@/features/panels/experimentStore'

interface VirtualProtractorProps {
  radius?: number
  position?: [number, number, number]
}

export function VirtualProtractor({ radius = 2, position = [0, 0.01, 0] }: VirtualProtractorProps) {
  const visible = useExperimentStore((s) => s.tools.protractor)

  const marks = useMemo(() => {
    const items: Array<{ angle: number; isMajor: boolean; label?: string }> = []
    for (let deg = 0; deg < 360; deg += 10) {
      const isMajor = deg % 30 === 0
      items.push({
        angle: deg,
        isMajor,
        label: isMajor && deg % 90 === 0 ? `${deg}°` : isMajor ? `${deg}` : undefined,
      })
    }
    return items
  }, [])

  const circlePoints = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const segments = 64
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius))
    }
    return pts
  }, [radius])

  if (!visible) return null

  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[radius, 64]} />
        <meshStandardMaterial color="#e6f3ff" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>

      <Line points={circlePoints} color="#4a90d9" lineWidth={1.5} />

      {marks.map((mark, idx) => {
        const rad = (mark.angle * Math.PI) / 180
        const inner = mark.isMajor ? radius * 0.85 : radius * 0.92
        const outer = radius
        const x1 = Math.cos(rad) * inner
        const z1 = Math.sin(rad) * inner
        const x2 = Math.cos(rad) * outer
        const z2 = Math.sin(rad) * outer
        const tickPoints: THREE.Vector3[] = [
          new THREE.Vector3(x1, 0, z1),
          new THREE.Vector3(x2, 0, z2),
        ]
        const labelRadius = radius * 0.75
        const labelX = Math.cos(rad) * labelRadius
        const labelZ = Math.sin(rad) * labelRadius
        return (
          <group key={idx}>
            <Line
              points={tickPoints}
              color={mark.isMajor ? '#2c5f8a' : '#7fa8c8'}
              lineWidth={mark.isMajor ? 1.5 : 0.8}
            />
            {mark.label !== undefined && (
              <Text
                position={[labelX, 0.01, labelZ]}
                rotation={[-Math.PI / 2, 0, -rad]}
                fontSize={mark.label.includes('°') ? 0.18 : 0.12}
                color="#2c5f8a"
                anchorX="center"
                anchorY="middle"
              >
                {mark.label}
              </Text>
            )}
          </group>
        )
      })}
    </group>
  )
}
