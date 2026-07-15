import { create } from 'zustand'
import type { MaterialPreset } from '@/features/canvas/Materials'
import { getFriendlyName } from './friendlyName'

export { getFriendlyName }

export type SandboxShape =
  | 'box'
  | 'sphere'
  | 'cylinder'
  | 'capsule'
  | 'cone'
  | 'plane'
  | 'torus'
  | 'spring'
  | 'pulley'
  | 'slope'
  | 'barrier'
  | 'force_meter'

export type SandboxCameraView = 'free' | 'top' | 'front' | 'side'
export type GizmoMode = 'translate' | 'rotate' | 'scale'

export type JointType = 'spring' | 'fixed' | 'rope' | 'revolute' | 'prismatic' | 'motor' | 'gear'

export type SandboxToolMode = GizmoMode | 'impulse'

export interface SandboxJoint {
  id: string
  type: JointType
  bodyA: string
  bodyB: string
  anchorA?: [number, number, number]
  anchorB?: [number, number, number]
  /** Rotation/slide axis in local body coordinates. */
  axis?: [number, number, number]
  /** Linear/angular limits [min, max] in meters or radians. */
  limits?: [number, number]
  restLength?: number
  stiffness?: number
  damping?: number
  maxDistance?: number
  /** Target velocity for motor joints (rad/s or m/s). */
  targetVelocity?: number
  /** Maximum motor force/torque. */
  maxMotorForce?: number
  /** Gear ratio: omegaB = -omegaA * ratio. */
  gearRatio?: number
}

export interface SandboxItem {
  id: string
  shape: SandboxShape
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  size: [number, number, number]
  material: MaterialPreset
  color: string
  isDynamic: boolean
  mass: number
  friction: number
  restitution: number
  /** When true, the object is hidden from the 3D view. */
  hidden?: boolean
  /** When true, the object cannot be moved via gizmo or transform sliders. */
  locked?: boolean
  /** Optional user-defined name; takes precedence over the auto-generated friendly name. */
  displayName?: string
}

export interface SandboxScene {
  gravity: [number, number, number]
  items: SandboxItem[]
  joints?: SandboxJoint[]
}

export interface SandboxEditorConfig {
  snapEnabled: boolean
  snapSize: number
  angleSnapEnabled: boolean
  angleSnapSize: number
  timeScale: number
  cameraView: SandboxCameraView
  gizmoMode: GizmoMode
  /** When true, clicking a body in run mode applies an impulse instead of selecting. */
  impulseMode: boolean
  /** Magnitude of the impulse applied in impulse mode. */
  impulseStrength: number
  /** When true, the selected body leaves a trajectory trail while running. */
  showTrajectory: boolean
  /** Show velocity vector arrows on dynamic bodies while running. */
  showVelocityVector: boolean
  /** Show acceleration vector arrows on dynamic bodies while running. */
  showAccelerationVector: boolean
}

/** A single physics sample for the currently tracked body. */
export interface TelemetrySample {
  /** Simulation time in seconds. */
  t: number
  pos: [number, number, number]
  vel: [number, number, number]
  speed: number
  /** Linear acceleration magnitude (m/s²). */
  accel: number
  /** Kinetic energy (J). */
  ke: number
  /** Gravitational potential energy relative to y=0 (J). */
  pe: number
}

export interface TelemetryState {
  samples: TelemetrySample[]
  sampling: boolean
  /** Accumulated simulation time (seconds), only advances while running. */
  simTime: number
  /** Tracked item id; follows the current selection. */
  trackedId: string | null
  /** Latest reading; updated ~10Hz regardless of sampling flag. */
  live: TelemetrySample | null
}

const TELEMETRY_MAX_SAMPLES = 600

interface HistoryState {
  past: SandboxScene[]
  future: SandboxScene[]
}

interface SandboxUIState {
  isFullscreen: boolean
  isLeftPanelOpen: boolean
  isRightPanelOpen: boolean
  isHierarchyPanelOpen: boolean
  isHelpOpen: boolean
}

interface SandboxState extends SandboxScene {
  selectedId: string | null
  multiSelectedIds: string[]
  history: HistoryState
  editorConfig: SandboxEditorConfig
  clipboard: SandboxItem[] | null
  joints: SandboxJoint[]
  isGizmoDragging: boolean
  ui: SandboxUIState
  /** Captures scene state before a no-history drag for correct undo. */
  pendingHistorySnapshot: SandboxScene | null
  /** Monotonically increasing counter; bumping it requests a single physics step. */
  stepRequested: number
  /** Real-time physics telemetry for the tracked body. */
  telemetry: TelemetryState

