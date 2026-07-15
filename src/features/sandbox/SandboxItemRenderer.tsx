import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { usePhysics } from '@/features/physics/usePhysics'
import type { PhysicsWorld } from '@/features/physics/PhysicsWorld'
import { createMaterial, type MaterialPreset } from '@/features/canvas/Materials'
import type { ShapeType } from '@/shared/types/physics'
import type { SandboxItem, SandboxShape } from './sandboxStore'
import { SelectionGizmo } from './SelectionGizmo'
import { VectorOverlay } from './VectorOverlay'

interface SandboxItemRendererProps {
  item: SandboxItem
  selected: boolean
  multiSelected: boolean
  editingEnabled: boolean
  gizmoMode: 'translate' | 'rotate' | 'scale'
  gizmoSpace?: 'world' | 'local'
  multiSelectionActive?: boolean
  snapEnabled: boolean
  snapSize: number
  angleSnapEnabled: boolean
  angleSnapSize: number
  impulseMode: boolean
  impulseStrength: number
  showTrajectory: boolean
  onClick: (e: ThreeEvent<MouseEvent>) => void
  onChange: (patch: Partial<SandboxItem>) => void
  onCommit: (patch: Partial<SandboxItem>) => void
}

interface ShapeGeometry {
  args: unknown[]
  type:
    'box' | 'sphere' | 'cylinder' | 'capsule' | 'cone' | 'plane' | 'torus' | 'spring' | 'composite'
}

const SELECTION_COLOR = '#f59e0b'
const TRAJECTORY_MAX_POINTS = 300
const TRAJECTORY_SAMPLE_INTERVAL = 2

function toQuaternion(euler: [number, number, number]): [number, number, number, number] {
  const q = new THREE.Quaternion()
  q.setFromEuler(new THREE.Euler(euler[0], euler[1], euler[2], 'XYZ'))
  return [q.x, q.y, q.z, q.w]
}

function getPhysicsShape(shape: SandboxShape): ShapeType {
  if (shape === 'torus') return 'box'
  if (shape === 'spring') return 'cylinder'
  if (shape === 'pulley') return 'cylinder'
  if (shape === 'slope' || shape === 'barrier' || shape === 'force_meter') return 'box'
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
    case 'pulley':
      return [(sizeX * sx) / 2, (sizeZ * sz) / 2, 0]
    case 'slope':
    case 'barrier':
    case 'force_meter':
      return [(sizeX * sx) / 2, (sizeY * sy) / 2, (sizeZ * sz) / 2]
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
    case 'pulley':
    case 'slope':
    case 'barrier':
    case 'force_meter':
      return { type: 'composite', args: [] }
    default:
      return { type: 'box', args: size }
  }
}

function SelectionOutline({
  shape,
  size,
}: {
  shape: SandboxShape
  size: [number, number, number]
}) {
  // The outline is a child of the mesh, so mesh scale is applied automatically.
  // Use raw size here to avoid double-scaling.
  const geometry = useMemo(() => {
    switch (shape) {
      case 'box':
        return new THREE.EdgesGeometry(new THREE.BoxGeometry(size[0], size[1], size[2]))
      case 'sphere': {
        const r = size[0]
        return new THREE.EdgesGeometry(new THREE.SphereGeometry(r, 24, 12))
      }
      case 'cylinder':
      case 'spring':
        return new THREE.EdgesGeometry(new THREE.CylinderGeometry(size[0], size[0], size[1], 32))
      case 'capsule':
        return new THREE.EdgesGeometry(new THREE.CapsuleGeometry(size[0], size[1], 16, 32))
      case 'cone':
        return new THREE.EdgesGeometry(new THREE.ConeGeometry(size[0], size[1], 32))
      case 'torus':
        return new THREE.EdgesGeometry(new THREE.TorusGeometry(size[0], size[1], 16, 48))
      case 'plane':
        return new THREE.EdgesGeometry(new THREE.PlaneGeometry(size[0], size[2]))
      case 'pulley':
      case 'slope':
      case 'barrier':
      case 'force_meter':
        return new THREE.EdgesGeometry(new THREE.BoxGeometry(size[0], size[1], size[2]))
      default:
        return new THREE.EdgesGeometry(new THREE.BoxGeometry(size[0], size[1], size[2]))
    }
  }, [shape, size])

  useEffect(() => {
    return () => {
      geometry.dispose()
    }
  }, [geometry])

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

  useEffect(() => {
    return () => {
      geometry.dispose()
    }
  }, [geometry])

  return <primitive attach="geometry" object={geometry} />
}

