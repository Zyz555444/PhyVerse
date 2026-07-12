import * as THREE from 'three'

export type MaterialPreset = 'metal' | 'plastic' | 'glass' | 'wood' | 'rubber' | 'paper'

export interface MaterialOptions {
  color?: string
  roughness?: number
  metalness?: number
  opacity?: number
  transparent?: boolean
  clearcoat?: number
  transmission?: number
  ior?: number
}

export function createMaterial(
  preset: MaterialPreset,
  options: MaterialOptions = {}
): THREE.Material {
  const color = options.color ?? '#ffffff'

  switch (preset) {
    case 'metal':
      return new THREE.MeshStandardMaterial({
        color,
        roughness: options.roughness ?? 0.3,
        metalness: options.metalness ?? 0.9,
      })

    case 'plastic':
      return new THREE.MeshStandardMaterial({
        color,
        roughness: options.roughness ?? 0.5,
        metalness: options.metalness ?? 0.0,
      })

    case 'glass':
      return new THREE.MeshPhysicalMaterial({
        color,
        roughness: options.roughness ?? 0.05,
        metalness: 0.0,
        transmission: options.transmission ?? 0.95,
        thickness: 0.5,
        ior: options.ior ?? 1.5,
        transparent: true,
        opacity: options.opacity ?? 1.0,
        clearcoat: options.clearcoat ?? 1.0,
        clearcoatRoughness: 0.05,
      })

    case 'wood':
      return new THREE.MeshStandardMaterial({
        color,
        roughness: options.roughness ?? 0.8,
        metalness: 0.0,
      })

    case 'rubber':
      return new THREE.MeshStandardMaterial({
        color,
        roughness: options.roughness ?? 0.9,
        metalness: 0.0,
      })

    case 'paper':
      return new THREE.MeshStandardMaterial({
        color,
        roughness: options.roughness ?? 0.95,
        metalness: 0.0,
        side: THREE.DoubleSide,
      })

    default:
      return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.5,
        metalness: 0.0,
      })
  }
}

export const materialPresets: Record<MaterialPreset, MaterialOptions> = {
  metal: { roughness: 0.3, metalness: 0.9 },
  plastic: { roughness: 0.5, metalness: 0.0 },
  glass: { roughness: 0.05, transmission: 0.95, ior: 1.5 },
  wood: { roughness: 0.8, metalness: 0.0 },
  rubber: { roughness: 0.9, metalness: 0.0 },
  paper: { roughness: 0.95, metalness: 0.0 },
}
