import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { usePhysics } from '@/features/physics/usePhysics'
import type { PhysicsWorld } from '@/features/physics/PhysicsWorld'
import { createMaterial, type MaterialPreset } from '@/features/canvas/Materials'
import type { ShapeType } from '@/shared/types/physics'
import type { SandboxItem, SandboxShape } from './sandboxStore'
import { SelectionGizmo } from './SelectionGizmo'

interface SandboxItemRendererProps {
  item: SandboxItem
  selected: boolean
  multiSelected: boolean
  editingEnabled: boolean
  gizmoMode: 'translate' | 'rotate' | 'scale'
  snapEnabled: boolean
  snapSize: number
  angleSnapEnabled: boolean
  angleSnapSize: number
  onClick: (e: ThreeEvent<MouseEvent>) => void
  onChange: (patch: Partial<SandboxItem>) => void
  onCommit: (patch: Partial<SandboxItem>) => void
}

interface ShapeGeometry {
  args: unknown[]
  type: 'box' | 'sphere' | 'cylinder' | 'capsule' | 'cone' | 'plane' | 'torus' | 'spring'
}

const SELECTION_COLOR = '#f59e0b'

function toQuaternion(euler: [number, number, number]): [number, number, number, number] {
  const q = new THREE.Quaternion()
  q.setFromEuler(new THREE.Euler(euler[0], euler[1], euler[2], 'XYZ'))
  return [q.x, q.y, q.z, q.w]
}

function getPhysicsShape(shape: SandboxShape): ShapeType {
  if (shape === 'torus') return 'box'
  if (shape === 'spring') return 'cylinder'
  if (
    shape === 'box' ||
    shape === 'sphere' ||
    shape === 'cylinder' ||
    shape === 'capsule' ||
    shape === 'cone' ||
    shape === 'plane'
  ) {
    return shape
  }
  return 'box'
}

function getPhysicsDimensions(item: SandboxItem): [number, number, number] {
  const [sx, sy, sz] = item.scale
  const [sizeX, sizeY, sizeZ] = item.size

  switch (item.shape) {
    case 'box':
      return [(sizeX * sx) / 2, (sizeY * sy) / 2, (sizeZ * sz) / 2]
    case 'sphere':
      return [sizeX * sx, 0, 0]
    case 'cylinder':
    case 'capsule':
    case 'cone':
    case 'spring':
      return [sizeX * sx, (sizeY * sy) / 2, 0]
    case 'plane':
      return [(sizeX * sx) / 2, 0, (sizeZ * sz) / 2]
    case 'torus':
      return [(sizeX * sx) / 2, (sizeY * sy) / 2, (sizeX * sx) / 2]
    default:
      return [0.1, 0.1, 0.1]
  }
}

function getVisualGeometry(shape: SandboxShape, size: [number, number, number]): ShapeGeometry {
  switch (shape) {
    case 'box':
      return { type: 'box', args: size }
    case 'sphere':
      return { type: 'sphere', args: [size[0], 32, 32] }
    case 'cylinder':
      return { type: 'cylinder', args: [size[0], size[0], size[1], 32] }
    case 'capsule':
      return { type: 'capsule', args: [size[0], size[1], 16, 32] }
    case 'cone':
      return { type: 'cone', args: [size[0], size[1], 32] }
    case 'plane':
      return { type: 'plane', args: [size[0], size[2]] }
    case 'torus':
      return { type: 'torus', args: [size[0], size[1], 16, 64] }
    case 'spring':
      return { type: 'spring', args: [size[0], size[1]] }
    default:
      return { type: 'box', args: size }
  }
}

