export interface Particle {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  life: number
  maxLife: number
  size: number
  r: number
  g: number
  b: number
}

const MAX_PARTICLES = 600

/**
 * Lightweight particle manager for sandbox visual effects.
 * Supports burst spawns (collision sparks) and continuous trails.
 */
export class ParticleManager {
  private particles: Particle[] = []
  private rng = () => Math.random()
  private gravity = -2.0

  /** Spawn a burst of particles at a point (for collisions, impacts) */
  spawnBurst(
    x: number,
    y: number,
    z: number,
    count: number,
    options?: {
      speed?: number
      lifetime?: number
      size?: number
      color?: [number, number, number]
      /** Spread angle in radians (default ~PI → omnidirectional) */
      spreadAngle?: number
      /** Direction constraint for directed bursts. If set, particles are within spreadAngle of this direction. */
      direction?: { x: number; y: number; z: number }
    }
  ): void {
    const speed = options?.speed ?? 2.0
    const lifetime = options?.lifetime ?? 0.5
    const size = options?.size ?? 0.04
    const color = options?.color ?? [1.0, 0.8, 0.2] // warm yellow-orange
    const spread = options?.spreadAngle ?? Math.PI

    for (let i = 0; i < count; i++) {
      let vx: number, vy: number, vz: number
      if (options?.direction) {
        // Cone spread around a direction
        const s = speed * (0.3 + this.rng() * 0.7)
        const theta = this.rng() * Math.PI * 2
        const phi = this.rng() * spread * 0.5
        const r = Math.sin(phi)
        const cosPhi = Math.cos(phi)
        vx = s * (options.direction.x * cosPhi + r * Math.cos(theta))
        vy = s * (options.direction.y * cosPhi + r * Math.sin(theta))
        vz = s * (options.direction.z * cosPhi + r * Math.cos(theta + 1))
      } else {
        // Omnidirectional
        const theta = this.rng() * Math.PI * 2
        const phi = Math.acos(2 * this.rng() - 1)
        const s = speed * (0.3 + this.rng() * 0.7)
        vx = s * Math.sin(phi) * Math.cos(theta)
        vy = s * Math.sin(phi) * Math.sin(theta)
        vz = s * Math.cos(phi)
      }

      this.addParticle(x, y, z, vx, vy, vz, lifetime, size, ...color)
    }
  }

  /** Spawn a single trail particle behind a moving object */
  spawnTrail(
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    options?: {
      lifetime?: number
      size?: number
      color?: [number, number, number]
    }
  ): void {
    const lifetime = options?.lifetime ?? 0.25
    const size = options?.size ?? 0.03
    const color = options?.color ?? [0.39, 0.55, 0.91] // soft blue

    const jitter = 0.15
    this.addParticle(
      x + (this.rng() - 0.5) * jitter,
      y + (this.rng() - 0.5) * jitter,
      z + (this.rng() - 0.5) * jitter,
      vx * (0.1 + this.rng() * 0.2),
      vy * (0.1 + this.rng() * 0.2),
      vz * (0.1 + this.rng() * 0.2),
      lifetime,
      size,
      ...color
    )
  }

  private addParticle(
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    maxLife: number,
    size: number,
    r: number,
    g: number,
    b: number
  ): void {
    // Reuse dead particles or push new
    let p: Particle | undefined
    for (const existing of this.particles) {
      if (existing.life <= 0) {
        p = existing
        break
      }
    }

    if (p) {
      p.x = x
      p.y = y
      p.z = z
      p.vx = vx
      p.vy = vy
      p.vz = vz
      p.life = maxLife
      p.maxLife = maxLife
      p.size = size
      p.r = r
      p.g = g
      p.b = b
    } else if (this.particles.length < MAX_PARTICLES) {
      this.particles.push({
        x, y, z, vx, vy, vz,
        life: maxLife,
        maxLife,
        size,
        r, g, b,
      })
    }
  }

  /** Update all particles. Returns number of alive particles. */
  update(dt: number): number {
    let alive = 0
    for (const p of this.particles) {
      if (p.life <= 0) continue
      p.life -= dt
      if (p.life <= 0) continue

      p.vy += this.gravity * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.z += p.vz * dt

      alive++
    }
    return alive
  }

  /** Get particles as flat arrays for instanced rendering */
  getRenderData(): {
    positions: Float32Array
    scales: Float32Array
    colors: Float32Array
    count: number
  } {
    const alive = this.particles.filter((p) => p.life > 0)
    const positions = new Float32Array(alive.length * 3)
    const scales = new Float32Array(alive.length)
    const colors = new Float32Array(alive.length * 3)

    for (let i = 0; i < alive.length; i++) {
      const p = alive[i]
      const ti = i * 3
      positions[ti] = p.x
      positions[ti + 1] = p.y
      positions[ti + 2] = p.z

      // Fade out: size shrinks as life decays
      const lifeRatio = Math.max(0, p.life / p.maxLife)
      scales[i] = p.size * lifeRatio

      // Fade color to dark as particle dies
      colors[ti] = p.r * lifeRatio
      colors[ti + 1] = p.g * lifeRatio
      colors[ti + 2] = p.b * lifeRatio
    }

    return { positions, scales, colors, count: alive.length }
  }

  get aliveCount(): number {
    return this.particles.filter((p) => p.life > 0).length
  }

  clear(): void {
    this.particles.length = 0
  }
}
