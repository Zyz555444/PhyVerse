import { useCallback, useEffect, useRef, useState } from 'react'
import { TransformControls } from '@react-three/drei'
import type { Object3D } from 'three'
import type { SandboxItem, GizmoMode } from './sandboxStore'

interface SelectionGizmoProps {
  mesh: Object3D | null
  mode: GizmoMode
  snapEnabled: boolean
  snapSize: number
  angleSnapEnabled: boolean
  angleSnapSize: number
  onChange: (patch: Partial<SandboxItem>) => void
  onCommit: (patch: Partial<SandboxItem>) => void
  enabled: boolean
}

export function SelectionGizmo({
  mesh,
  mode,
  snapEnabled,
  snapSize,
  angleSnapEnabled,
  angleSnapSize,
  onChange,
  onCommit,
  enabled,
}: SelectionGizmoProps) {
  const [isDragging, setIsDragging] = useState(false)
  const draggingRef = useRef(false)
  const dragStartTransform = useRef<ReturnType<typeof readTransform> | null>(null)

  const readTransform = useCallback(() => {
    if (!mesh)
      return {
        position: [0, 0, 0] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number],
        scale: [1, 1, 1] as [number, number, number],
      }
    const pos = mesh.position
    const rot = mesh.rotation
    const scl = mesh.scale
    return {
      position: [pos.x, pos.y, pos.z] as [number, number, number],
      rotation: [rot.x, rot.y, rot.z] as [number, number, number],
      scale: [scl.x, scl.y, scl.z] as [number, number, number],
    }
  }, [mesh])

  useEffect(() => {
    if (!enabled) return

    const handlePointerUp = () => {
      if (draggingRef.current) {
        draggingRef.current = false
        setIsDragging(false)
        const current = readTransform()
        const start = dragStartTransform.current
        if (
          start &&
          (start.position[0] !== current.position[0] ||
            start.position[1] !== current.position[1] ||
            start.position[2] !== current.position[2] ||
            start.rotation[0] !== current.rotation[0] ||
            start.rotation[1] !== current.rotation[1] ||
            start.rotation[2] !== current.rotation[2] ||
            start.scale[0] !== current.scale[0] ||
            start.scale[1] !== current.scale[1] ||
            start.scale[2] !== current.scale[2])
        ) {
          onCommit(current)
        }
      }
    }

    window.addEventListener('pointerup', handlePointerUp)
    return () => window.removeEventListener('pointerup', handlePointerUp)
  }, [enabled, readTransform, onCommit])

  if (!enabled || !mesh) return null

  return (
    <TransformControls
      object={mesh}
      mode={mode}
      enabled={enabled}
      translationSnap={snapEnabled && mode === 'translate' ? snapSize : undefined}
      rotationSnap={angleSnapEnabled && mode === 'rotate' ? angleSnapSize : undefined}
      data-gizmo={isDragging ? 'dragging' : 'idle'}
      onPointerDown={() => {
        draggingRef.current = true
        setIsDragging(true)
        dragStartTransform.current = readTransform()
      }}
      onObjectChange={() => {
        if (!draggingRef.current) {
          draggingRef.current = true
          setIsDragging(true)
          dragStartTransform.current = readTransform()
        }
        onChange(readTransform())
      }}
    />
  )
}
