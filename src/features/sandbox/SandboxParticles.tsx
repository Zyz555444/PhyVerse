import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { ParticleManager, type ParticleManager as IParticleManager } from './ParticleManager'
import { ParticleRenderer } from './ParticleRenderer'
import { useSandboxStore } from './sandboxStore'

// Keep a reference to the manager for external access
let _globalManager: IParticleManager | null = null

/** Get the global particle manager instance (for spawning particles from outside the canvas) */
export function getParticleManager(): IParticleManager | null {
  return _globalManager
}

/**
 * Combined particle spawner and renderer for the sandbox 3D scene.
 * - Emits trail particles behind fast-moving tracked objects
 * - Emits burst particles on collision (detected via velocity jumps)
 * - Renders all particles as instanced meshes with additive blending
 *
 * Must be placed inside a <Canvas> (R3F context).
 */
export function SandboxParticles() {
  const managerRef = useRef<IParticleManager>(new ParticleManager())
  const prevVelRef = useRef<Map<string, { vx: number; vy: number; vz: number; pos: [number, number, number] }>>(new Map())
  const trailThrottle = useRef(0)

  // Expose manager globally
  _globalManager = managerRef.current

  const trailEnabled = useMemo(() => true, [])

  useFrame((_, delta) => {
    const manager = managerRef.current
    const telemetry = useSandboxStore.getState().telemetry
    const live = telemetry.live
    const trackedId = telemetry.trackedId

    // Trail particles from tracked object
    if (trailEnabled && live && (live.speed > 0.5)) {
      trailThrottle.current += delta
      const interval = 0.03 // Emit trail particles every 30ms
      let emissionCount = 0
      while (trailThrottle.current >= interval && emissionCount < 3) {
        trailThrottle.current -= interval
        // Emit slightly behind the object (opposite velocity direction)
        const speed = live.speed || 0.001
        const nx = -live.vel[0] / speed
        const ny = -live.vel[1] / speed
        const nz = -live.vel[2] / speed

        manager.spawnTrail(
          live.pos[0] + nx * 0.3,
          live.pos[1] + ny * 0.3,
          live.pos[2] + nz * 0.3,
          live.vel[0] * 0.3,
          live.vel[1] * 0.3,
          live.vel[2] * 0.3,
          {
            lifetime: 0.3 + Math.random() * 0.3,
            size: 0.02 + Math.random() * 0.03,
            color: [0.39, 0.55, 0.91], // soft blue
          }
        )
        emissionCount++
      }
    } else if (trailThrottle.current > 0.1) {
      trailThrottle.current = 0
    }

    // Collision detection via velocity change
    if (live && trackedId) {
      const prev = prevVelRef.current.get(trackedId)
      if (prev) {
        const dvx = live.vel[0] - prev.vx
        const dvy = live.vel[1] - prev.vy
        const dvz = live.vel[2] - prev.vz
        const dv = Math.sqrt(dvx * dvx + dvy * dvy + dvz * dvz)

        // Significant velocity change suggests a collision
        if (dv > 3.0) {
          manager.spawnBurst(
            (live.pos[0] + prev.pos[0]) / 2,
            (live.pos[1] + prev.pos[1]) / 2,
            (live.pos[2] + prev.pos[2]) / 2,
            Math.min(Math.floor(dv * 2), 20),
            {
              speed: dv * 0.5,
              lifetime: 0.4,
              size: 0.03,
              color: [1.0, 0.55, 0.1], // warm orange sparks
              direction: {
                x: dvx / dv,
                y: dvy / dv,
                z: dvz / dv,
              },
              spreadAngle: Math.PI * 0.8,
            }
          )
        }
      }

      prevVelRef.current.set(trackedId, {
        vx: live.vel[0],
        vy: live.vel[1],
        vz: live.vel[2],
        pos: [live.pos[0], live.pos[1], live.pos[2]],
      })
    }
  })

  return <ParticleRenderer manager={managerRef.current} />
}
