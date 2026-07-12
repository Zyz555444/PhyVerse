import { Grid as DreiGrid } from '@react-three/drei'
import { Axes } from './Axes'

export function Grid() {
  return (
    <>
      <DreiGrid
        position={[0, 0, 0]}
        args={[20, 20]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#c0c0b8"
        sectionSize={2.5}
        sectionThickness={1}
        sectionColor="#9b9b9b"
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
      />
      <Axes length={2} />
    </>
  )
}
