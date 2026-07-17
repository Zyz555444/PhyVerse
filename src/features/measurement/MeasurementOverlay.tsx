import { type FC, useState, useRef, useSyncExternalStore } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line, Text } from '@react-three/drei'
import * as THREE from 'three'
import { usePhysics } from '@/features/physics/usePhysics'
import { useSandboxStore } from '@/features/sandbox/sandboxStore'
import { useIsMobile } from '@/shared/hooks/useIsMobile'
import {
  getMeasurementData,
  subscribeMeasurementData,
  setMeasurementData,
} from './measurementDataStore'

interface MeasurementOverlayProps {
  isRunning: boolean
}

function SpeedLabel({ isRunning, isMobile }: { isRunning: boolean; isMobile: boolean }) {
  const { world } = usePhysics()
  const items = useSandboxStore((s) => s.items)
  const selectedId = useSandboxStore((s) => s.selectedId)
  const [speed, setSpeed] = useState(0)
  const [color, setColor] = useState('#22c55e')

  const speedItem = isRunning ? items.find((it) => it.id === selectedId && it.isDynamic) : null
  const prevTimeRef = useRef(0)

  useFrame((_, delta) => {
    prevTimeRef.current += delta
    if (prevTimeRef.current < 0.1) return
    prevTimeRef.current = 0

    if (!speedItem || !world?.isReady) return
    const record = world.getBody(speedItem.id)
    if (!record) return
    const v = record.rigidBody.linvel()
    const s = Math.hypot(v.x, v.y, v.z)
    setSpeed(s)
    const t = Math.min(s / 20, 1)
    const c = new THREE.Color()
    c.setHSL((1 - t) * 0.33, 1, 0.5)
    setColor(c.getStyle())
  })

  if (!speedItem || !isRunning) return null

  const [x, y, z] = speedItem.position
  const labelY = y + (speedItem.size?.[0] ?? 0.5) + 0.5
  const isSlow = speed < 0.1

  return (
    <group>
      <mesh position={[x, labelY, z]}>
        <ringGeometry args={[0.15, 0.2, 32]} />
        <meshBasicMaterial
          color={color}
          side={THREE.DoubleSide}
          transparent
          opacity={isSlow ? 0.2 : 0.9}
        />
      </mesh>
      <Text
        position={[x, labelY, z]}
        fontSize={isMobile ? 0.18 : 0.14}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
        fillOpacity={isSlow ? 0.3 : 1}
      >
        {`${speed.toFixed(1)} m/s`}
      </Text>
    </group>
  )
}

function DistanceLine() {
  const { world } = usePhysics()
  const items = useSandboxStore((s) => s.items)
  const isMobile = useIsMobile()
  const md = useSyncExternalStore(subscribeMeasurementData, getMeasurementData)
  const [distance, setDistance] = useState(0)
  const [midpoint, setMidpoint] = useState<[number, number, number]>([0, 0, 0])

  const distanceTargets = md.distanceTargets
  const showDistance = distanceTargets !== null
  const prevTimeRef = useRef(0)

  useFrame((_, delta) => {
    prevTimeRef.current += delta
    if (prevTimeRef.current < 0.1) return
    prevTimeRef.current = 0

    if (!showDistance || !world?.isReady) return
    const a = world.getBody(distanceTargets[0])
    const b = world.getBody(distanceTargets[1])
    if (!a || !b) return
    const pa = a.rigidBody.translation()
    const pb = b.rigidBody.translation()
    const d = Math.sqrt((pb.x - pa.x) ** 2 + (pb.y - pa.y) ** 2 + (pb.z - pa.z) ** 2)
    setDistance(d)
    setMidpoint([(pa.x + pb.x) / 2, (pa.y + pb.y) / 2 + 0.3, (pa.z + pb.z) / 2])

    // Also update the shared store so the toolbar reads the same value
    setMeasurementData({ distance: d })
  })

  if (!showDistance) return null

  // Skip when objects are nearly overlapping
  if (distance < 0.2) return null

  const [ax, ay, az] = items.find((it) => it.id === distanceTargets[0])?.position ?? [0, 0, 0]
  const [bx, by, bz] = items.find((it) => it.id === distanceTargets[1])?.position ?? [0, 0, 0]

  return (
    <group>
      <Line
        points={[
          [ax, ay, az],
          [bx, by, bz],
        ]}
        color="#f59e0b"
        lineWidth={1}
        dashed
        dashSize={0.3}
        gapSize={0.2}
      />
      <Text
        position={midpoint}
        fontSize={isMobile ? 0.18 : 0.14}
        color="#f59e0b"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {`${distance.toFixed(2)} m`}
      </Text>
      <mesh position={[ax, ay, az]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
      <mesh position={[bx, by, bz]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
    </group>
  )
}

export const MeasurementOverlay: FC<MeasurementOverlayProps> = ({ isRunning }) => {
  const isMobile = useIsMobile()

  return (
    <group>
      <SpeedLabel isRunning={isRunning} isMobile={isMobile} />
      <DistanceLine />
    </group>
  )
}
