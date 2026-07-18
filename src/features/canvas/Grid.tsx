import { Grid as DreiGrid } from '@react-three/drei'

export function Grid() {
  return (
    <DreiGrid
      position={[0, 0.001, 0]}
      args={[20, 20]}
      cellSize={0.5}
      cellThickness={0.6}
      cellColor="#cfcfc5"
      sectionSize={2}
      sectionThickness={1.4}
      sectionColor="#a8a89f"
      fadeDistance={40}
      fadeStrength={1.4}
      followCamera={false}
      infiniteGrid
    />
  )
}
