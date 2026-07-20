import type {
  SandboxItem,
  SandboxScene,
  SandboxShape,
  SandboxJoint,
  TelemetrySample,
} from './sandboxStore'

const STORAGE_KEY = 'phyverse-sandbox-scene'
const CURRENT_VERSION = 1

const SANDBOX_SHAPES: SandboxShape[] = [
  'box',
  'sphere',
  'cylinder',
  'capsule',
  'cone',
  'plane',
  'torus',
  'spring',
  'pulley',
  'slope',
  'barrier',
  'force_meter',
  'force_field',
]

const JOINT_TYPES = ['spring', 'fixed', 'rope', 'revolute', 'prismatic', 'motor', 'gear'] as const

export interface VersionedScene extends SandboxScene {
  version: number
}

export interface ImportSceneResult {
  scene: SandboxScene
  metadata?: {
    name?: string
    createdAt?: string
    itemCount?: number
    jointCount?: number
  }
}

export interface ImportSceneError {
  reason: 'parse' | 'structure' | 'shape' | 'item' | 'version' | 'versionTooNew'
  message: string
}

function isNumberArray(value: unknown, length: number): value is number[] {
  return (
    Array.isArray(value) && value.length === length && value.every((v) => typeof v === 'number')
  )
}

function isTuple3(value: unknown): value is [number, number, number] {
  return isNumberArray(value, 3)
}

function isMaterial(value: unknown): value is SandboxItem['material'] {
  return (
    typeof value === 'string' &&
    ['metal', 'plastic', 'glass', 'wood', 'rubber', 'paper'].includes(value)
  )
}

function isSandboxItem(value: unknown): value is SandboxItem {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<SandboxItem>

  if (typeof item.id !== 'string' || item.id.length === 0) return false
  if (typeof item.shape !== 'string' || !SANDBOX_SHAPES.includes(item.shape as SandboxShape)) {
    return false
  }
  if (!isTuple3(item.position)) return false
  if (!isTuple3(item.rotation)) return false
  if (!isTuple3(item.scale)) return false
  if (!isTuple3(item.size)) return false
  if (!isMaterial(item.material)) return false
  if (typeof item.color !== 'string' || item.color.length === 0) return false
  if (typeof item.isDynamic !== 'boolean') return false
  if (typeof item.mass !== 'number' || item.mass < 0) return false
  if (typeof item.friction !== 'number') return false
  if (typeof item.restitution !== 'number') return false

  return true
}

function isSandboxJoint(value: unknown): value is SandboxJoint {
  if (!value || typeof value !== 'object') return false
  const j = value as Partial<SandboxJoint>
  if (typeof j.id !== 'string' || j.id.length === 0) return false
  if (typeof j.type !== 'string' || !JOINT_TYPES.includes(j.type as (typeof JOINT_TYPES)[number]))
    return false
  if (typeof j.bodyA !== 'string' || j.bodyA.length === 0) return false
  if (typeof j.bodyB !== 'string' || j.bodyB.length === 0) return false
  if (j.anchorA !== undefined && !isTuple3(j.anchorA)) return false
  if (j.anchorB !== undefined && !isTuple3(j.anchorB)) return false
  return true
}

export function isSandboxScene(value: unknown): value is SandboxScene {
  if (!value || typeof value !== 'object') return false
  const scene = value as Partial<SandboxScene>

  if (!isTuple3(scene.gravity)) return false
  if (!Array.isArray(scene.items)) return false
  if (!scene.items.every((item) => isSandboxItem(item))) return false
  if (
    scene.joints !== undefined &&
    (!Array.isArray(scene.joints) || !scene.joints.every((j) => isSandboxJoint(j)))
  )
    return false

  return true
}

function migrateScene(value: unknown): SandboxScene | null {
  if (!value || typeof value !== 'object') return null

  // Legacy scene files did not include a version field.
  const hasVersion =
    'version' in value && typeof (value as { version?: unknown }).version === 'number'

  if (!hasVersion) {
    return isSandboxScene(value) ? (value as SandboxScene) : null
  }

  const versioned = value as VersionedScene

  if (versioned.version > CURRENT_VERSION) {
    throw createImportError(
      'version',
      `场景文件版本(${versioned.version})高于当前支持版本(${CURRENT_VERSION})，请升级 PhyVerse 后重新导入`
    )
  }

  if (!isSandboxScene(versioned)) return null

  // Future migrations can branch on version here.
  return versioned
}

export function saveScene(scene: SandboxScene): void {
  if (typeof window === 'undefined') return
  const payload: VersionedScene = { version: CURRENT_VERSION, ...scene }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function loadStoredScene(): SandboxScene | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    return migrateScene(parsed)
  } catch {
    return null
  }
}

