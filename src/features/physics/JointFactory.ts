import RAPIER from '@dimforge/rapier3d'
import type {
  World,
  ImpulseJoint,
  RigidBody,
  Vector,
  Rotation,
  UnitImpulseJoint,
} from '@dimforge/rapier3d'

export type JointType =
  'fixed' | 'revolute' | 'prismatic' | 'spherical' | 'spring' | 'rope' | 'motor' | 'gear'

export interface JointParams {
  type: JointType
  body1: RigidBody
  body2: RigidBody
  anchor1?: [number, number, number]
  anchor2?: [number, number, number]
  axis?: [number, number, number]
  limits?: [number, number]
  stiffness?: number
  damping?: number
  restLength?: number
  maxDistance?: number
  targetVelocity?: number
  maxMotorForce?: number
  gearRatio?: number
}

const defaultAnchor: [number, number, number] = [0, 0, 0]
const defaultAxis: [number, number, number] = [0, 1, 0]
const identityRotation: Rotation = { w: 1, x: 0, y: 0, z: 0 }

function toVector(v: [number, number, number]): Vector {
  return { x: v[0], y: v[1], z: v[2] }
}

export function createJoint(world: World, params: JointParams): ImpulseJoint {
  const anchor1 = toVector(params.anchor1 ?? defaultAnchor)
  const anchor2 = toVector(params.anchor2 ?? defaultAnchor)
  const axis = toVector(params.axis ?? defaultAxis)

  switch (params.type) {
    case 'fixed': {
      const desc = RAPIER.JointData.fixed(anchor1, identityRotation, anchor2, identityRotation)
      return world.createImpulseJoint(desc, params.body1, params.body2, true)
    }

    case 'revolute': {
      const desc = RAPIER.JointData.revolute(anchor1, anchor2, axis)
      const joint = world.createImpulseJoint(desc, params.body1, params.body2, true)
      if (params.limits) {
        ;(joint as UnitImpulseJoint).setLimits(params.limits[0], params.limits[1])
      }
      return joint
    }

    case 'prismatic': {
      const desc = RAPIER.JointData.prismatic(anchor1, anchor2, axis)
      const joint = world.createImpulseJoint(desc, params.body1, params.body2, true)
      if (params.limits) {
        ;(joint as UnitImpulseJoint).setLimits(params.limits[0], params.limits[1])
      }
      return joint
    }

    case 'spherical': {
      const desc = RAPIER.JointData.spherical(anchor1, anchor2)
      return world.createImpulseJoint(desc, params.body1, params.body2, true)
    }

    case 'spring': {
      const restLength = params.restLength ?? 0
      const stiffness = params.stiffness ?? 100
      const damping = params.damping ?? 5
      const desc = RAPIER.JointData.spring(restLength, stiffness, damping, anchor1, anchor2)
      return world.createImpulseJoint(desc, params.body1, params.body2, true)
    }

    case 'rope': {
      const maxDistance = params.maxDistance ?? 1
      const desc = RAPIER.JointData.rope(maxDistance, anchor1, anchor2)
      return world.createImpulseJoint(desc, params.body1, params.body2, true)
    }

    case 'motor': {
      const desc = RAPIER.JointData.revolute(anchor1, anchor2, axis)
      const joint = world.createImpulseJoint(desc, params.body1, params.body2, true)
      ;(joint as UnitImpulseJoint).configureMotorVelocity(
        params.targetVelocity ?? 1,
        params.maxMotorForce ?? 10
      )
      return joint
    }

    case 'gear': {
      // Rapier has no native gear joint. We create a fixed placeholder and let
      // the consumer (SandboxJoints) enforce the angular velocity ratio each
      // frame. This is a visual/kinematic approximation, not an energy-
      // conserving physical coupling.
      const desc = RAPIER.JointData.fixed(anchor1, identityRotation, anchor2, identityRotation)
      return world.createImpulseJoint(desc, params.body1, params.body2, true)
    }

    default: {
      const desc = RAPIER.JointData.fixed(anchor1, identityRotation, anchor2, identityRotation)
      return world.createImpulseJoint(desc, params.body1, params.body2, true)
    }
  }
}

export function createFixedJoint(
  world: World,
  body1: RigidBody,
  body2: RigidBody,
  anchor1: [number, number, number] = [0, 0, 0],
  anchor2: [number, number, number] = [0, 0, 0]
): ImpulseJoint {
  return createJoint(world, {
    type: 'fixed',
    body1,
    body2,
    anchor1,
    anchor2,
  })
}

export function createRevoluteJoint(
  world: World,
  body1: RigidBody,
  body2: RigidBody,
  anchor1: [number, number, number],
  anchor2: [number, number, number],
  axis: [number, number, number] = [0, 1, 0],
  limits?: [number, number]
): ImpulseJoint {
  return createJoint(world, {
    type: 'revolute',
    body1,
    body2,
    anchor1,
    anchor2,
    axis,
    limits,
  })
}

export function createSpringJoint(
  world: World,
  body1: RigidBody,
  body2: RigidBody,
  restLength: number,
  stiffness: number,
  damping: number,
  anchor1: [number, number, number] = [0, 0, 0],
  anchor2: [number, number, number] = [0, 0, 0]
): ImpulseJoint {
  return createJoint(world, {
    type: 'spring',
    body1,
    body2,
    anchor1,
    anchor2,
    restLength,
    stiffness,
    damping,
  })
}

export function createRopeJoint(
  world: World,
  body1: RigidBody,
  body2: RigidBody,
  maxDistance: number,
  anchor1: [number, number, number] = [0, 0, 0],
  anchor2: [number, number, number] = [0, 0, 0]
): ImpulseJoint {
  return createJoint(world, {
    type: 'rope',
    body1,
    body2,
    anchor1,
    anchor2,
    maxDistance,
  })
}

export function createMotorJoint(
  world: World,
  body1: RigidBody,
  body2: RigidBody,
  anchor1: [number, number, number] = [0, 0, 0],
  anchor2: [number, number, number] = [0, 0, 0],
  axis: [number, number, number] = [0, 1, 0],
  targetVelocity = 1,
  maxMotorForce = 10
): ImpulseJoint {
  return createJoint(world, {
    type: 'motor',
    body1,
    body2,
    anchor1,
    anchor2,
    axis,
    targetVelocity,
    maxMotorForce,
  })
}
