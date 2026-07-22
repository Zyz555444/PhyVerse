import * as THREE from 'three'

/**
 * Global geometry and material pool to avoid recreating identical Three.js objects.
 * Reduces GC pressure and memory footprint when many objects share the same shape/material.
 */

type GeometryKey = string
type MaterialKey = string

interface PooledGeometry {
  geometry: THREE.BufferGeometry
  refCount: number
}

interface PooledMaterial {
  material: THREE.MeshStandardMaterial | THREE.MeshLambertMaterial | THREE.MeshBasicMaterial
  refCount: number
}

const geometryPool = new Map<GeometryKey, PooledGeometry>()
const materialPool = new Map<MaterialKey, PooledMaterial>()

export function buildGeometryKey(shape: string, size: [number, number, number], scale: [number, number, number]): GeometryKey {
  return `${shape}|${size.join(',')}|${scale.join(',')}`
}

export function buildMaterialKey(preset: string, color: string): MaterialKey {
  return `${preset}|${color}`
}

/** Get or create a shared geometry. Increments reference count. */
export function acquireGeometry(
  key: GeometryKey,
  factory: () => THREE.BufferGeometry
): THREE.BufferGeometry {
  const existing = geometryPool.get(key)
  if (existing) {
    existing.refCount++
    return existing.geometry
  }
  const geometry = factory()
  geometryPool.set(key, { geometry, refCount: 1 })
  return geometry
}

/** Decrement reference count and dispose geometry when no longer needed. */
export function releaseGeometry(key: GeometryKey): void {
  const existing = geometryPool.get(key)
  if (!existing) return
  existing.refCount--
  if (existing.refCount <= 0) {
    existing.geometry.dispose()
    geometryPool.delete(key)
  }
}

/** Get or create a shared material. Increments reference count. */
export function acquireMaterial(
  key: MaterialKey,
  factory: () => THREE.MeshStandardMaterial | THREE.MeshLambertMaterial | THREE.MeshBasicMaterial
): THREE.MeshStandardMaterial | THREE.MeshLambertMaterial | THREE.MeshBasicMaterial {
  const existing = materialPool.get(key)
  if (existing) {
    existing.refCount++
    return existing.material
  }
  const material = factory()
  materialPool.set(key, { material, refCount: 1 })
  return material
}

/** Decrement reference count and dispose material when no longer needed. */
export function releaseMaterial(key: MaterialKey): void {
  const existing = materialPool.get(key)
  if (!existing) return
  existing.refCount--
  if (existing.refCount <= 0) {
    existing.material.dispose()
    materialPool.delete(key)
  }
}

/** Get pool stats for debugging. */
export function getPoolStats(): { geometries: number; materials: number; totalGeomRefs: number; totalMatRefs: number } {
  let totalGeomRefs = 0
  let totalMatRefs = 0
  geometryPool.forEach((v) => { totalGeomRefs += v.refCount })
  materialPool.forEach((v) => { totalMatRefs += v.refCount })
  return {
    geometries: geometryPool.size,
    materials: materialPool.size,
    totalGeomRefs,
    totalMatRefs,
  }
}

/** Clear all pools. Use with extreme caution (e.g., on full scene teardown). */
export function clearPools(): void {
  geometryPool.forEach((v) => v.geometry.dispose())
  geometryPool.clear()
  materialPool.forEach((v) => v.material.dispose())
  materialPool.clear()
}