function SelectionOutline({
  shape,
  size,
  scale,
}: {
  shape: SandboxShape
  size: [number, number, number]
  scale: [number, number, number]
}) {
  const geometry = useMemo(() => {
    const sx = scale[0]
    const sy = scale[1]
    const sz = scale[2]
    switch (shape) {
      case 'box':
        return new THREE.EdgesGeometry(
          new THREE.BoxGeometry(size[0] * sx, size[1] * sy, size[2] * sz)
        )
      case 'sphere': {
        const r = size[0] * sx
        return new THREE.EdgesGeometry(new THREE.SphereGeometry(r, 24, 12))
      }
      case 'cylinder':
      case 'spring':
        return new THREE.EdgesGeometry(
          new THREE.CylinderGeometry(size[0] * sx, size[0] * sx, size[1] * sy, 32)
        )
      case 'capsule':
        return new THREE.EdgesGeometry(
          new THREE.CapsuleGeometry(size[0] * sx, size[1] * sy, 16, 32)
        )
      case 'cone':
        return new THREE.EdgesGeometry(
          new THREE.ConeGeometry(size[0] * sx, size[1] * sy, 32)
        )
      case 'torus':
        return new THREE.EdgesGeometry(
          new THREE.TorusGeometry(size[0] * sx, size[1] * sy, 16, 48)
        )
      case 'plane':
        return new THREE.EdgesGeometry(
          new THREE.PlaneGeometry(size[0] * sx, size[2] * sz)
        )
      default:
        return new THREE.EdgesGeometry(
          new THREE.BoxGeometry(size[0] * sx, size[1] * sy, size[2] * sz)
        )
    }
  }, [shape, size, scale])

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#f59e0b" transparent opacity={0.8} />
    </lineSegments>
  )
}

function SpringGeometry({ radius, height }: { radius: number; height: number }) {
  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = []
    const turns = 8
    const segments = turns * 16
    const wireThickness = 0.03
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const angle = t * turns * Math.PI * 2
      const y = t * height - height / 2
      points.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius))
    }
    const curve = new THREE.CatmullRomCurve3(points)
    return new THREE.TubeGeometry(curve, segments, wireThickness, 8, false)
  }, [radius, height])

  return <primitive attach="geometry" object={geometry} />
}

