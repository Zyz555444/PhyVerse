import RAPIER from '@dimforge/rapier3d'
import type { World, ImpulseJoint, EventQueue } from '@dimforge/rapier3d'
import type { PhysicsWorldConfig, RigidBodyDef, PhysicsBodyRecord } from '@/shared/types/physics'
import { createRigidBody } from './RigidBodyFactory'
import { CollisionEventSystem } from './CollisionEvents'

export class PhysicsWorld {
  readonly world: World
  readonly eventQueue: EventQueue
  readonly collisionEvents: CollisionEventSystem
  private bodies: Map<string, PhysicsBodyRecord> = new Map()
  private joints: Map<string, ImpulseJoint> = new Map()
  private config: PhysicsWorldConfig
  private isInitialized: boolean = false

  constructor(config?: Partial<PhysicsWorldConfig>) {
    this.config = {
      gravity: [0, -9.81, 0],
      timestep: 1 / 60,
      maxSubSteps: 4,
      allowSleep: true,
      contactMaterial: {
        friction: 0.5,
        restitution: 0.3,
      },
      ...config,
    }

    this.world = new RAPIER.World({
      x: this.config.gravity[0],
      y: this.config.gravity[1],
      z: this.config.gravity[2],
    })

    this.world.timestep = this.config.timestep

    const integrationParams = this.world.integrationParameters
    if (this.config.allowSleep) {
      integrationParams.normalizedAllowedLinearError = 0.001
    }

    this.eventQueue = new RAPIER.EventQueue(true)
    this.collisionEvents = new CollisionEventSystem(this.world, this.eventQueue)
    this.isInitialized = true
  }

  static async init(): Promise<void> {
    // Sync WASM build: module import triggers initialization automatically
  }

  step(): void {
    if (!this.isInitialized) {
      return
    }
    this.collisionEvents.beforeStep()
    this.world.step(this.eventQueue)
    this.collisionEvents.afterStep()
  }

  addBody(label: string, def: RigidBodyDef): PhysicsBodyRecord {
    if (this.bodies.has(label)) {
      // Defensive: remove stale body instead of crashing. This can happen when
      // an experiment remounts before the previous cleanup has fully run.
      this.removeBody(label)
    }

    const mergedDef: RigidBodyDef = {
      friction: this.config.contactMaterial.friction,
      restitution: this.config.contactMaterial.restitution,
      ...def,
    }

    const record = createRigidBody(this.world, mergedDef)
    record.label = label
    this.bodies.set(label, record)
    return record
  }

  removeBody(label: string): void {
    const record = this.bodies.get(label)
    if (!record) {
      return
    }

    this.world.removeRigidBody(record.rigidBody)
    this.bodies.delete(label)
  }

  getBody(label: string): PhysicsBodyRecord | undefined {
    return this.bodies.get(label)
  }

  getAllBodies(): Map<string, PhysicsBodyRecord> {
    return this.bodies
  }

  addJoint(label: string, joint: ImpulseJoint): void {
    if (this.joints.has(label)) {
      throw new Error(`Joint with label "${label}" already exists`)
    }
    this.joints.set(label, joint)
  }

  removeJoint(label: string): void {
    const joint = this.joints.get(label)
    if (!joint) {
      return
    }
    this.world.impulseJoints.remove(joint.handle, true)
    this.joints.delete(label)
  }

  getJoint(label: string): ImpulseJoint | undefined {
    return this.joints.get(label)
  }

  setGravity(x: number, y: number, z: number): void {
    this.world.gravity = { x, y, z }
  }

  setTimestep(dt: number): void {
    this.world.timestep = dt
  }

  getTimestep(): number {
    return this.world.timestep
  }

  reset(): void {
    for (const [, joint] of this.joints) {
      this.world.impulseJoints.remove(joint.handle, true)
    }
    for (const [, record] of this.bodies) {
      this.world.removeRigidBody(record.rigidBody)
    }
    this.bodies.clear()
    this.joints.clear()
  }

  dispose(): void {
    this.reset()
    this.world.free()
    this.isInitialized = false
  }

  get isReady(): boolean {
    return this.isInitialized
  }

  get bodyCount(): number {
    return this.bodies.size
  }

  get jointCount(): number {
    return this.joints.size
  }
}
