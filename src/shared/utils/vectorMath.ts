export interface Vec3Like {
  x: number
  y: number
  z: number
}

/** Euclidean magnitude of a 3D vector. */
export function magnitude(v: Vec3Like): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
}

/** Magnitude of a vector projected onto the horizontal (x-z) plane. */
export function magnitudeXZ(v: { x: number; z: number }): number {
  return Math.sqrt(v.x * v.x + v.z * v.z)
}

/** Horizontal (x-z plane) distance between two points. */
export function distanceXZ(a: { x: number; z: number }, b: { x: number; z: number }): number {
  const dx = a.x - b.x
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dz * dz)
}
