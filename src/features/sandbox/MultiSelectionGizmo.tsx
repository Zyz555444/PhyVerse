import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TransformControls } from '@react-three/drei'
import * as THREE from 'three'
import type { SandboxItem, GizmoMode, GizmoSpace } from './sandboxStore'
import { useSandboxStore } from './sandboxStore'

interface MultiSelectionGizmoProps {
  selectedIds: string[]
  items: SandboxItem[]
  mode: GizmoMode
  space?: GizmoSpace
  snapEnabled: boolean
  snapSize: number
  angleSnapEnabled: boolean
  angleSnapSize: number
  onChange: (id: string, patch: Partial<SandboxItem>) => void
  onCommit: (id: string, patch: Partial<SandboxItem>) => void
  enabled: boolean
}

interface ItemTransform {
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: THREE.Vector3
}

export function MultiSelectionGizmo({
  selectedIds,
  items,
  mode,
  space = 'world',
  snapEnabled,
  snapSize,
  angleSnapEnabled,
  angleSnapSize,
  onChange,
  onCommit,
  enabled,
}: MultiSelectionGizmoProps) {
  const setGizmoDragging = useSandboxStore((s) => s.setGizmoDragging)
  const pivot = useMemo(() => new THREE.Object3D(), [])
  const [isDragging, setIsDragging] = useState(false)
  const draggingRef = useRef(false)
  const initialTransforms = useRef<Map<string, ItemTransform>>(new Map())
  const initialPivot = useRef<{
    position: THREE.Vector3
    rotation: THREE.Quaternion
    scale: THREE.Vector3
  } | null>(null)

  const selectedItems = useMemo(
    () =>
      selectedIds
        .map((id) => items.find((item) => item.id === id))
        .filter(Boolean) as SandboxItem[],
    [selectedIds, items]
  )

  const center = useMemo(() => {
    if (selectedItems.length === 0) return new THREE.Vector3()
    const c = new THREE.Vector3()
    selectedItems.forEach((item) => c.add(new THREE.Vector3(...item.position)))
    c.divideScalar(selectedItems.length)
    return c
  }, [selectedItems])

  useEffect(() => {
    if (!draggingRef.current) {
      pivot.position.copy(center)
      pivot.rotation.set(0, 0, 0)
      pivot.scale.set(1, 1, 1)
    }
  }, [pivot, center])

  const captureTransforms = useCallback(() => {
    const map = new Map<string, ItemTransform>()
    selectedItems.forEach((item) => {
      map.set(item.id, {
        position: new THREE.Vector3(...item.position),
        rotation: new THREE.Euler(...item.rotation),
        scale: new THREE.Vector3(...item.scale),
      })
    })
    initialTransforms.current = map
    initialPivot.current = {
      position: pivot.position.clone(),
      rotation: pivot.quaternion.clone(),
      scale: pivot.scale.clone(),
    }
  }, [pivot, selectedItems])

  useEffect(() => {
    setGizmoDragging(isDragging)
  }, [isDragging, setGizmoDragging])

  useEffect(() => {
    if (!enabled) return

    const handlePointerUp = () => {
      if (draggingRef.current) {
        draggingRef.current = false
        setIsDragging(false)
        selectedItems.forEach((item) => {
          onCommit(item.id, {
            position: [item.position[0], item.position[1], item.position[2]],
            rotation: [item.rotation[0], item.rotation[1], item.rotation[2]],
            scale: [item.scale[0], item.scale[1], item.scale[2]],
          })
        })
      }
    }

    window.addEventListener('pointerup', handlePointerUp)
    return () => window.removeEventListener('pointerup', handlePointerUp)
  }, [enabled, selectedItems, onCommit])

  const applyDelta = useCallback(() => {
    const start = initialPivot.current
    if (!start) return

    selectedItems.forEach((item) => {
      const initial = initialTransforms.current.get(item.id)
      if (!initial) return

      if (mode === 'translate') {
        const delta = new THREE.Vector3().subVectors(pivot.position, start.position)
        const nextPos = initial.position.clone().add(delta)
        onChange(item.id, {
          position: [nextPos.x, nextPos.y, nextPos.z],
        })
      } else if (mode === 'rotate') {
        const deltaQ = new THREE.Quaternion().multiplyQuaternions(
          pivot.quaternion,
          start.rotation.clone().invert()
        )
        const nextPos = initial.position
          .clone()
          .sub(start.position)
          .applyQuaternion(deltaQ)
          .add(start.position)
        const nextRot = new THREE.Euler().setFromQuaternion(
          new THREE.Quaternion().multiplyQuaternions(
            deltaQ,
            new THREE.Quaternion().setFromEuler(initial.rotation)
          )
        )
        onChange(item.id, {
          position: [nextPos.x, nextPos.y, nextPos.z],
          rotation: [nextRot.x, nextRot.y, nextRot.z],
        })
      } else if (mode === 'scale') {
        const scaleRatio = new THREE.Vector3(
          pivot.scale.x / start.scale.x,
          pivot.scale.y / start.scale.y,
          pivot.scale.z / start.scale.z
        )
        const nextPos = initial.position
          .clone()
          .sub(start.position)
          .multiply(scaleRatio)
          .add(start.position)
        const nextScale = initial.scale.clone().multiply(scaleRatio)
        onChange(item.id, {
          position: [nextPos.x, nextPos.y, nextPos.z],
          scale: [nextScale.x, nextScale.y, nextScale.z],
        })
      }
    })
  }, [mode, pivot, selectedItems, onChange])

  if (!enabled || selectedItems.length < 2) return null

  return (
    <TransformControls
      object={pivot}
      mode={mode}
      space={space}
      enabled={enabled}
      translationSnap={snapEnabled && mode === 'translate' ? snapSize : undefined}
      rotationSnap={angleSnapEnabled && mode === 'rotate' ? angleSnapSize : undefined}
      onPointerDown={() => {
        draggingRef.current = true
        setIsDragging(true)
        captureTransforms()
      }}
      onObjectChange={() => {
        if (!draggingRef.current) {
          draggingRef.current = true
          setIsDragging(true)
          captureTransforms()
        }
        applyDelta()
      }}
    />
  )
}
