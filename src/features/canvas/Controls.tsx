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
  /** When set (with a fresh focusKey), the camera re-aims at this point. */
  focusTarget?: [number, number, number]
  /** Increment to force a re-focus even if focusTarget is unchanged. */
  focusKey?: number
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
  focusTarget,
  focusKey,
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

    // Disable damping during view switch for instant snap
    const ctrl = controlsRef.current
    if (ctrl) {
      ctrl.enableDamping = false
    }

    camera.position.set(...position)
    camera.lookAt(new THREE.Vector3(...target))

    if (ctrl) {
      ctrl.target.set(...target)
      ctrl.update()
      // Re-enable damping after the frame
      requestAnimationFrame(() => {
        ctrl.enableDamping = enableDamping
      })
    }
  }, [view, target, camera, enableDamping])

  // Re-aim the camera at focusTarget when focusKey bumps.
  useEffect(() => {
    if (focusKey === undefined || !focusTarget) return
    const ctrl = controlsRef.current
    if (!ctrl) return
    const focusVec = new THREE.Vector3(...focusTarget)
    // Keep the current view direction but re-center on the target. Move the
    // camera so its offset from the target is preserved.
    const offset = new THREE.Vector3().subVectors(camera.position, ctrl.target)
    ctrl.target.copy(focusVec)
    camera.position.copy(focusVec).add(offset)
    ctrl.update()
  }, [focusKey, focusTarget, camera])

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
