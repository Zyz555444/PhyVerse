import RAPIER from '@dimforge/rapier3d'
import type { World, RigidBody, Collider, ColliderDesc, RigidBodyDesc } from '@dimforge/rapier3d'
import type { RigidBodyDef, PhysicsBodyRecord } from '@/shared/types/physics'

function createBodyDesc(type: RigidBodyDef['type']): RigidBodyDesc {
  switch (type) {
    case 'dynamic':
      return RAPIER.RigidBodyDesc.dynamic()
    case 'static':
      return RAPIER.RigidBodyDesc.fixed()
    case 'kinematic':
      return RAPIER.RigidBodyDesc.kinematicPositionBased()
    default:
      return RAPIER.RigidBodyDesc.dynamic()
  }
}

function createColliderDesc(def: RigidBodyDef): ColliderDesc {
  const [hx, hy, hz] = def.dimensions
  const { shape } = def

  let colliderDesc: ColliderDesc

  switch (shape) {
    case 'box':
      colliderDesc = RAPIER.ColliderDesc.cuboid(hx, hy, hz)
      break
    case 'sphere':
      colliderDesc = RAPIER.ColliderDesc.ball(hx)
      break
    case 'cylinder':
      colliderDesc = RAPIER.ColliderDesc.cylinder(hy, hx)
      break
    case 'capsule':
      colliderDesc = RAPIER.ColliderDesc.capsule(hy, hx)
      break
    case 'cone':
      colliderDesc = RAPIER.ColliderDesc.cone(hy, hx)
      break
    case 'plane':
      colliderDesc = RAPIER.ColliderDesc.cuboid(hx, 0.001, hz)
      break
    case 'trimesh':
      throw new Error('Trimesh shape requires vertices/indices — use createTrimeshCollider')
    default:
      colliderDesc = RAPIER.ColliderDesc.cuboid(hx, hy, hz)
  }

  if (def.friction !== undefined) {
    colliderDesc.setFriction(def.friction)
  }
  if (def.restitution !== undefined) {
    colliderDesc.setRestitution(def.restitution)
  }
  if (def.mass !== undefined && def.mass > 0) {
    colliderDesc.setMass(def.mass)
  } else {
    colliderDesc.setDensity(1.0)
  }

  return colliderDesc
}

export function createRigidBody(world: World, def: RigidBodyDef): PhysicsBodyRecord {
  const bodyDesc: RigidBodyDesc = createBodyDesc(def.type)

  bodyDesc.setTranslation(def.position[0], def.position[1], def.position[2])

  if (def.rotation) {
    bodyDesc.setRotation({
      x: def.rotation[0],
      y: def.rotation[1],
      z: def.rotation[2],
      w: def.rotation[3],
    })
  }

  if (def.linearDamping !== undefined) {
    bodyDesc.setLinearDamping(def.linearDamping)
  }
  if (def.angularDamping !== undefined) {
    bodyDesc.setAngularDamping(def.angularDamping)
  }

  if (def.type === 'dynamic' && def.mass === 0) {
    bodyDesc.setCanSleep(true)
  }

  const rigidBody: RigidBody = world.createRigidBody(bodyDesc)

  const colliderDesc = createColliderDesc(def)
  const collider: Collider = world.createCollider(colliderDesc, rigidBody)

  if (def.label) {
    rigidBody.userData = { label: def.label }
  }

  return {
    label: def.label ?? '',
    rigidBody,
    collider,
  }
}

export function createTrimeshCollider(
  world: World,
  rigidBody: RigidBody,
  vertices: Float32Array,
  indices: Uint32Array
): Collider {
  const colliderDesc = RAPIER.ColliderDesc.trimesh(vertices, indices)
  return world.createCollider(colliderDesc, rigidBody)
}

export function createStaticPlane(
  world: World,
  position: [number, number, number] = [0, 0, 0],
  size: [number, number] = [50, 50]
): PhysicsBodyRecord {
  return createRigidBody(world, {
    type: 'static',
    shape: 'plane',
    dimensions: [size[0] / 2, 0, size[1] / 2],
    position,
    friction: 0.5,
    restitution: 0.3,
    label: 'ground',
  })
}
