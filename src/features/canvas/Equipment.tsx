import { useMemo } from 'react'
import * as THREE from 'three'
import { createMaterial, type MaterialPreset } from './Materials'

export interface EquipmentProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number]
  castShadow?: boolean
  receiveShadow?: boolean
}

export interface BoxEquipmentProps extends EquipmentProps {
  size?: [number, number, number]
  material?: MaterialPreset
  color?: string
}

export function BoxEquipment({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  size = [1, 1, 1],
  material = 'plastic',
  color = '#ffffff',
  castShadow = true,
  receiveShadow = true,
}: BoxEquipmentProps) {
  const mat = useMemo(() => createMaterial(material, { color }), [material, color])

  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={scale}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      material={mat}
    >
      <boxGeometry args={size} />
    </mesh>
  )
}

export interface SphereEquipmentProps extends EquipmentProps {
  radius?: number
  material?: MaterialPreset
  color?: string
}

export function SphereEquipment({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  radius = 0.5,
  material = 'plastic',
  color = '#ffffff',
  castShadow = true,
  receiveShadow = true,
}: SphereEquipmentProps) {
  const mat = useMemo(() => createMaterial(material, { color }), [material, color])

  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={scale}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      material={mat}
    >
      <sphereGeometry args={[radius, 32, 32]} />
    </mesh>
  )
}

export interface CylinderEquipmentProps extends EquipmentProps {
  radius?: number
  height?: number
  material?: MaterialPreset
  color?: string
}

export function CylinderEquipment({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  radius = 0.5,
  height = 1,
  material = 'plastic',
  color = '#ffffff',
  castShadow = true,
  receiveShadow = true,
}: CylinderEquipmentProps) {
  const mat = useMemo(() => createMaterial(material, { color }), [material, color])

  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={scale}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      material={mat}
    >
      <cylinderGeometry args={[radius, radius, height, 32]} />
    </mesh>
  )
}

export interface ConeEquipmentProps extends EquipmentProps {
  radius?: number
  height?: number
  material?: MaterialPreset
  color?: string
}

export function ConeEquipment({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  radius = 0.5,
  height = 1,
  material = 'plastic',
  color = '#ffffff',
  castShadow = true,
  receiveShadow = true,
}: ConeEquipmentProps) {
  const mat = useMemo(() => createMaterial(material, { color }), [material, color])

  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={scale}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      material={mat}
    >
      <coneGeometry args={[radius, height, 32]} />
    </mesh>
  )
}

export interface PlaneEquipmentProps extends EquipmentProps {
  size?: [number, number]
  material?: MaterialPreset
  color?: string
}

export function PlaneEquipment({
  position = [0, 0, 0],
  rotation = [-Math.PI / 2, 0, 0],
  scale = [1, 1, 1],
  size = [10, 10],
  material = 'wood',
  color = '#d4c8a8',
  castShadow = false,
  receiveShadow = true,
}: PlaneEquipmentProps) {
  const mat = useMemo(() => createMaterial(material, { color }), [material, color])

  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={scale}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      material={mat}
    >
      <planeGeometry args={size} />
    </mesh>
  )
}

export interface CapsuleEquipmentProps extends EquipmentProps {
  radius?: number
  length?: number
  material?: MaterialPreset
  color?: string
}

export function CapsuleEquipment({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  radius = 0.3,
  length = 1,
  material = 'plastic',
  color = '#ffffff',
  castShadow = true,
  receiveShadow = true,
}: CapsuleEquipmentProps) {
  const mat = useMemo(() => createMaterial(material, { color }), [material, color])

  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={scale}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      material={mat}
    >
      <capsuleGeometry args={[radius, length, 16, 32]} />
    </mesh>
  )
}

export interface TorusEquipmentProps extends EquipmentProps {
  radius?: number
  tube?: number
  material?: MaterialPreset
  color?: string
}

export function TorusEquipment({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  radius = 0.5,
  tube = 0.15,
  material = 'metal',
  color = '#cccccc',
  castShadow = true,
  receiveShadow = true,
}: TorusEquipmentProps) {
  const mat = useMemo(() => createMaterial(material, { color }), [material, color])

  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={scale}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      material={mat}
    >
      <torusGeometry args={[radius, tube, 16, 64]} />
    </mesh>
  )
}

export interface SpringEquipmentProps extends EquipmentProps {
  radius?: number
  height?: number
  turns?: number
  wireThickness?: number
  material?: MaterialPreset
  color?: string
}

export function SpringEquipment({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  radius = 0.2,
  height = 1,
  turns = 8,
  wireThickness = 0.03,
  material = 'metal',
  color = '#9b9b9b',
  castShadow = true,
  receiveShadow = true,
}: SpringEquipmentProps) {
  const mat = useMemo(() => createMaterial(material, { color }), [material, color])

  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = []
    const segments = turns * 16
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const angle = t * turns * Math.PI * 2
      const y = t * height - height / 2
      points.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius))
    }
    const curve = new THREE.CatmullRomCurve3(points)
    return new THREE.TubeGeometry(curve, segments, wireThickness, 8, false)
  }, [radius, height, turns, wireThickness])

  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={scale}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      material={mat}
      geometry={geometry}
    />
  )
}