function PulleyGeometry({ radius, thickness }: { radius: number; thickness: number }) {
  const wheelGeo = useMemo(() => {
    return new THREE.CylinderGeometry(radius, radius, thickness, 32)
  }, [radius, thickness])
  const hubGeo = useMemo(() => {
    return new THREE.CylinderGeometry(radius * 0.15, radius * 0.15, thickness * 1.8, 16)
  }, [radius, thickness])
  const bracketGeo = useMemo(() => {
    const w = radius * 2.4
    const h = radius * 1.4
    const d = thickness * 1.4
    const box = new THREE.BoxGeometry(w, h, d)
    box.translate(0, h / 2 - radius * 0.3, 0)
    return box
  }, [radius, thickness])

  useEffect(() => {
    return () => {
      wheelGeo.dispose()
      hubGeo.dispose()
      bracketGeo.dispose()
    }
  }, [wheelGeo, hubGeo, bracketGeo])

  return (
    <group>
      {/* Rotate cylinder so wheel faces Z; item rotation applies afterwards. */}
      <group rotation={[0, 0, Math.PI / 2]}>
        <mesh geometry={wheelGeo}>
          <meshStandardMaterial color="#475569" metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh geometry={hubGeo}>
          <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
      <mesh geometry={bracketGeo}>
        <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  )
}

function SlopeGeometry({
  width,
  thickness,
  depth,
}: {
  width: number
  thickness: number
  depth: number
}) {
  const boardGeo = useMemo(() => {
    const geo = new THREE.BoxGeometry(width, thickness, depth)
    geo.translate(0, 0, 0)
    return geo
  }, [width, thickness, depth])

  const tickGroup = useMemo(() => {
    const group = new THREE.Group()
    const divisions = 10
    const minorLen = depth * 0.25
    const majorLen = depth * 0.45
    const step = width / divisions
    for (let i = 1; i < divisions; i++) {
      const x = -width / 2 + i * step
      const isMajor = i % 5 === 0
      const len = isMajor ? majorLen : minorLen
      const geo = new THREE.BoxGeometry(0.01, 0.01, len)
      geo.translate(x, thickness / 2 + 0.006, -depth / 2 + len / 2)
      const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x5c4033 }))
      group.add(mesh)
    }
    return group
  }, [width, thickness, depth])

  useEffect(() => {
    return () => {
      boardGeo.dispose()
      tickGroup.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
    }
  }, [boardGeo, tickGroup])

  return (
    <group>
      <mesh geometry={boardGeo}>
        <meshStandardMaterial color="#d4c8a8" roughness={0.8} />
      </mesh>
      <primitive object={tickGroup} />
    </group>
  )
}

function BarrierGeometry({
  width,
  height,
  thickness,
}: {
  width: number
  height: number
  thickness: number
}) {
  const boardGeo = useMemo(() => {
    return new THREE.BoxGeometry(width, height, thickness)
  }, [width, height, thickness])
  const baseGeo = useMemo(() => {
    const w = width + 0.12
    const d = thickness + 0.1
    const geo = new THREE.BoxGeometry(w, 0.06, d)
    geo.translate(0, -height / 2 - 0.03, 0)
    return geo
  }, [width, thickness, height])

  useEffect(() => {
    return () => {
      boardGeo.dispose()
      baseGeo.dispose()
    }
  }, [boardGeo, baseGeo])

  return (
    <group>
      <mesh geometry={boardGeo}>
        <meshStandardMaterial color="#94a3b8" roughness={0.6} />
      </mesh>
      <mesh geometry={baseGeo}>
        <meshStandardMaterial color="#64748b" roughness={0.6} />
      </mesh>
    </group>
  )
}

