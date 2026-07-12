import { useMemo } from 'react'
import * as THREE from 'three'

export interface AxesProps {
  length?: number
  lineWidth?: number
}

export function Axes({ length = 1, lineWidth = 2 }: AxesProps) {
  const axes = useMemo(
    () => [
      {
        color: '#ef4444',
        positions: [new THREE.Vector3(0, 0.001, 0), new THREE.Vector3(length, 0.001, 0)],
        label: 'X',
      },
      {
        color: '#22c55e',
        positions: [new THREE.Vector3(0, 0.001, 0), new THREE.Vector3(0, length, 0.001)],
        label: 'Y',
      },
      {
        color: '#3b82f6',
        positions: [new THREE.Vector3(0, 0.001, 0), new THREE.Vector3(0, 0.001, length)],
        label: 'Z',
      },
    ],
    [length]
  )

  return (
    <group>
      {axes.map((axis) => (
        <line key={axis.label}>
          <bufferAttribute
            attach="geometry-attributes-position"
            args={[
              new Float32Array([
                axis.positions[0].x,
                axis.positions[0].y,
                axis.positions[0].z,
                axis.positions[1].x,
                axis.positions[1].y,
                axis.positions[1].z,
              ]),
              3,
            ]}
            count={2}
          />
          <lineBasicMaterial color={axis.color} linewidth={lineWidth} />
        </line>
      ))}
    </group>
  )
}
