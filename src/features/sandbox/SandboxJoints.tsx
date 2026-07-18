import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { usePhysics } from '@/features/physics/usePhysics'
import {
  createSpringJoint,
  createFixedJoint,
  createRopeJoint,
  createMotorJoint,
  createJoint as createPhysicsJoint,
} from '@/features/physics/JointFactory'
import { useSandboxStore, type SandboxJoint, type JointType } from './sandboxStore'

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
      case 'gear':
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
      case 'revolute':
        return createPhysicsJoint(world.world, {
          type: 'revolute',
          body1: bodyA.rigidBody,
          body2: bodyB.rigidBody,
          anchor1: joint.anchorA ?? [0, 0, 0],
          anchor2: joint.anchorB ?? [0, 0, 0],
          axis: joint.axis ?? [0, 1, 0],
          limits: joint.limits,
        })
      case 'prismatic':
        return createPhysicsJoint(world.world, {
          type: 'prismatic',
          body1: bodyA.rigidBody,
          body2: bodyB.rigidBody,
          anchor1: joint.anchorA ?? [0, 0, 0],
          anchor2: joint.anchorB ?? [0, 0, 0],
          axis: joint.axis ?? [1, 0, 0],
          limits: joint.limits,
        })
      case 'motor':
        return createMotorJoint(
          world.world,
          bodyA.rigidBody,
          bodyB.rigidBody,
          joint.anchorA ?? [0, 0, 0],
          joint.anchorB ?? [0, 0, 0],
          joint.axis ?? [0, 1, 0],
          joint.targetVelocity ?? 1,
          joint.maxMotorForce ?? 10
        )
      default:
        return null
    }
  } catch (err) {
    console.warn(
      `[SandboxJoints] failed to create "${joint.type}" joint (${joint.id}) between ${joint.bodyA} and ${joint.bodyB}:`,
      err
    )
    return null
  }
}

const JOINT_STYLE: Record<JointType, { color: string; dashed: boolean; opacity: number }> = {
  spring: { color: '#9b9b9b', dashed: true, opacity: 0.85 },
  rope: { color: '#a16207', dashed: false, opacity: 0.9 },
  fixed: { color: '#2563eb', dashed: true, opacity: 0.7 },
  revolute: { color: '#16a34a', dashed: true, opacity: 0.8 },
  prismatic: { color: '#9333ea', dashed: true, opacity: 0.8 },
  motor: { color: '#ea580c', dashed: false, opacity: 0.9 },
  gear: { color: '#0891b2', dashed: true, opacity: 0.8 },
}

function JointLine({ joint }: { joint: SandboxJoint }) {
  const { world } = usePhysics()
  const lineRef = useRef<THREE.LineSegments>(null)
  const style = JOINT_STYLE[joint.type]

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
    return geo
  }, [])

  const material = useMemo(() => {
    return new THREE.LineDashedMaterial({
      color: style.color,
      transparent: true,
      opacity: style.opacity,
      dashSize: style.dashed ? 0.15 : 0.001,
      gapSize: style.dashed ? 0.1 : 0.0005,
    })
  }, [style.color, style.dashed, style.opacity])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame(() => {
    if (!world || !world.isReady) return
    const bodyA = world.getBody(joint.bodyA)
    const bodyB = world.getBody(joint.bodyB)
    if (!bodyA || !bodyB) return

    const posA = bodyA.rigidBody.translation()
    const posB = bodyB.rigidBody.translation()

    const anchorA = joint.anchorA ?? [0, 0, 0]
    const anchorB = joint.anchorB ?? [0, 0, 0]

    const ax = posA.x + anchorA[0]
    const ay = posA.y + anchorA[1]
    const az = posA.z + anchorA[2]
    const bx = posB.x + anchorB[0]
    const by = posB.y + anchorB[1]
    const bz = posB.z + anchorB[2]

    const attr = geometry.getAttribute('position') as THREE.BufferAttribute
    const arr = attr.array as Float32Array
    arr[0] = ax
    arr[1] = ay
    arr[2] = az
    arr[3] = bx
    arr[4] = by
    arr[5] = bz
    attr.needsUpdate = true
    geometry.computeBoundingSphere()
    // LineDashedMaterial requires distance calculations to render dashes.
    lineRef.current?.computeLineDistances()

    // Kinematic gear coupling: bodyB angular velocity along the gear axis is
    // kept at -bodyA * ratio. This is an approximation, not a true constraint.
    if (joint.type === 'gear') {
      const axis = new THREE.Vector3(
        joint.axis?.[0] ?? 0,
        joint.axis?.[1] ?? 1,
        joint.axis?.[2] ?? 0
      ).normalize()
      const avA = bodyA.rigidBody.angvel()
      const projA = new THREE.Vector3(avA.x, avA.y, avA.z).dot(axis)
      const targetB = axis.clone().multiplyScalar(-projA * (joint.gearRatio ?? 1))
      const avB = bodyB.rigidBody.angvel()
      const vecB = new THREE.Vector3(avB.x, avB.y, avB.z)
      const perpB = vecB.sub(axis.clone().multiplyScalar(vecB.dot(axis)))
      bodyB.rigidBody.setAngvel(
        {
          x: perpB.x + targetB.x,
          y: perpB.y + targetB.y,
          z: perpB.z + targetB.z,
        },
        true
      )
    }
  })

  return <lineSegments ref={lineRef} geometry={geometry} material={material} />
}

