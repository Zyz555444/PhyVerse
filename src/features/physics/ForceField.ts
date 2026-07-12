import type { RigidBody } from '@dimforge/rapier3d'
import type { ForceField, ForceFieldType } from '@/shared/types/physics'

export type { ForceField, ForceFieldType }

export interface ElectricFieldParams {
  strength: [number, number, number]
  charge: number
}

export interface MagneticFieldParams {
  field: [number, number, number]
  charge: number
}

export interface GravitationalFieldParams {
  sourceMass: number
  G: number
  sourcePosition: [number, number, number]
  targetMass: number
}

export function createElectricField(params: ElectricFieldParams): ForceField {
  return {
    type: 'electric',
    apply: (_target: RigidBody, _time: number): [number, number, number] => {
      const [ex, ey, ez] = params.strength
      const q = params.charge
      return [q * ex, q * ey, q * ez]
    },
  }
}

export function createMagneticField(params: MagneticFieldParams): ForceField {
  return {
    type: 'magnetic',
    apply: (target: RigidBody, _time: number): [number, number, number] => {
      const vel = target.linvel()
      const [bx, by, bz] = params.field
      const q = params.charge

      const fx = q * (vel.y * bz - vel.z * by)
      const fy = q * (vel.z * bx - vel.x * bz)
      const fz = q * (vel.x * by - vel.y * bx)

      return [fx, fy, fz]
    },
  }
}

export function createGravitationalField(params: GravitationalFieldParams): ForceField {
  return {
    type: 'gravitational',
    apply: (target: RigidBody, _time: number): [number, number, number] => {
      const pos = target.translation()
      const dx = params.sourcePosition[0] - pos.x
      const dy = params.sourcePosition[1] - pos.y
      const dz = params.sourcePosition[2] - pos.z
      const distSq = dx * dx + dy * dy + dz * dz
      if (distSq < 0.0001) {
        return [0, 0, 0]
      }
      const dist = Math.sqrt(distSq)
      const force = (params.G * params.sourceMass * params.targetMass) / distSq
      return [(force * dx) / dist, (force * dy) / dist, (force * dz) / dist]
    },
  }
}

export function createCustomForceField(
  applyFn: (target: RigidBody, time: number) => [number, number, number]
): ForceField {
  return {
    type: 'custom',
    apply: applyFn,
  }
}

export class ForceFieldManager {
  private fields: Map<string, ForceField> = new Map()
  private targets: Map<string, RigidBody[]> = new Map()

  addField(name: string, field: ForceField, targets: RigidBody[] = []): void {
    this.fields.set(name, field)
    this.targets.set(name, targets)
  }

  removeField(name: string): void {
    this.fields.delete(name)
    this.targets.delete(name)
  }

  getField(name: string): ForceField | undefined {
    return this.fields.get(name)
  }

  setTargets(name: string, targets: RigidBody[]): void {
    this.targets.set(name, targets)
  }

  applyAll(time: number): void {
    for (const [name, field] of this.fields) {
      const targets = this.targets.get(name)
      if (!targets) continue
      for (const target of targets) {
        const [fx, fy, fz] = field.apply(target, time)
        target.addForce({ x: fx, y: fy, z: fz }, true)
      }
    }
  }

  clear(): void {
    this.fields.clear()
    this.targets.clear()
  }
}
