// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import { PhysicsWorld } from '../PhysicsWorld'
import { createRigidBody } from '../RigidBodyFactory'
import type { RigidBodyDef } from '@/shared/types/physics'

describe('PhysicsWorld', () => {
  let world: PhysicsWorld

  beforeEach(() => {
    world = new PhysicsWorld()
  })

  it('should initialize with default config', () => {
    expect(world.isReady).toBe(true)
    expect(world.bodyCount).toBe(0)
    expect(world.jointCount).toBe(0)
  })

  it('should set gravity', () => {
    world.setGravity(0, -3.71, 0)
    expect(world.world.gravity).toEqual({ x: 0, y: -3.71, z: 0 })
  })

  it('should add and retrieve a body', () => {
    const def: RigidBodyDef = {
      type: 'dynamic',
      shape: 'sphere',
      dimensions: [0.5, 0, 0],
      position: [0, 1, 0],
      label: 'sphere',
    }
    const record = world.addBody('sphere', def)
    expect(record.label).toBe('sphere')
    expect(world.getBody('sphere')).toBe(record)
    expect(world.bodyCount).toBe(1)
  })

  it('should remove a body', () => {
    const def: RigidBodyDef = {
      type: 'dynamic',
      shape: 'box',
      dimensions: [0.5, 0.5, 0.5],
      position: [0, 1, 0],
    }
    world.addBody('box', def)
    expect(world.bodyCount).toBe(1)
    world.removeBody('box')
    expect(world.bodyCount).toBe(0)
    expect(world.getBody('box')).toBeUndefined()
  })

  it('should step the simulation', () => {
    const def: RigidBodyDef = {
      type: 'dynamic',
      shape: 'sphere',
      dimensions: [0.5, 0, 0],
      position: [0, 10, 0],
    }
    world.addBody('falling', def)
    const initialY = world.getBody('falling')!.rigidBody.translation().y

    for (let i = 0; i < 60; i += 1) {
      world.step()
    }

    const finalY = world.getBody('falling')!.rigidBody.translation().y
    expect(finalY).toBeLessThan(initialY)
  })

  it('should apply global contact material defaults', () => {
    const custom = new PhysicsWorld({
      contactMaterial: { friction: 0.1, restitution: 0.9 },
    })
    const def: RigidBodyDef = {
      type: 'dynamic',
      shape: 'sphere',
      dimensions: [0.5, 0, 0],
      position: [0, 1, 0],
    }
    const record = custom.addBody('bouncy', def)
    expect(record.collider.friction()).toBeCloseTo(0.1)
    expect(record.collider.restitution()).toBeCloseTo(0.9)
    custom.dispose()
  })
})

describe('RigidBodyFactory', () => {
  it('should create a rigid body and collider', () => {
    const world = new PhysicsWorld()
    const def: RigidBodyDef = {
      type: 'dynamic',
      shape: 'box',
      dimensions: [1, 1, 1],
      position: [0, 2, 0],
      friction: 0.2,
      restitution: 0.4,
    }
    const record = createRigidBody(world.world, def)
    expect(record.rigidBody).toBeDefined()
    expect(record.collider).toBeDefined()
    expect(record.collider.friction()).toBeCloseTo(0.2)
    expect(record.collider.restitution()).toBeCloseTo(0.4)
    world.dispose()
  })
})