  addItem: (shape: SandboxShape, position?: [number, number, number]) => void
  removeItem: (id: string) => void
  selectItem: (id: string | null, multi?: boolean) => void
  updateItem: (id: string, patch: Partial<SandboxItem>) => void
  updateItemAndCommit: (id: string, patch: Partial<SandboxItem>) => void
  commitHistory: () => void
  duplicateItem: (id: string) => void
  copyItem: (id: string) => void
  pasteItem: () => void
  setGravity: (gravity: [number, number, number]) => void
  resetScene: () => void
  clearScene: () => void
  loadScene: (scene: SandboxScene, options?: { pushHistory?: boolean }) => void
  undo: () => void
  redo: () => void
  setEditorConfig: (patch: Partial<SandboxEditorConfig>) => void
  setGizmoDragging: (dragging: boolean) => void
  addJoint: (joint: Omit<SandboxJoint, 'id'>) => string
  removeJoint: (id: string) => void
  updateJoint: (id: string, patch: Partial<SandboxJoint>) => void
  setUI: (patch: Partial<SandboxUIState>) => void
  snapToGround: (id: string) => void
  toggleLock: (id: string) => void
  toggleVisibility: (id: string) => void
  setDisplayName: (id: string, name: string) => void
  requestStep: () => void
  getFriendlyName: (id: string) => string
  toggleTelemetrySampling: () => void
  clearTelemetry: () => void
  /** Push a batch of samples (collected in the r3f loop) and advance sim time. */
  pushTelemetrySamples: (samples: TelemetrySample[], dt: number) => void
  setTelemetryTracked: (id: string | null) => void
  /** Update the latest live reading (does not affect history). */
  setLiveReading: (reading: TelemetrySample | null) => void
}

const DEFAULT_COLORS: Record<SandboxShape, string> = {
  box: '#33a6b8',
  sphere: '#dc2626',
  cylinder: '#2e8b57',
  capsule: '#9333ea',
  cone: '#ea580c',
  plane: '#d4c8a8',
  torus: '#2563eb',
  spring: '#9b9b9b',
  pulley: '#475569',
  slope: '#d4c8a8',
  barrier: '#94a3b8',
  force_meter: '#f59e0b',
}

