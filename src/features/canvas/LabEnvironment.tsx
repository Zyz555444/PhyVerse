import { LabTable } from './LabTable'

export function LabEnvironment() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <shadowMaterial transparent opacity={0.12} color="#1a1a1a" />
      </mesh>
      <LabTable position={[0, 0, 0]} size={[10, 8]} height={0.8} />
    </group>
  )
}
