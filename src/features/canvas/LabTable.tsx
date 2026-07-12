import { useMemo } from 'react'
import { createMaterial } from './Materials'

export interface LabTableProps {
  position?: [number, number, number]
  size?: [number, number]
  height?: number
}

export function LabTable({ position = [0, 0, 0], size = [6, 4], height = 0.8 }: LabTableProps) {
  const tableTopMaterial = useMemo(
    () => createMaterial('wood', { color: '#d4c8a8', roughness: 0.7 }),
    []
  )
  const legMaterial = useMemo(
    () => createMaterial('metal', { color: '#8a8a8a', roughness: 0.4, metalness: 0.8 }),
    []
  )

  const [w, d] = size
  const legThickness = 0.08
  const legHeight = height - 0.05
  const legInset = 0.1

  return (
    <group position={position}>
      {/* 桌面 */}
      <mesh position={[0, height, 0]} castShadow receiveShadow material={tableTopMaterial}>
        <boxGeometry args={[w, 0.05, d]} />
      </mesh>

      {/* 桌腿 */}
      {[
        [w / 2 - legInset, d / 2 - legInset],
        [-(w / 2 - legInset), d / 2 - legInset],
        [w / 2 - legInset, -(d / 2 - legInset)],
        [-(w / 2 - legInset), -(d / 2 - legInset)],
      ].map(([x, z], i) => (
        <mesh
          key={i}
          position={[x, legHeight / 2, z]}
          castShadow
          receiveShadow
          material={legMaterial}
        >
          <boxGeometry args={[legThickness, legHeight, legThickness]} />
        </mesh>
      ))}

      {/* 横梁加固 */}
      <mesh
        position={[0, legHeight * 0.3, d / 2 - legInset]}
        castShadow
        receiveShadow
        material={legMaterial}
      >
        <boxGeometry args={[w - 2 * legInset, legThickness * 0.6, legThickness * 0.6]} />
      </mesh>
      <mesh
        position={[0, legHeight * 0.3, -(d / 2 - legInset)]}
        castShadow
        receiveShadow
        material={legMaterial}
      >
        <boxGeometry args={[w - 2 * legInset, legThickness * 0.6, legThickness * 0.6]} />
      </mesh>
    </group>
  )
}