const DEFAULT_SIZES: Record<SandboxShape, [number, number, number]> = {
  box: [0.6, 0.6, 0.6],
  sphere: [0.4, 0, 0],
  cylinder: [0.3, 1, 0],
  capsule: [0.25, 0.8, 0],
  cone: [0.4, 1, 0],
  plane: [4, 0.02, 3],
  torus: [0.5, 0.15, 0],
  spring: [0.25, 1, 0],
  pulley: [0.6, 0.6, 0.15],
  slope: [3, 0.08, 1],
  barrier: [2, 0.5, 0.08],
  force_meter: [0.12, 0.8, 0.12],
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `sandbox-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const DEFAULT_GRAVITY: [number, number, number] = [0, -9.81, 0]

const DEFAULT_EDITOR_CONFIG: SandboxEditorConfig = {
  snapEnabled: false,
  snapSize: 0.1,
  angleSnapEnabled: false,
  angleSnapSize: Math.PI / 12,
  timeScale: 1,
  cameraView: 'free',
  gizmoMode: 'translate',
  impulseMode: false,
  impulseStrength: 5,
  showTrajectory: false,
  showVelocityVector: false,
  showAccelerationVector: false,
}

function getEquipmentDefaults(shape: SandboxShape): Partial<SandboxItem> {
  switch (shape) {
    case 'pulley':
      return {
        material: 'metal',
        isDynamic: false,
        mass: 0,
        friction: 0.1,
        restitution: 0.1,
      }
    case 'slope':
      return {
        rotation: [0, 0, Math.PI / 6],
        material: 'wood',
        isDynamic: false,
        mass: 0,
        friction: 0.4,
        restitution: 0.2,
      }
    case 'barrier':
      return {
        material: 'wood',
        isDynamic: false,
        mass: 0,
        friction: 0.5,
        restitution: 0.2,
      }
    case 'force_meter':
      return {
        material: 'metal',
        isDynamic: false,
        mass: 0,
        friction: 0.5,
        restitution: 0.2,
      }
    default:
      return {}
  }
}

function createDefaultItem(shape: SandboxShape, position?: [number, number, number]): SandboxItem {
  const offsetX = (Math.random() - 0.5) * 2
  const offsetZ = (Math.random() - 0.5) * 2
  const isPlane = shape === 'plane'
  const defaults = getEquipmentDefaults(shape)
  return {
    id: generateId(),
    shape,
    position: position ?? (isPlane ? [0, 0, 0] : [offsetX, 3, offsetZ]),
    rotation: isPlane ? [-Math.PI / 2, 0, 0] : [0, 0, 0],
    scale: [1, 1, 1],
    size: DEFAULT_SIZES[shape],
    material: shape === 'plane' ? 'wood' : 'plastic',
    color: DEFAULT_COLORS[shape],
    isDynamic: shape !== 'plane',
    mass: 1,
    friction: 0.5,
    restitution: 0.3,
    ...defaults,
  }
}

function snapshot(state: Pick<SandboxState, 'items' | 'gravity' | 'joints'>): SandboxScene {
  return { items: state.items, gravity: state.gravity, joints: state.joints }
}

const HISTORY_LIMIT = 50

function pushHistory(
  state: Pick<SandboxState, 'items' | 'gravity' | 'joints' | 'history'>
): HistoryState {
  return {
    past: [...state.history.past, snapshot(state)].slice(-HISTORY_LIMIT),
    future: [],
  }
}

export const useSandboxStore = create<SandboxState>((set, get) => ({
  items: [],
  joints: [],
  selectedId: null,
  multiSelectedIds: [],
  gravity: DEFAULT_GRAVITY,
  history: { past: [], future: [] },
  editorConfig: DEFAULT_EDITOR_CONFIG,
  clipboard: null,
  isGizmoDragging: false,
  ui: {
    isFullscreen: false,
    isLeftPanelOpen: true,
    isRightPanelOpen: true,
    isHierarchyPanelOpen: true,
    isHelpOpen: false,
  },
  pendingHistorySnapshot: null,
  stepRequested: 0,
  telemetry: {
    samples: [],
    sampling: false,
    simTime: 0,
    trackedId: null,
    live: null,
  },

  addItem: (shape, position) =>
    set((state) => {
      const newItem = createDefaultItem(shape, position)
      return {
        items: [...state.items, newItem],
        selectedId: newItem.id,
        multiSelectedIds: [],
        history: pushHistory(state),
      }
    }),

  removeItem: (id) =>
    set((state) => {
      const idsToRemove = state.multiSelectedIds.length > 0 ? [id, ...state.multiSelectedIds] : [id]
      const removeSet = new Set(idsToRemove)
      return {
        items: state.items.filter((item) => !removeSet.has(item.id)),
        joints: state.joints.filter((j) => !removeSet.has(j.bodyA) && !removeSet.has(j.bodyB)),
        selectedId: null,
        multiSelectedIds: [],
        history: pushHistory(state),
      }
    }),

  selectItem: (id, multi) =>
    set((state) => {
      if (id === null) return { selectedId: null, multiSelectedIds: [] }
      if (multi && state.selectedId) {
        const existing = state.multiSelectedIds.includes(id)
          ? state.multiSelectedIds.filter((mid) => mid !== id)
          : [...state.multiSelectedIds, id]
        if (!existing.includes(state.selectedId)) {
          existing.push(state.selectedId)
        }
        return { multiSelectedIds: existing }
      }
      return { selectedId: id, multiSelectedIds: [] }
    }),

  updateItem: (id, patch) =>
    set((state) => {
      const nextItems = state.items.map((item) => (item.id === id ? { ...item, ...patch } : item))
      if (nextItems.every((item, idx) => item === state.items[idx])) {
        return state
      }
      // Capture pre-change snapshot on first update of a drag batch for correct undo.
      return {
        items: nextItems,
        pendingHistorySnapshot: state.pendingHistorySnapshot ?? snapshot(state),
      }
    }),

  updateItemAndCommit: (id, patch) =>
    set((state) => {
      const nextItems = state.items.map((item) => (item.id === id ? { ...item, ...patch } : item))
      if (nextItems.every((item, idx) => item === state.items[idx])) {
        return state
      }
      // Push OLD state so undo restores pre-change values.
      return {
        items: nextItems,
        history: pushHistory(state),
      }
    }),

  commitHistory: () =>
    set((state) => {
      if (!state.pendingHistorySnapshot) return state
      return {
        pendingHistorySnapshot: null,
        history: {
          past: [...state.history.past, state.pendingHistorySnapshot].slice(-HISTORY_LIMIT),
          future: [],
        },
      }
    }),

  duplicateItem: (id) =>
    set((state) => {
      const idsToDup = state.multiSelectedIds.length > 0 ? [id, ...state.multiSelectedIds] : [id]
      const dupSet = new Set(idsToDup)
      const sources = state.items.filter((item) => dupSet.has(item.id))
      if (sources.length === 0) return state
      const newItems: SandboxItem[] = sources.map((source) => ({
        ...source,
        id: generateId(),
        position: [source.position[0] + 0.5, source.position[1], source.position[2] + 0.5] as [
          number,
          number,
          number,
        ],
      }))
      return {
        items: [...state.items, ...newItems],
        selectedId: newItems[0].id,
        multiSelectedIds: newItems.slice(1).map((p) => p.id),
        history: pushHistory(state),
      }
    }),

  copyItem: (id) =>
    set((state) => {
      const idsToCopy =
        state.multiSelectedIds.length > 0
          ? ([state.selectedId, ...state.multiSelectedIds].filter(Boolean) as string[])
          : [id]
      const items = idsToCopy
        .map((iid) => state.items.find((item) => item.id === iid))
        .filter(Boolean) as SandboxItem[]
      return { clipboard: items.length > 0 ? items : null }
    }),

  pasteItem: () =>
    set((state) => {
      if (!state.clipboard || state.clipboard.length === 0) return state
      const pastedItems: SandboxItem[] = state.clipboard.map((item) => ({
        ...item,
        id: generateId(),
        position: [item.position[0] + 0.5, item.position[1], item.position[2] + 0.5] as [
          number,
          number,
          number,
        ],
      }))
      return {
        items: [...state.items, ...pastedItems],
        selectedId: pastedItems[0].id,
        multiSelectedIds: pastedItems.slice(1).map((p) => p.id),
        history: pushHistory(state),
      }
    }),

  setGravity: (gravity) =>
    set((state) => ({
      gravity,
      history: pushHistory(state),
    })),

  resetScene: () =>
    set((state) => ({
      items: [],
      joints: [],
      selectedId: null,
      multiSelectedIds: [],
      gravity: DEFAULT_GRAVITY,
      history: pushHistory(state),
      telemetry: {
        samples: [],
        sampling: state.telemetry.sampling,
        simTime: 0,
        trackedId: null,
        live: null,
      },
    })),

  clearScene: () =>
    set((state) => ({
      items: [],
      joints: [],
      selectedId: null,
      multiSelectedIds: [],
      history: pushHistory(state),
      telemetry: {
        samples: [],
        sampling: state.telemetry.sampling,
        simTime: 0,
        trackedId: null,
        live: null,
      },
    })),

  loadScene: (scene, options = {}) =>
    set((state) => {
      const next: Partial<SandboxState> = {
        items: scene.items,
        joints: scene.joints ?? [],
        gravity: scene.gravity,
        selectedId: null,
        multiSelectedIds: [],
        telemetry: {
          samples: [],
          sampling: state.telemetry.sampling,
          simTime: 0,
          trackedId: null,
          live: null,
        },
      }
      if (options.pushHistory !== false) {
        next.history = pushHistory(state)
      }
      return next as SandboxState
    }),

  undo: () =>
    set((state) => {
      const previous = state.history.past[state.history.past.length - 1]
      if (!previous) return state
      const newPast = state.history.past.slice(0, -1)
      return {
        items: previous.items,
        joints: previous.joints ?? [],
        gravity: previous.gravity,
        selectedId: null,
        multiSelectedIds: [],
        pendingHistorySnapshot: null,
        history: {
          past: newPast,
          future: [snapshot(state), ...state.history.future].slice(-HISTORY_LIMIT),
        },
      }
    }),

  redo: () =>
    set((state) => {
      const next = state.history.future[0]
      if (!next) return state
      return {
        items: next.items,
        joints: next.joints ?? [],
        gravity: next.gravity,
        selectedId: null,
        multiSelectedIds: [],
        pendingHistorySnapshot: null,
        history: {
          past: [...state.history.past, snapshot(state)].slice(-HISTORY_LIMIT),
          future: state.history.future.slice(1),
        },
      }
    }),

  setEditorConfig: (patch) =>
    set((state) => ({
      editorConfig: { ...state.editorConfig, ...patch },
    })),

  setGizmoDragging: (dragging) =>
    set(() => ({
      isGizmoDragging: dragging,
    })),

  addJoint: (joint) => {
    const id = generateId()
    const withDefaults: Omit<SandboxJoint, 'id'> = {
      ...joint,
      anchorA: joint.anchorA ?? [0, 0, 0],
      anchorB: joint.anchorB ?? [0, 0, 0],
    }
    if (withDefaults.type === 'revolute' || withDefaults.type === 'motor') {
      withDefaults.axis = withDefaults.axis ?? [0, 1, 0]
    }
    if (withDefaults.type === 'prismatic') {
      withDefaults.axis = withDefaults.axis ?? [1, 0, 0]
    }
    if (withDefaults.type === 'motor') {
      withDefaults.targetVelocity = withDefaults.targetVelocity ?? 1
      withDefaults.maxMotorForce = withDefaults.maxMotorForce ?? 10
    }
    if (withDefaults.type === 'gear') {
      withDefaults.gearRatio = withDefaults.gearRatio ?? 1
    }
    set((state) => ({
      joints: [...state.joints, { ...withDefaults, id }],
      history: pushHistory(state),
    }))
    return id
  },

  removeJoint: (jid) =>
    set((state) => ({
      joints: state.joints.filter((j) => j.id !== jid),
      history: pushHistory(state),
    })),

  updateJoint: (jid, patch) =>
    set((state) => {
      const nextJoints = state.joints.map((j) => (j.id === jid ? { ...j, ...patch } : j))
      if (nextJoints.every((j, idx) => j === state.joints[idx])) return state
      return {
        joints: nextJoints,
        history: pushHistory(state),
      }
    }),

  setUI: (patch) =>
    set((state) => ({
      ui: { ...state.ui, ...patch },
    })),

  snapToGround: (id) =>
    set((state) => {
      const item = state.items.find((it) => it.id === id)
      if (!item) return state
      const halfHeight = getHalfHeight(item)
      const nextPosition: [number, number, number] = [
        item.position[0],
        halfHeight,
        item.position[2],
      ]
      const nextItems = state.items.map((it) =>
        it.id === id ? { ...it, position: nextPosition } : it
      )
      return {
        items: nextItems,
        history: pushHistory(state),
      }
    }),

  toggleLock: (id) =>
    set((state) => ({
      items: state.items.map((it) => (it.id === id ? { ...it, locked: !it.locked } : it)),
      history: pushHistory(state),
    })),

  toggleVisibility: (id) =>
    set((state) => ({
      items: state.items.map((it) => (it.id === id ? { ...it, hidden: !it.hidden } : it)),
      history: pushHistory(state),
    })),

  setDisplayName: (id, name) =>
    set((state) => ({
      items: state.items.map((it) =>
        it.id === id ? { ...it, displayName: name.trim() || undefined } : it
      ),
      history: pushHistory(state),
    })),

  requestStep: () => set((state) => ({ stepRequested: state.stepRequested + 1 })),

  getFriendlyName: (id) => {
    const state = get()
    return getFriendlyName(state.items, id)
  },

  toggleTelemetrySampling: () =>
    set((state) => ({
      telemetry: {
        ...state.telemetry,
        sampling: !state.telemetry.sampling,
        // Clear previous batch when (re)starting so charts begin fresh.
        samples: !state.telemetry.sampling ? [] : state.telemetry.samples,
        simTime: !state.telemetry.sampling ? 0 : state.telemetry.simTime,
      },
    })),

  clearTelemetry: () =>
    set((state) => ({
      telemetry: { ...state.telemetry, samples: [], simTime: 0 },
    })),

  pushTelemetrySamples: (samples, dt) =>
    set((state) => {
      if (!state.telemetry.sampling || samples.length === 0) {
        // Still advance sim time so charts stay aligned with the run clock.
        return {
          telemetry: { ...state.telemetry, simTime: state.telemetry.simTime + dt },
        }
      }
      const merged = [...state.telemetry.samples, ...samples].slice(-TELEMETRY_MAX_SAMPLES)
      return {
        telemetry: {
          ...state.telemetry,
          samples: merged,
          simTime: state.telemetry.simTime + dt,
        },
      }
    }),

  setTelemetryTracked: (id) =>
    set((state) => ({
      telemetry: {
        ...state.telemetry,
        trackedId: id,
        // Clear samples when the tracked target changes to avoid mixing bodies.
        samples: id === state.telemetry.trackedId ? state.telemetry.samples : [],
      },
    })),

  setLiveReading: (reading) =>
    set((state) => ({
      telemetry: { ...state.telemetry, live: reading },
    })),
}))

function getHalfHeight(item: SandboxItem): number {
  const [, sy] = item.scale
  const [, sizeY] = item.size
  switch (item.shape) {
    case 'sphere':
      return item.size[0] * item.scale[0]
    case 'cylinder':
    case 'capsule':
    case 'cone':
    case 'spring':
    case 'box':
      return (sizeY * sy) / 2
    case 'torus':
      return item.size[1] * item.scale[1]
    case 'plane':
      return 0.01
    default:
      return 0.1
  }
}
