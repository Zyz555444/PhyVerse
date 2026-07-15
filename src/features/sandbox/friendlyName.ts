import type { SandboxItem, SandboxShape } from './sandboxStore'

const SHAPE_LABELS_ZH: Record<SandboxShape, string> = {
  box: '长方体',
  sphere: '球体',
  cylinder: '圆柱',
  capsule: '胶囊',
  cone: '圆锥',
  plane: '平面',
  torus: '圆环',
  spring: '弹簧',
  pulley: '滑轮',
  slope: '斜面',
  barrier: '挡板',
  force_meter: '弹簧测力计',
}

export function getShapeLabelZh(shape: SandboxShape): string {
  return SHAPE_LABELS_ZH[shape] ?? shape
}

/**
 * Returns a stable, human-friendly name for an item.
 * If `displayName` is set on the item, it takes precedence.
 * Otherwise, the name is derived from the shape label and the 1-based
 * index of the item among same-shape siblings.
 */
export function getFriendlyName(items: SandboxItem[], id: string): string {
  const item = items.find((it) => it.id === id)
  if (!item) return id.slice(0, 8)
  if (item.displayName && item.displayName.trim().length > 0) return item.displayName
  const idx = items.filter((it) => it.shape === item.shape).indexOf(item)
  return `${getShapeLabelZh(item.shape)} ${idx + 1}`
}
