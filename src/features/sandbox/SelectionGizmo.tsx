import { useState } from 'react'
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

  if (!enabled || !mesh) return null

  const readTransform = () => {
    const pos = mesh.position
    const rot = mesh.rotation
    const scl = mesh.scale
    return {
      position: [pos.x, pos.y, pos.z] as [number, number, number],
      rotation: [rot.x, rot.y, rot.z] as [number, number, number],
      scale: [scl.x, scl.y, scl.z] as [number, number, number],
    }
  }

  return (
    <TransformControls
      object={mesh}
      mode={mode}
      enabled={enabled}
      translationSnap={snapEnabled && mode === 'translate' ? snapSize : undefined}
      rotationSnap={angleSnapEnabled && mode === 'rotate' ? angleSnapSize : undefined}
      data-gizmo={isDragging ? 'dragging' : 'idle'}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => {
        setIsDragging(false)
        onCommit(readTransform())
      }}
      onObjectChange={() => {
        onChange(readTransform())
      }}
    />
  )
}
