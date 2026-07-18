import { describe, it, expect, vi } from 'vitest'
import type { RigidBody } from '@dimforge/rapier3d'
import {
  createElectricField,
  createMagneticField,
  createGravitationalField,
  createCustomForceField,
  ForceFieldManager,
} from '../ForceField'

interface MockBody {
  linvel: () => { x: number; y: number; z: number }
  translation: () => { x: number; y: number; z: number }
  addForce: ReturnType<typeof vi.fn>
}

function makeBody(
  vel: [number, number, number] = [0, 0, 0],
  pos: [number, number, number] = [0, 0, 0]
): MockBody {
  return {
    linvel: () => ({ x: vel[0], y: vel[1], z: vel[2] }),
    translation: () => ({ x: pos[0], y: pos[1], z: pos[2] }),
    addForce: vi.fn(),
  }
}

const asBody = (b: MockBody) => b as unknown as RigidBody

describe('createElectricField', () => {
  it('computes F = qE independent of position and velocity', () => {
    const field = createElectricField({ strength: [2, -3, 4], charge: 5 })
    expect(field.type).toBe('electric')
    expect(field.apply(asBody(makeBody([9, 9, 9])), 0)).toEqual([10, -15, 20])
  })

  it('returns zero force for a neutral charge', () => {
    const field = createElectricField({ strength: [1, 1, 1], charge: 0 })
    expect(field.apply(asBody(makeBody()), 0)).toEqual([0, 0, 0])
  })
})

describe('createMagneticField', () => {
  it('computes the Lorentz force F = q(v x B)', () => {
    // v = (1,0,0), B = (0,0,1) -> v x B = (0*1-0*0, 0*0-1*1, 1*0-0*0) = (0,-1,0)
    const field = createMagneticField({ field: [0, 0, 1], charge: 2 })
    expect(field.type).toBe('magnetic')
    expect(field.apply(asBody(makeBody([1, 0, 0])), 0)).toEqual([0, -2, 0])
  })

  it('produces zero force when velocity is parallel to the field', () => {
    const field = createMagneticField({ field: [0, 1, 0], charge: 3 })
    expect(field.apply(asBody(makeBody([0, 2, 0])), 0)).toEqual([0, 0, 0])
  })
})

describe('createGravitationalField', () => {
  it('pulls the target toward the source with F = G*m1*m2/r^2', () => {
    const field = createGravitationalField({
      sourceMass: 10,
      G: 1,
      sourcePosition: [5, 0, 0],
      targetMass: 2,
    })
    // target at origin, source at (5,0,0): r=5, F = 1*10*2/25 = 0.8 along +x
    const [fx, fy, fz] = field.apply(asBody(makeBody([0, 0, 0], [0, 0, 0])), 0)
    expect(fx).toBeCloseTo(0.8)
    expect(fy).toBeCloseTo(0)
    expect(fz).toBeCloseTo(0)
  })

  it('returns zero force when the target is at the source (singularity guard)', () => {
    const field = createGravitationalField({
      sourceMass: 10,
      G: 1,
      sourcePosition: [0, 0, 0],
      targetMass: 2,
    })
    expect(field.apply(asBody(makeBody([0, 0, 0], [0, 0, 0])), 0)).toEqual([0, 0, 0])
  })
})

describe('createCustomForceField', () => {
  it('delegates to the provided function and passes time', () => {
    const field = createCustomForceField((_t, time) => [time, 0, 0])
    expect(field.type).toBe('custom')
    expect(field.apply(asBody(makeBody()), 7)).toEqual([7, 0, 0])
  })
})

describe('ForceFieldManager', () => {
  it('adds, retrieves and removes fields', () => {
    const manager = new ForceFieldManager()
    const field = createElectricField({ strength: [1, 0, 0], charge: 1 })
    manager.addField('e', field)
    expect(manager.getField('e')).toBe(field)

    manager.removeField('e')
    expect(manager.getField('e')).toBeUndefined()
  })

  it('applies each field force to all of its targets', () => {
    const manager = new ForceFieldManager()
    const bodyA = makeBody()
    const bodyB = makeBody()
    manager.addField('e', createElectricField({ strength: [1, 2, 3], charge: 1 }), [
      asBody(bodyA),
      asBody(bodyB),
    ])

    manager.applyAll(0)

    expect(bodyA.addForce).toHaveBeenCalledWith({ x: 1, y: 2, z: 3 }, true)
    expect(bodyB.addForce).toHaveBeenCalledWith({ x: 1, y: 2, z: 3 }, true)
  })

  it('updates targets via setTargets', () => {
    const manager = new ForceFieldManager()
    const body = makeBody()
    manager.addField('e', createElectricField({ strength: [0, 1, 0], charge: 2 }))
    manager.setTargets('e', [asBody(body)])

    manager.applyAll(0)
    expect(body.addForce).toHaveBeenCalledWith({ x: 0, y: 2, z: 0 }, true)
  })

  it('clears all fields and targets', () => {
    const manager = new ForceFieldManager()
    manager.addField('e', createElectricField({ strength: [1, 0, 0], charge: 1 }))
    manager.clear()
    expect(manager.getField('e')).toBeUndefined()
  })
})
