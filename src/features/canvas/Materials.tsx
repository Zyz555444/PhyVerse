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
  /** Highlight the material (e.g. when selected) without discarding its base color. */
  highlight?: boolean
  highlightColor?: string
}

export function createMaterial(
  preset: MaterialPreset,
  options: MaterialOptions = {}
): THREE.Material {
  const color = options.color ?? '#ffffff'

  let material: THREE.Material

  switch (preset) {
    case 'metal':
      material = new THREE.MeshStandardMaterial({
        color,
        roughness: options.roughness ?? 0.3,
        metalness: options.metalness ?? 0.9,
      })
      break

    case 'plastic':
      material = new THREE.MeshStandardMaterial({
        color,
        roughness: options.roughness ?? 0.45,
        metalness: options.metalness ?? 0.0,
      })
      break

    case 'glass':
      material = new THREE.MeshPhysicalMaterial({
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
      break

    case 'wood':
      material = new THREE.MeshStandardMaterial({
        color,
        roughness: options.roughness ?? 0.75,
        metalness: 0.0,
      })
      break

    case 'rubber':
      material = new THREE.MeshStandardMaterial({
        color,
        roughness: options.roughness ?? 0.85,
        metalness: 0.0,
      })
      break

    case 'paper':
      material = new THREE.MeshStandardMaterial({
        color,
        roughness: options.roughness ?? 0.95,
        metalness: 0.0,
        side: THREE.DoubleSide,
      })
      break

    default:
      material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.5,
        metalness: 0.0,
      })
  }

  if (options.highlight && material instanceof THREE.MeshStandardMaterial) {
    material.emissive = new THREE.Color(options.highlightColor ?? '#f59e0b')
    material.emissiveIntensity = 0.35
  }

  return material
}

export const materialPresets: Record<MaterialPreset, MaterialOptions> = {
  metal: { roughness: 0.3, metalness: 0.9 },
  plastic: { roughness: 0.5, metalness: 0.0 },
  glass: { roughness: 0.05, transmission: 0.95, ior: 1.5 },
  wood: { roughness: 0.8, metalness: 0.0 },
  rubber: { roughness: 0.9, metalness: 0.0 },
  paper: { roughness: 0.95, metalness: 0.0 },
}
