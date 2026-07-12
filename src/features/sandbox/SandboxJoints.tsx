import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { usePhysics } from '@/features/physics/usePhysics'
import {
  createSpringJoint,
  createFixedJoint,
  createRopeJoint,
} from '@/features/physics/JointFactory'
import { useSandboxStore, type SandboxJoint } from './sandboxStore'

function createJoint(
  world: NonNullable<ReturnType<typeof usePhysics>['world']>,
  joint: SandboxJoint
) {
  const bodyA = world.getBody(joint.bodyA)
  const bodyB = world.getBody(joint.bodyB)
  if (!bodyA || !bodyB) return null

  try {
    switch (joint.type) {
      case 'spring':
        return createSpringJoint(
          world.world,
          bodyA.rigidBody,
          bodyB.rigidBody,
          joint.restLength ?? 1,
          joint.stiffness ?? 100,
          joint.damping ?? 5,
          joint.anchorA ?? [0, 0, 0],
          joint.anchorB ?? [0, 0, 0]
        )
      case 'fixed':
        return createFixedJoint(
          world.world,
          bodyA.rigidBody,
          bodyB.rigidBody,
          joint.anchorA ?? [0, 0, 0],
          joint.anchorB ?? [0, 0, 0]
        )
      case 'rope':
        return createRopeJoint(
          world.world,
          bodyA.rigidBody,
          bodyB.rigidBody,
          joint.maxDistance ?? 1,
          joint.anchorA ?? [0, 0, 0],
          joint.anchorB ?? [0, 0, 0]
        )
      default:
        return null
    }
  } catch {
    return null
  }
}

function SpringLine({ joint }: { joint: SandboxJoint }) {
  const { world } = usePhysics()
  const lineRef = useRef<THREE.Line>(null)

  useFrame(() => {
    if (!world || !world.isReady || !lineRef.current) return
    const bodyA = world.getBody(joint.bodyA)
    const bodyB = world.getBody(joint.bodyB)
    if (!bodyA || !bodyB) return

    const posA = bodyA.rigidBody.translation()
    const posB = bodyB.rigidBody.translation()

    const anchorA = joint.anchorA ?? [0, 0, 0]
    const anchorB = joint.anchorB ?? [0, 0, 0]

    const points = [
      new THREE.Vector3(posA.x + anchorA[0], posA.y + anchorA[1], posA.z + anchorA[2]),
      new THREE.Vector3(posB.x + anchorB[0], posB.y + anchorB[1], posB.z + anchorB[2]),
    ]

    const geom = new THREE.BufferGeometry().setFromPoints(points)
    lineRef.current.geometry.dispose()
    lineRef.current.geometry = geom
  })

  return (
    <lineSegments ref={lineRef}>
      <lineBasicMaterial color="#9b9b9b" linewidth={2} />
    </lineSegments>
  )
}

export function SandboxJoints() {
  const { world } = usePhysics()
  const joints = useSandboxStore((s) => s.joints)
  const jointLabelsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!world || !world.isReady) return

    const currentIds = new Set(joints.map((j) => j.id))
    const labels = jointLabelsRef.current

    // Remove joints that no longer exist
    for (const label of labels) {
      if (!currentIds.has(label)) {
        world.removeJoint(label)
      }
    }

    // Create new joints
    for (const joint of joints) {
      if (!labels.has(joint.id)) {
        const rapierJoint = createJoint(world, joint)
        if (rapierJoint) {
          try {
            world.addJoint(joint.id, rapierJoint)
            labels.add(joint.id)
          } catch {
            // Joint already exists (can happen during hot reload)
            world.removeJoint(joint.id)
            world.addJoint(joint.id, rapierJoint)
            labels.add(joint.id)
          }
        }
      }
    }

    return () => {
      for (const label of labels) {
        world.removeJoint(label)
      }
      labels.clear()
    }
  }, [world, joints])

  return (
    <>
      {joints
        .filter((j) => j.type === 'spring')
        .map((joint) => (
          <SpringLine key={joint.id} joint={joint} />
        ))}
    </>
  )
}