function ForceMeterGeometry({ radius, height }: { radius: number; height: number }) {
  const bodyGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(radius, radius, height * 0.72, 24)
    geo.translate(0, height * 0.11, 0)
    return geo
  }, [radius, height])
  const hookGeo = useMemo(() => {
    const geo = new THREE.TorusGeometry(radius * 0.5, radius * 0.14, 12, 24, Math.PI * 1.3)
    geo.translate(0, -height * 0.55, 0)
    return geo
  }, [radius, height])
  const ringGeo = useMemo(() => {
    const geo = new THREE.TorusGeometry(radius * 0.6, radius * 0.12, 12, 24)
    geo.translate(0, height * 0.46, 0)
    return geo
  }, [radius, height])
  const markerGeo = useMemo(() => {
    const geo = new THREE.BoxGeometry(radius * 1.6, 0.02, radius * 0.3)
    geo.translate(0, 0, radius * 1.05)
    return geo
  }, [radius])

  useEffect(() => {
    return () => {
      bodyGeo.dispose()
      hookGeo.dispose()
      ringGeo.dispose()
      markerGeo.dispose()
    }
  }, [bodyGeo, hookGeo, ringGeo, markerGeo])

  return (
    <group>
      <mesh geometry={bodyGeo}>
        <meshStandardMaterial color="#f59e0b" metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh geometry={hookGeo}>
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh geometry={ringGeo}>
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh geometry={markerGeo}>
        <meshStandardMaterial color="#0f172a" />
      </mesh>
    </group>
  )
}

function TrajectoryLine({
  bodyRef,
  active,
}: {
  bodyRef: React.MutableRefObject<ReturnType<PhysicsWorld['getBody']> | null>
  active: boolean
}) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(TRAJECTORY_MAX_POINTS * 3)
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setDrawRange(0, 0)
    return geo
  }, [])

  const countRef = useRef(0)
  const frameCounterRef = useRef(0)

  useEffect(() => {
    return () => {
      geometry.dispose()
    }
  }, [geometry])

  useEffect(() => {
    if (!active) {
      countRef.current = 0
      geometry.setDrawRange(0, 0)
      const attr = geometry.getAttribute('position') as THREE.BufferAttribute
      attr.needsUpdate = true
    }
  }, [active, geometry])

  useFrame(() => {
    if (!active) return
    const body = bodyRef.current
    if (!body) return
    frameCounterRef.current += 1
    if (frameCounterRef.current % TRAJECTORY_SAMPLE_INTERVAL !== 0) return
    const pos = body.rigidBody.translation()
    const attr = geometry.getAttribute('position') as THREE.BufferAttribute
    const positions = attr.array as Float32Array
    if (countRef.current >= TRAJECTORY_MAX_POINTS) {
      // Shift left by one point (3 floats) to make room.
      positions.copyWithin(0, 3, TRAJECTORY_MAX_POINTS * 3)
      countRef.current = TRAJECTORY_MAX_POINTS - 1
    }
    const idx = countRef.current * 3
    positions[idx] = pos.x
    positions[idx + 1] = pos.y
    positions[idx + 2] = pos.z
    countRef.current += 1
    attr.needsUpdate = true
    geometry.setDrawRange(0, countRef.current)
    geometry.computeBoundingSphere()
  })

  return (
    <line>
      <primitive object={geometry} attach="geometry" />
      <lineBasicMaterial color="#f59e0b" linewidth={2} />
    </line>
  )
}