export function SandboxItemRenderer({
  item,
  selected,
  multiSelected,
  editingEnabled,
  gizmoMode,
  snapEnabled,
  snapSize,
  angleSnapEnabled,
  angleSnapSize,
  onClick,
  onChange,
  onCommit,
}: SandboxItemRendererProps) {
  const { world } = usePhysics()
  const meshRef = useRef<THREE.Mesh>(null)
  const [mesh, setMesh] = useState<THREE.Mesh | null>(null)
  const bodyRef = useRef<ReturnType<PhysicsWorld['getBody']> | null>(null)

  const setMeshRef = useCallback((node: THREE.Mesh | null) => {
    meshRef.current = node
    setMesh(node)
  }, [])

  const material = useMemo(
    () =>
      createMaterial(item.material as MaterialPreset, {
        color: selected ? SELECTION_COLOR : multiSelected ? '#fbbf24' : item.color,
      }),
    [item.material, item.color, selected, multiSelected]
  )

  const geometry = useMemo(() => getVisualGeometry(item.shape, item.size), [item.shape, item.size])

  // Create or recreate the physics body when structural properties change.
  const {
    id: itemId,
    shape: itemShape,
    size: itemSize,
    scale: itemScale,
    isDynamic: itemIsDynamic,
    mass: itemMass,
    friction: itemFriction,
    restitution: itemRestitution,
  } = item
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!world || !world.isReady) return

    world.removeBody(itemId)

    const bodyType = itemIsDynamic ? 'dynamic' : 'static'
    const dimensions = getPhysicsDimensions({
      shape: itemShape,
      size: itemSize,
      scale: itemScale,
    } as SandboxItem)

    world.addBody(itemId, {
      type: bodyType,
      shape: getPhysicsShape(itemShape),
      dimensions,
      position: item.position,
      rotation: toQuaternion(item.rotation),
      mass: itemMass,
      friction: itemFriction,
      restitution: itemRestitution,
    })

    bodyRef.current = world.getBody(itemId)

    return () => {
      if (world.isReady) {
        world.removeBody(itemId)
        bodyRef.current = null
      }
    }
  }, [
    world,
    itemId,
    itemShape,
    itemSize,
    itemScale,
    itemIsDynamic,
    itemMass,
    itemFriction,
    itemRestitution,
  ])
  /* eslint-enable react-hooks/exhaustive-deps */

  // Toggle kinematic/dynamic without recreating the body.
  useEffect(() => {
    const body = bodyRef.current
    if (!body) return
    if (editingEnabled && itemIsDynamic) {
      body.rigidBody.setBodyType(1, true) // 1 = kinematic position-based in Rapier
    } else if (!editingEnabled && itemIsDynamic) {
      body.rigidBody.setBodyType(0, true) // 0 = dynamic
    }
  }, [editingEnabled, itemIsDynamic])

  // Sync body transform from store when position/rotation/scale change
  useEffect(() => {
    const body = bodyRef.current
    if (!body) return

    body.rigidBody.setTranslation({ x: item.position[0], y: item.position[1], z: item.position[2] }, true)
    const q = toQuaternion(item.rotation)
    body.rigidBody.setRotation({ x: q[0], y: q[1], z: q[2], w: q[3] }, true)
  }, [item.id, item.position, item.rotation, item.scale])

  // Each frame: running -> read physics to mesh; editing -> write mesh to kinematic body.
  useFrame(() => {
    const body = bodyRef.current
    if (!body) return
    const meshNode = meshRef.current
    if (!meshNode) return

    const rb = body.rigidBody

    if (editingEnabled) {
      rb.setTranslation({ x: meshNode.position.x, y: meshNode.position.y, z: meshNode.position.z }, true)
      rb.setRotation(
        {
          x: meshNode.quaternion.x,
          y: meshNode.quaternion.y,
          z: meshNode.quaternion.z,
          w: meshNode.quaternion.w,
        },
        true
      )
    } else {
      const pos = rb.translation()
      const rot = rb.rotation()
      meshNode.position.set(pos.x, pos.y, pos.z)
      meshNode.quaternion.set(rot.x, rot.y, rot.z, rot.w)
    }
  })

  return (
    <>
      <mesh ref={setMeshRef} material={material} onClick={onClick} castShadow receiveShadow>
        {geometry.type === 'box' && (
          <boxGeometry args={geometry.args as [number, number, number]} />
        )}
        {geometry.type === 'sphere' && (
          <sphereGeometry args={geometry.args as [number, number, number]} />
        )}
        {geometry.type === 'cylinder' && (
          <cylinderGeometry args={geometry.args as [number, number, number, number]} />
        )}
        {geometry.type === 'capsule' && (
          <capsuleGeometry args={geometry.args as [number, number, number, number]} />
        )}
        {geometry.type === 'cone' && (
          <coneGeometry args={geometry.args as [number, number, number]} />
        )}
        {geometry.type === 'plane' && <planeGeometry args={geometry.args as [number, number]} />}
        {geometry.type === 'torus' && (
          <torusGeometry args={geometry.args as [number, number, number, number]} />
        )}
        {geometry.type === 'spring' && (
          <SpringGeometry radius={item.size[0]} height={item.size[1]} />
        )}
        {selected && <SelectionOutline shape={item.shape} size={item.size} scale={item.scale} />}
        {multiSelected && !selected && (
          <SelectionOutline shape={item.shape} size={item.size} scale={item.scale} />
        )}
      </mesh>
      <SelectionGizmo
        mesh={mesh}
        mode={gizmoMode}
        snapEnabled={snapEnabled}
        snapSize={snapSize}
        angleSnapEnabled={angleSnapEnabled}
        angleSnapSize={angleSnapSize}
        onChange={onChange}
        onCommit={onCommit}
        enabled={selected && editingEnabled}
      />
    </>
  )
}
