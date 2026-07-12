import { useEffect, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Object3D } from 'three'
import { usePhysics } from './usePhysics'

/**
 * Syncs a Rapier rigid body's transform to a Three.js mesh each frame.
 * Pass the body label to look up the rigid body in the PhysicsWorld.
 */
export function usePhysicsSync(
  label: string,
  externalRef?: RefObject<Object3D | null>
): RefObject<Object3D | null> {
  const { world } = usePhysics()
  const internalRef = useRef<Object3D>(null)
  const meshRef = externalRef ?? internalRef

  useEffect(() => {
    return () => {
      if (world) {
        world.removeBody(label)
      }
    }
  }, [label, world])

  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh || !world) return

    const record = world.getBody(label)
    if (!record) return

    const body = record.rigidBody
    const pos = body.translation()
    const rot = body.rotation()

    mesh.position.set(pos.x, pos.y, pos.z)
    mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w)
  })

  return meshRef
}