export function SandboxItemRenderer({
  item,
  selected,
  multiSelected,
  editingEnabled,
  gizmoMode,
  gizmoSpace,
  multiSelectionActive,
  snapEnabled,
  snapSize,
  angleSnapEnabled,
  angleSnapSize,
  impulseMode,
  impulseStrength,
  showTrajectory,
  onClick,
  onChange,
  onCommit,
}: SandboxItemRendererProps) {
  const { world } = usePhysics()
  const { camera } = useThree()
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

  useEffect(() => {
    return () => {
      material.dispose()
    }
  }, [material])

  const geometry = useMemo(() => getVisualGeometry(item.shape, item.size), [item.shape, item.size])

  // Create or recreate the physics body only when STRUCTURAL properties change.
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
  }, [world, itemId, itemShape, itemSize, itemScale, itemIsDynamic])
  /* eslint-enable react-hooks/exhaustive-deps */

  // Update physics material properties in place — no body recreation.
  useEffect(() => {
    const body = bodyRef.current
    if (!body) return
    body.collider.setFriction(itemFriction)
    body.collider.setRestitution(itemRestitution)
    if (itemMass > 0) {
      body.collider.setMass(itemMass)
    }
  }, [itemFriction, itemRestitution, itemMass])

  // Toggle kinematic/dynamic without recreating the body.
  useEffect(() => {
    const body = bodyRef.current
    if (!body) return
    if (editingEnabled && itemIsDynamic) {
      body.rigidBody.setBodyType(2, true) // 2 = kinematic position-based in Rapier
    } else if (!editingEnabled && itemIsDynamic) {
      body.rigidBody.setBodyType(0, true) // 0 = dynamic
    }
  }, [editingEnabled, itemIsDynamic])

  // Sync body transform from store. Position/rotation only while editing so
  // they never fight the running-mode useFrame that writes body→mesh. Scale is
  // always synced because physics dimensions already include it and the visual
  // mesh must stay consistent.
  useEffect(() => {
    const body = bodyRef.current
    if (!body) return

    body.rigidBody.setTranslation(
      { x: item.position[0], y: item.position[1], z: item.position[2] },
      true
    )
    const q = toQuaternion(item.rotation)
    body.rigidBody.setRotation({ x: q[0], y: q[1], z: q[2], w: q[3] }, true)

    const meshNode = meshRef.current
    if (meshNode) {
      if (editingEnabled) {
        meshNode.position.set(item.position[0], item.position[1], item.position[2])
        meshNode.quaternion.set(q[0], q[1], q[2], q[3])
      }
      meshNode.scale.set(item.scale[0], item.scale[1], item.scale[2])
    }
  }, [item.id, item.position, item.rotation, item.scale, editingEnabled])

  // Each frame: running -> read physics to mesh; editing -> write mesh to kinematic body.
  useFrame(() => {
    const body = bodyRef.current
    if (!body) return
    const meshNode = meshRef.current
    if (!meshNode) return

    const rb = body.rigidBody

    if (editingEnabled) {
      rb.setTranslation(
        { x: meshNode.position.x, y: meshNode.position.y, z: meshNode.position.z },
        true
      )
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

  // Apply impulse on click when impulse mode is active (run mode only).
  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (impulseMode && !editingEnabled) {
        e.stopPropagation()
        const body = bodyRef.current
        if (!body) return
        const rb = body.rigidBody
        if (rb.bodyType() !== 0) return // only dynamic bodies respond
        const dir = new THREE.Vector3()
        camera.getWorldDirection(dir)
        dir.multiplyScalar(impulseStrength)
        rb.applyImpulse({ x: dir.x, y: dir.y, z: dir.z }, true)
        return
      }
      onClick(e)
    },
    [impulseMode, editingEnabled, impulseStrength, camera, onClick]
  )

  // Hidden items are not rendered and do not participate in physics clicks.
  if (item.hidden) return null

  const gizmoEnabled = selected && editingEnabled && !item.locked && !multiSelectionActive
  const trajectoryActive = !!showTrajectory && selected && !editingEnabled
  const vectorOverlayActive = !editingEnabled && item.isDynamic

  return (
    <>
      <mesh ref={setMeshRef} material={material} onClick={handleClick} castShadow receiveShadow>
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
        {geometry.type === 'composite' && (
          <>
            <boxGeometry args={item.size} />
            <meshStandardMaterial transparent opacity={0} depthWrite={false} />
            {item.shape === 'pulley' && (
              <PulleyGeometry radius={item.size[0] / 2} thickness={item.size[2]} />
            )}
            {item.shape === 'slope' && (
              <SlopeGeometry width={item.size[0]} thickness={item.size[1]} depth={item.size[2]} />
            )}
            {item.shape === 'barrier' && (
              <BarrierGeometry
                width={item.size[0]}
                height={item.size[1]}
                thickness={item.size[2]}
              />
            )}
            {item.shape === 'force_meter' && (
              <ForceMeterGeometry radius={item.size[0] / 2} height={item.size[1]} />
            )}
          </>
        )}
        {selected && <SelectionOutline shape={item.shape} size={item.size} />}
        {multiSelected && !selected && <SelectionOutline shape={item.shape} size={item.size} />}
      </mesh>
      <SelectionGizmo
        mesh={mesh}
        mode={gizmoMode}
        space={gizmoSpace}
        snapEnabled={snapEnabled}
        snapSize={snapSize}
        angleSnapEnabled={angleSnapEnabled}
        angleSnapSize={angleSnapSize}
        onChange={onChange}
        onCommit={onCommit}
        enabled={gizmoEnabled}
      />
      {trajectoryActive && <TrajectoryLine bodyRef={bodyRef} active={trajectoryActive} />}
      {vectorOverlayActive && <VectorOverlay bodyRef={bodyRef} />}
    </>
  )
}
