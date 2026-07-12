import type { RigidBody, World, Collider, ImpulseJoint } from '@dimforge/rapier3d'

export type RigidBodyType = 'dynamic' | 'static' | 'kinematic'

export type ShapeType = 'box' | 'sphere' | 'cylinder' | 'capsule' | 'cone' | 'trimesh' | 'plane'

export interface PhysicsWorldConfig {
  gravity: [number, number, number]
  timestep: number
  maxSubSteps: number
  allowSleep: boolean
  contactMaterial: {
    friction: number
    restitution: number
  }
}

export interface RigidBodyDef {
  type: RigidBodyType
  shape: ShapeType
  dimensions: [number, number, number]
  position: [number, number, number]
  rotation?: [number, number, number, number]
  mass?: number
  friction?: number
  restitution?: number
  linearDamping?: number
  angularDamping?: number
  label?: string
}

export interface PhysicsBodyRecord {
  label: string
  rigidBody: RigidBody
  collider: Collider
}

export interface PhysicsWorld {
  world: World
  step: () => void
  addBody: (label: string, def: RigidBodyDef) => PhysicsBodyRecord
  removeBody: (label: string) => void
  addJoint: (label: string, joint: ImpulseJoint) => void
  removeJoint: (label: string) => void
  getBody: (label: string) => PhysicsBodyRecord | undefined
  dispose: () => void
}

export interface PhysicsState {
  world: World | null
  bodies: Map<string, PhysicsBodyRecord>
  joints: Map<string, ImpulseJoint>
  isReady: boolean
}

export type ForceFieldType = 'electric' | 'magnetic' | 'gravitational' | 'custom'

export interface ForceField {
  type: ForceFieldType
  apply: (target: RigidBody, time: number) => [number, number, number]
}

export interface DataPoint {
  time: number
  values: Record<string, number>
}
