import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ParticleManager } from './ParticleManager'

// Sphere geometry for instanced particle rendering
const SPHERE_GEO = new THREE.SphereGeometry(0.5, 8, 6)

interface ParticleRendererProps {
  /** Particle manager instance to render */
  manager: ParticleManager
  /** Optional render distance culling */
  maxDistance?: number
}

/**
 * Renders particles from a ParticleManager as an instanced mesh inside R3F.
 * This component must be placed inside a <Canvas>.
 */
export function ParticleRenderer({ manager, maxDistance = 80 }: ParticleRendererProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummyRef = useRef(new THREE.Object3D())
  const colorRef = useRef(new THREE.Color())

  // Pre-allocate max instances
  const maxInstances = 600

  // Reset all instances to invisible on mount / when empty
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    mesh.count = 0
    mesh.instanceMatrix.needsUpdate = true
  }, [])

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (!mesh) return

    // Update particles physics
    manager.update(Math.min(delta, 1 / 15))

    // Get render data
    const { positions, scales, colors, count } = manager.getRenderData()

    mesh.count = count

    if (count === 0) {
      // Hide all instances
      mesh.instanceMatrix.needsUpdate = true
      return
    }

    const dummy = dummyRef.current
    const color = colorRef.current
    const maxCount = Math.min(count, maxInstances)

    for (let i = 0; i < maxCount; i++) {
      const ti = i * 3
      const x = positions[ti]
      const y = positions[ti + 1]
      const z = positions[ti + 2]

      // Cull distant particles
      const distSq = x * x + y * y + z * z
      if (distSq > maxDistance * maxDistance) {
        // Push far away to hide
        dummy.position.set(99999, 99999, 99999)
        dummy.scale.setScalar(0)
      } else {
        dummy.position.set(x, y, z)
        dummy.scale.setScalar(scales[i])
      }

      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      color.setRGB(colors[ti], colors[ti + 1], colors[ti + 2])
      mesh.setColorAt(i, color)
    }

    // Hide remaining instances
    for (let i = maxCount; i < maxInstances; i++) {
      dummy.position.set(99999, 99999, 99999)
      dummy.scale.setScalar(0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[SPHERE_GEO, undefined, maxInstances]}
      frustumCulled={false}
    >
      <meshBasicMaterial
        toneMapped={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  )
}