function jointSignature(joint: SandboxJoint): string {
  const parts = [
    joint.type,
    joint.bodyA,
    joint.bodyB,
    (joint.anchorA ?? [0, 0, 0]).join(','),
    (joint.anchorB ?? [0, 0, 0]).join(','),
    (joint.axis ?? [0, 1, 0]).join(','),
    (joint.limits ?? ['', '']).join(','),
    joint.restLength ?? '',
    joint.stiffness ?? '',
    joint.damping ?? '',
    joint.maxDistance ?? '',
    joint.targetVelocity ?? '',
    joint.maxMotorForce ?? '',
    joint.gearRatio ?? '',
  ]
  return parts.join('|')
}

export function SandboxJoints() {
  const { world } = usePhysics()
  const joints = useSandboxStore((s) => s.joints)
  const jointLabelsRef = useRef<Set<string>>(new Set())
  const jointSignaturesRef = useRef<Map<string, string>>(new Map())

  // Incremental sync: only add/remove/recreate joints that actually changed.
  useEffect(() => {
    if (!world || !world.isReady) return

    const labels = jointLabelsRef.current
    const signatures = jointSignaturesRef.current
    const currentIds = new Set(joints.map((j) => j.id))

    // Remove joints that no longer exist.
    for (const label of [...labels]) {
      if (!currentIds.has(label)) {
        world.removeJoint(label)
        labels.delete(label)
        signatures.delete(label)
      }
    }

    // Add or recreate joints whose signature changed.
    for (const joint of joints) {
      const sig = jointSignature(joint)
      const existingSig = signatures.get(joint.id)
      if (existingSig === sig) continue

      if (labels.has(joint.id)) {
        // Signature changed — recreate.
        world.removeJoint(joint.id)
        labels.delete(joint.id)
      }

      const rapierJoint = createJoint(world, joint)
      if (rapierJoint) {
        try {
          world.addJoint(joint.id, rapierJoint)
          labels.add(joint.id)
          signatures.set(joint.id, sig)
        } catch {
          // Joint already exists (can happen during hot reload)
          world.removeJoint(joint.id)
          world.addJoint(joint.id, rapierJoint)
          labels.add(joint.id)
          signatures.set(joint.id, sig)
        }
      }
    }
  }, [world, joints])

  // Unmount-only cleanup: remove all joints we created.
  useEffect(() => {
    const labels = jointLabelsRef.current
    const signatures = jointSignaturesRef.current
    return () => {
      if (!world || !world.isReady) return
      for (const label of labels) {
        world.removeJoint(label)
      }
      labels.clear()
      signatures.clear()
    }
  }, [world])

  return (
    <>
      {joints.map((joint) => (
        <JointLine key={joint.id} joint={joint} />
      ))}
    </>
  )
}