export function exportScene(scene: SandboxScene): void {
  if (typeof window === 'undefined') return

  // Anonymize item IDs: map original UUIDs to generic ids like "item-1", "item-2"
  const idMap = new Map<string, string>()
  const anonymizedItems = scene.items.map((item, i) => {
    const newId = `item-${i + 1}`
    idMap.set(item.id, newId)
    return { ...item, id: newId }
  })

  // Anonymize joint references
  const anonymizedJoints = (scene.joints ?? []).map((j) => ({
    ...j,
    id: idMap.get(j.id) ?? j.id,
    bodyA: idMap.get(j.bodyA) ?? j.bodyA,
    bodyB: idMap.get(j.bodyB) ?? j.bodyB,
  }))

  const payload = {
    version: CURRENT_VERSION,
    metadata: {
      name: `PhyVerse Scene`,
      createdAt: new Date().toISOString(),
      itemCount: scene.items.length,
      jointCount: (scene.joints ?? []).length,
    },
    gravity: scene.gravity,
    items: anonymizedItems,
    joints: anonymizedJoints.length > 0 ? anonymizedJoints : undefined,
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = `phyverse-sandbox-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } finally {
    URL.revokeObjectURL(url)
  }
}

const CSV_HEADER =
  'time_s,pos_x_m,pos_y_m,pos_z_m,vel_x_mps,vel_y_mps,vel_z_mps,speed_mps,accel_mps2,kinetic_energy_j,potential_energy_j,total_energy_j'

function csvEscape(value: number): string {
  // Use enough precision for physics data; fixed notation avoids scientific notation surprises in spreadsheets.
  return Number.isFinite(value) ? value.toFixed(4) : ''
}

/** Export telemetry samples as a CSV file download. */
export function exportTelemetryCsv(samples: TelemetrySample[], label: string): void {
  if (typeof window === 'undefined') return
  const rows = samples.map((s) =>
    [
      s.t,
      s.pos[0],
      s.pos[1],
      s.pos[2],
      s.vel[0],
      s.vel[1],
      s.vel[2],
      s.speed,
      s.accel,
      s.ke,
      s.pe,
      s.ke + s.pe,
    ]
      .map(csvEscape)
      .join(',')
  )
  const csv = [CSV_HEADER, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    const safeLabel = label ? label.replace(/[^\w\u4e00-\u9fa5-]+/g, '_') : 'telemetry'
    a.download = `phyverse-${safeLabel}-${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function createImportError(reason: ImportSceneError['reason'], message: string): Error {
  const error = new Error(message)
  ;(error as Error & { importReason?: ImportSceneError['reason'] }).importReason = reason
  return error
}

export async function importScene(file: File): Promise<ImportSceneResult> {
  let text: string
  try {
    text = await file.text()
  } catch {
    throw createImportError('parse', '无法读取文件内容')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw createImportError('parse', '文件不是有效的 JSON')
  }

  // Extract metadata if present (new format)
  let metadata: ImportSceneResult['metadata']
  if (parsed && typeof parsed === 'object' && 'metadata' in parsed) {
    const meta = (parsed as { metadata?: Record<string, unknown> }).metadata
    if (meta && typeof meta === 'object') {
      metadata = {
        name: typeof meta.name === 'string' ? meta.name : undefined,
        createdAt: typeof meta.createdAt === 'string' ? meta.createdAt : undefined,
        itemCount: typeof meta.itemCount === 'number' ? meta.itemCount : undefined,
        jointCount: typeof meta.jointCount === 'number' ? meta.jointCount : undefined,
      }
    }
  }

  const scene = migrateScene(parsed)
  if (!scene) {
    // Check if it was a version error
    if (
      parsed &&
      typeof parsed === 'object' &&
      'version' in parsed &&
      typeof (parsed as { version: number }).version === 'number' &&
      (parsed as { version: number }).version > CURRENT_VERSION
    ) {
      throw createImportError(
        'versionTooNew',
        `场景文件版本(${(parsed as { version: number }).version})高于当前支持版本(${CURRENT_VERSION})，请升级 PhyVerse 后重新导入`
      )
    }
    throw createImportError('structure', '场景文件格式不正确')
  }

  // Remap anonymized IDs to fresh unique IDs to avoid conflicts with existing items
  const idMap = new Map<string, string>()
  const remappedItems = scene.items.map((item) => {
    const newId = crypto.randomUUID?.() ?? `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    idMap.set(item.id, newId)
    return { ...item, id: newId }
  })

  const remappedJoints = (scene.joints ?? []).map((j) => ({
    ...j,
    id: idMap.get(j.id) ?? j.id,
    bodyA: idMap.get(j.bodyA) ?? j.bodyA,
    bodyB: idMap.get(j.bodyB) ?? j.bodyB,
  }))

  return {
    scene: {
      gravity: scene.gravity,
      items: remappedItems,
      joints: remappedJoints,
    },
    metadata,
  }
}
