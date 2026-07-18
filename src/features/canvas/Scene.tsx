import { Canvas } from '@react-three/fiber'
import { Suspense, type ReactNode } from 'react'
import * as THREE from 'three'
import { Lighting } from './Lighting'
import { Grid } from './Grid'
import { LabEnvironment } from './LabEnvironment'
import { CameraController } from './Controls'

export interface SceneProps {
  children?: ReactNode
  showGrid?: boolean
  enableShadows?: boolean
  cameraPosition?: [number, number, number]
  cameraView?: 'free' | 'top' | 'front' | 'side' | 'follow'
  /** Increment to force camera reset */
  cameraResetKey?: number
  /** When set (with a fresh focusKey), the camera re-aims at this point. */
  focusTarget?: [number, number, number]
  /** Increment to force a re-focus even if focusTarget is unchanged. */
  focusKey?: number
  /** Render the default lab environment (floor + table). */
  environment?: boolean
}

export function Scene({
  children,
  showGrid = true,
  enableShadows = true,
  cameraPosition = [6, 5, 6],
  cameraView = 'free',
  cameraResetKey,
  focusTarget,
  focusKey,
  environment = false,
}: SceneProps) {
  return (
    <Canvas
      shadows={enableShadows ? 'percentage' : false}
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
      <color attach="background" args={['#e8e8e2']} />
      <fog attach="fog" args={['#e8e8e2', 25, 75]} />

      <Suspense fallback={null}>
        <Lighting />
        {showGrid && <Grid />}
        {environment && <LabEnvironment />}
        <CameraController
          key={cameraResetKey}
          view={cameraView}
          focusTarget={focusTarget}
          focusKey={focusKey}
        />
        {children}
      </Suspense>
    </Canvas>
  )
}
