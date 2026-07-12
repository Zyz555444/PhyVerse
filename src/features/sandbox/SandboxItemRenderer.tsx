import {
  BoxEquipment,
  SphereEquipment,
  CylinderEquipment,
  ConeEquipment,
  PlaneEquipment,
  CapsuleEquipment,
  TorusEquipment,
  SpringEquipment,
} from '@/features/canvas/Equipment'
import type { SandboxItem } from './sandboxStore'

interface SandboxItemRendererProps {
  item: SandboxItem
  selected: boolean
  onClick: () => void
}

export function SandboxItemRenderer({ item, selected, onClick }: SandboxItemRendererProps) {
  const baseProps = {
    position: item.position,
    rotation: item.rotation,
    scale: item.scale,
    material: item.material,
    color: selected ? '#f59e0b' : item.color,
  }

  const shapeProps: Record<
    SandboxItem['shape'],
    Record<string, unknown> | null
  > = {
    box: { size: item.size },
    sphere: { radius: item.size[0] },
    cylinder: { radius: item.size[0], height: item.size[1] },
    capsule: { radius: item.size[0], length: item.size[1] },
    cone: { radius: item.size[0], height: item.size[1] },
    plane: { size: [item.size[0], item.size[2]] as [number, number] },
    torus: { radius: item.size[0], tube: item.size[1] },
    spring: { radius: item.size[0], height: item.size[1] },
  }

  return (
    <group onClick={onClick}>
      {item.shape === 'box' && <BoxEquipment {...baseProps} {...shapeProps.box} />}
      {item.shape === 'sphere' && <SphereEquipment {...baseProps} {...shapeProps.sphere} />}
      {item.shape === 'cylinder' && <CylinderEquipment {...baseProps} {...shapeProps.cylinder} />}
      {item.shape === 'capsule' && <CapsuleEquipment {...baseProps} {...shapeProps.capsule} />}
      {item.shape === 'cone' && <ConeEquipment {...baseProps} {...shapeProps.cone} />}
      {item.shape === 'plane' && <PlaneEquipment {...baseProps} {...shapeProps.plane} />}
      {item.shape === 'torus' && <TorusEquipment {...baseProps} {...shapeProps.torus} />}
      {item.shape === 'spring' && <SpringEquipment {...baseProps} {...shapeProps.spring} />}
    </group>
  )
}
