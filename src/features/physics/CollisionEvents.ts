import RAPIER from '@dimforge/rapier3d'
import type {
  World,
  EventQueue,
  Collider,
  ColliderHandle,
  TempContactForceEvent,
} from '@dimforge/rapier3d'

export type CollisionEventType = 'start' | 'stop'

export interface CollisionEventData {
  type: CollisionEventType
  collider1Handle: ColliderHandle
  collider2Handle: ColliderHandle
  collider1: Collider | null
  collider2: Collider | null
}

type CollisionCallback = (event: CollisionEventData) => void
type ContactForceCallback = (force: number) => void

export class CollisionEventSystem {
  private world: World
  private eventQueue: EventQueue
  private startCallbacks: Set<CollisionCallback> = new Set()
  private stopCallbacks: Set<CollisionCallback> = new Set()
  private contactForceCallbacks: Map<ColliderHandle, ContactForceCallback> = new Map()

  constructor(world: World, eventQueue: EventQueue) {
    this.world = world
    this.eventQueue = eventQueue
  }

  beforeStep(): void {
    // Reset per-step state if needed
  }

  afterStep(): void {
    this.eventQueue.drainContactForceEvents((event: TempContactForceEvent) => {
      const handle1 = event.collider1()
      const handle2 = event.collider2()
      const force = event.totalForceMagnitude()

      const cb1 = this.contactForceCallbacks.get(handle1)
      if (cb1) cb1(force)

      const cb2 = this.contactForceCallbacks.get(handle2)
      if (cb2) cb2(force)
    })

    this.eventQueue.drainCollisionEvents((handle1, handle2, started) => {
      const collider1 = this.safeGetCollider(handle1)
      const collider2 = this.safeGetCollider(handle2)
      const data: CollisionEventData = {
        type: started ? 'start' : 'stop',
        collider1Handle: handle1,
        collider2Handle: handle2,
        collider1,
        collider2,
      }
      const callbacks = started ? this.startCallbacks : this.stopCallbacks
      callbacks.forEach((cb) => cb(data))
    })
  }

  onCollisionStart(callback: CollisionCallback): () => void {
    this.startCallbacks.add(callback)
    return () => this.startCallbacks.delete(callback)
  }

  onCollisionStop(callback: CollisionCallback): () => void {
    this.stopCallbacks.add(callback)
    return () => this.stopCallbacks.delete(callback)
  }

  onContactForce(colliderHandle: ColliderHandle, callback: ContactForceCallback): () => void {
    this.contactForceCallbacks.set(colliderHandle, callback)
    return () => this.contactForceCallbacks.delete(colliderHandle)
  }

  enableCollisionEvents(collider: Collider): void {
    collider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)
  }

  enableContactForceEvents(collider: Collider, threshold: number = 0): void {
    collider.setActiveEvents(
      RAPIER.ActiveEvents.COLLISION_EVENTS | RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS
    )
    collider.setContactForceEventThreshold(threshold)
  }

  private safeGetCollider(handle: ColliderHandle): Collider | null {
    try {
      return this.world.getCollider(handle)
    } catch {
      return null
    }
  }
}
