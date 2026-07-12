import { OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

export type CameraView = 'free' | 'top' | 'front' | 'side' | 'follow'

export interface CameraControllerProps {
  view?: CameraView
  target?: [number, number, number]
  enableDamping?: boolean
  enablePan?: boolean
}

const viewPositions: Record<Exclude<CameraView, 'free' | 'follow'>, [number, number, number]> = {
  top: [0, 15, 0.01],
  front: [0, 3, 12],
  side: [12, 3, 0],
}

export function CameraController({
  view = 'free',
  target = [0, 0, 0],
  enableDamping = true,
  enablePan = true,
}: CameraControllerProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const { camera } = useThree()

  useEffect(() => {
    if (view === 'free' || view === 'follow') {
      return
    }

    const position = viewPositions[view]
    if (!position) {
      return
    }

    camera.position.set(...position)
    camera.lookAt(new THREE.Vector3(...target))

    if (controlsRef.current) {
      controlsRef.current.target.set(...target)
      controlsRef.current.update()
    }
  }, [view, target, camera])

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping={enableDamping}
      enablePan={enablePan}
      enableRotate
      enableZoom
      dampingFactor={0.08}
      minDistance={2}
      maxDistance={50}
      maxPolarAngle={Math.PI / 2 - 0.05}
      target={target}
      makeDefault
    />
  )
}
