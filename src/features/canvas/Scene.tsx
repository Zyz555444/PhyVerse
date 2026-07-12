import { Canvas } from '@react-three/fiber'
import { Suspense, type ReactNode } from 'react'
import * as THREE from 'three'
import { Lighting } from './Lighting'
import { Grid } from './Grid'
import { CameraController } from './Controls'

export interface SceneProps {
  children?: ReactNode
  showGrid?: boolean
  enableShadows?: boolean
  cameraPosition?: [number, number, number]
  cameraView?: 'free' | 'top' | 'front' | 'side' | 'follow'
}

export function Scene({
  children,
  showGrid = true,
  enableShadows = true,
  cameraPosition = [6, 5, 6],
  cameraView = 'free',
}: SceneProps) {
  return (
    <Canvas
      shadows={enableShadows}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
      }}
      camera={{
        position: cameraPosition,
        fov: 50,
        near: 0.1,
        far: 1000,
      }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#f0f0ea']} />
      <fog attach="fog" args={['#f0f0ea', 20, 60]} />

      <Suspense fallback={null}>
        <Lighting />
        {showGrid && <Grid />}
        <CameraController view={cameraView} />
        {children}
      </Suspense>
    </Canvas>
  )
}
