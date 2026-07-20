import * as THREE from 'three'

export type ParticleBoundary = 'box' | 'cylinder' | 'sphere'

export interface ParticleSystemConfig {
  count: number
  boundary: ParticleBoundary
  /** Dimensions of the container: [halfX, halfY, halfZ] for box, [radius, height, _] for cylinder, [radius, _, _] for sphere */
  bounds: [number, number, number]
  initialSpeed: number
  mass: number
  radius: number
  /** Damping factor per second (0 = no damping, 1 = full stop). Default: 0 */
  damping?: number
  /** Gravity acceleration. Default: [0, 0, 0] */
  gravity?: [number, number, number]
  /** Restitution for wall collisions. Default: 1.0 (perfectly elastic) */
  restitution?: number
  /** Enable particle-particle collision. Default: false (expensive for large N) */
  particleCollisions?: boolean
  /** Spatial hash cell size for collision optimization. Default: 2x particle radius */
  spatialHashCellSize?: number
  seed?: number
}

interface Particle {
  px: number
  py: number
  pz: number
  vx: number
  vy: number
  vz: number
  mass: number
  radius: number
  alive: boolean
}

const DEFAULT_SEED = 12345

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class ParticleSystem {
  private config: ParticleSystemConfig
  private particles: Particle[]
  private rng: () => number
  private dummy: THREE.Object3D
  private boundsObj: THREE.Box3
  private spatialHashCellSize: number

  constructor(config: ParticleSystemConfig) {
    this.config = {
      damping: 0,
      gravity: [0, 0, 0],
      restitution: 1.0,
      particleCollisions: false,
      spatialHashCellSize: config.radius * 2,
      ...config,
    }
    this.spatialHashCellSize = this.config.spatialHashCellSize ?? config.radius * 2
    this.particles = []
    this.rng = mulberry32(this.config.seed ?? DEFAULT_SEED)
    this.dummy = new THREE.Object3D()
    this.boundsObj = new THREE.Box3()
    this.initialize()
  }

  private initialize(): void {
    const { count, bounds, initialSpeed, mass, radius } = this.config
    const [hx, hy, hz] = bounds

    for (let i = 0; i < count; i++) {
      let x: number, y: number, z: number
      if (this.config.boundary === 'box') {
        x = (this.rng() - 0.5) * 2 * (hx - radius)
        y = (this.rng() - 0.5) * 2 * (hy - radius)
        z = (this.rng() - 0.5) * 2 * (hz - radius)
      } else if (this.config.boundary === 'cylinder') {
        const cylRadius = hx - radius
        const angle = this.rng() * Math.PI * 2
        const r = Math.sqrt(this.rng()) * cylRadius
        x = r * Math.cos(angle)
        z = r * Math.sin(angle)
        y = (this.rng() - 0.5) * 2 * (hy - radius)
      } else {
        const sphRadius = hx - radius
        const theta = this.rng() * Math.PI * 2
        const phi = Math.acos(2 * this.rng() - 1)
        x = sphRadius * Math.sin(phi) * Math.cos(theta)
        y = sphRadius * Math.sin(phi) * Math.sin(theta)
        z = sphRadius * Math.cos(phi)
      }

      const speed = initialSpeed * (0.5 + this.rng())
      const theta = this.rng() * Math.PI * 2
      const phi = Math.acos(2 * this.rng() - 1)

      this.particles.push({
        px: x,
        py: y,
        pz: z,
        vx: speed * Math.sin(phi) * Math.cos(theta),
        vy: speed * Math.sin(phi) * Math.sin(theta),
        vz: speed * Math.cos(phi),
        mass,
        radius,
        alive: true,
      })
    }
  }

  update(delta: number): void {
    const dt = Math.min(delta, 1 / 30)
    const damping = this.config.damping ?? 0
    const gravity = this.config.gravity ?? [0, 0, 0]
    const dampingFactor = Math.exp(-damping * dt)
    const restitution = this.config.restitution ?? 1.0

    for (const p of this.particles) {
      if (!p.alive) continue

      p.vx += gravity[0] * dt
      p.vy += gravity[1] * dt
      p.vz += gravity[2] * dt

      p.vx *= dampingFactor
      p.vy *= dampingFactor
      p.vz *= dampingFactor

      p.px += p.vx * dt
      p.py += p.vy * dt
      p.pz += p.vz * dt

      this.handleBoundaryCollision(p, restitution)
    }

    if (this.config.particleCollisions) {
      this.handleParticleCollisions()
    }
  }

  private handleBoundaryCollision(p: Particle, restitution: number): void {
    const [hx, hy, hz] = this.config.bounds
    const r = p.radius

    if (this.config.boundary === 'box') {
      if (p.px < -hx + r) {
        p.px = -hx + r
        p.vx = Math.abs(p.vx) * restitution
      } else if (p.px > hx - r) {
        p.px = hx - r
        p.vx = -Math.abs(p.vx) * restitution
      }
      if (p.py < -hy + r) {
        p.py = -hy + r
        p.vy = Math.abs(p.vy) * restitution
      } else if (p.py > hy - r) {
        p.py = hy - r
        p.vy = -Math.abs(p.vy) * restitution
      }
      if (p.pz < -hz + r) {
        p.pz = -hz + r
        p.vz = Math.abs(p.vz) * restitution
      } else if (p.pz > hz - r) {
        p.pz = hz - r
        p.vz = -Math.abs(p.vz) * restitution
      }
    } else if (this.config.boundary === 'cylinder') {
      const cylRadius = hx
      const distSq = p.px * p.px + p.pz * p.pz
      const maxR = cylRadius - r
      if (distSq > maxR * maxR) {
        const dist = Math.sqrt(distSq)
        const nx = p.px / dist
        const nz = p.pz / dist
        p.px = nx * maxR
        p.pz = nz * maxR
        const dot = p.vx * nx + p.vz * nz
        p.vx = (p.vx - 2 * dot * nx) * restitution
        p.vz = (p.vz - 2 * dot * nz) * restitution
      }
      if (p.py < -hy + r) {
        p.py = -hy + r
        p.vy = Math.abs(p.vy) * restitution
      } else if (p.py > hy - r) {
        p.py = hy - r
        p.vy = -Math.abs(p.vy) * restitution
      }
    } else {
      const sphRadius = hx
      const distSq = p.px * p.px + p.py * p.py + p.pz * p.pz
      const maxR = sphRadius - r
      if (distSq > maxR * maxR) {
        const dist = Math.sqrt(distSq)
        const nx = p.px / dist
        const ny = p.py / dist
        const nz = p.pz / dist
        p.px = nx * maxR
        p.py = ny * maxR
        p.pz = nz * maxR
        const dot = p.vx * nx + p.vy * ny + p.vz * nz
        p.vx = (p.vx - 2 * dot * nx) * restitution
        p.vy = (p.vy - 2 * dot * ny) * restitution
        p.vz = (p.vz - 2 * dot * nz) * restitution
      }
    }
  }

  private handleParticleCollisions(): void {
    const particles = this.particles
    const cellSize = this.spatialHashCellSize
    
    // Build spatial hash grid
    const spatialHash = new Map<string, number[]>()
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      if (!p.alive) continue
      
      const cellX = Math.floor(p.px / cellSize)
      const cellY = Math.floor(p.py / cellSize)
      const cellZ = Math.floor(p.pz / cellSize)
      const key = `${cellX},${cellY},${cellZ}`
      
      if (!spatialHash.has(key)) {
        spatialHash.set(key, [])
      }
      spatialHash.get(key)!.push(i)
    }
    
    // Check collisions only within neighboring cells
    for (const [key, indices] of spatialHash) {
      const [cellX, cellY, cellZ] = key.split(',').map(Number)
      
      // Check current cell and all 26 neighboring cells
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dz = -1; dz <= 1; dz++) {
            const neighborKey = `${cellX + dx},${cellY + dy},${cellZ + dz}`
            const neighborIndices = spatialHash.get(neighborKey)
            if (!neighborIndices) continue
            
            for (const i of indices) {
              const a = particles[i]
              if (!a.alive) continue
              
              for (const j of neighborIndices) {
                if (i >= j) continue // Avoid duplicate checks and self-checks
                const b = particles[j]
                if (!b.alive) continue

                const pdx = b.px - a.px
                const pdy = b.py - a.py
                const pdz = b.pz - a.pz
                const distSq = pdx * pdx + pdy * pdy + pdz * pdz
                const minDist = a.radius + b.radius

                if (distSq < minDist * minDist && distSq > 1e-10) {
                  const dist = Math.sqrt(distSq)
                  const nx = pdx / dist
                  const ny = pdy / dist
                  const nz = pdz / dist

                  const overlap = minDist - dist
                  const totalMass = a.mass + b.mass
                  const aRatio = b.mass / totalMass
                  const bRatio = a.mass / totalMass

                  a.px -= nx * overlap * aRatio
                  a.py -= ny * overlap * aRatio
                  a.pz -= nz * overlap * aRatio
                  b.px += nx * overlap * bRatio
                  b.py += ny * overlap * bRatio
                  b.pz += nz * overlap * bRatio

                  const rvx = b.vx - a.vx
                  const rvy = b.vy - a.vy
                  const rvz = b.vz - a.vz
                  const velAlongNormal = rvx * nx + rvy * ny + rvz * nz

                  if (velAlongNormal > 0) continue

                  const restitution = this.config.restitution ?? 1.0
                  const impulse = (-(1 + restitution) * velAlongNormal) / (1 / a.mass + 1 / b.mass)

                  a.vx -= (impulse * nx) / a.mass
                  a.vy -= (impulse * ny) / a.mass
                  a.vz -= (impulse * nz) / a.mass
                  b.vx += (impulse * nx) / b.mass
                  b.vy += (impulse * ny) / b.mass
                  b.vz += (impulse * nz) / b.mass
                }
              }
            }
          }
        }
      }
    }
  }

  applyToInstancedMesh(mesh: THREE.InstancedMesh): void {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]
      this.dummy.position.set(p.px, p.py, p.pz)
      this.dummy.scale.setScalar(p.alive ? 1 : 0)
      this.dummy.updateMatrix()
      mesh.setMatrixAt(i, this.dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }

  getParticle(index: number): {
    position: [number, number, number]
    velocity: [number, number, number]
  } | null {
    const p = this.particles[index]
    if (!p) return null
    return {
      position: [p.px, p.py, p.pz],
      velocity: [p.vx, p.vy, p.vz],
    }
  }

  setParticleVelocity(index: number, vx: number, vy: number, vz: number): void {
    const p = this.particles[index]
    if (p) {
      p.vx = vx
      p.vy = vy
      p.vz = vz
    }
  }

  killParticle(index: number): void {
    const p = this.particles[index]
    if (p) p.alive = false
  }

  reviveParticle(index: number): void {
    const p = this.particles[index]
    if (p) p.alive = true
  }

  get count(): number {
    return this.particles.length
  }

  get aliveCount(): number {
    return this.particles.filter((p) => p.alive).length
  }

  get bounds(): THREE.Box3 {
    const [hx, hy, hz] = this.config.bounds
    this.boundsObj.min.set(-hx, -hy, -hz)
    this.boundsObj.max.set(hx, hy, hz)
    return this.boundsObj
  }

  dispose(): void {
    this.particles.length = 0
  }
}
