import { create } from 'zustand'
import type { MaterialPreset } from '@/features/canvas/Materials'
import { getFriendlyName } from './friendlyName'

export { getFriendlyName }

export type SandboxShape =
  'box' | 'sphere' | 'cylinder' | 'capsule' | 'cone' | 'plane' | 'torus' | 'spring'

export type SandboxCameraView = 'free' | 'top' | 'front' | 'side'
export type GizmoMode = 'translate' | 'rotate' | 'scale'

export type JointType = 'spring' | 'fixed' | 'rope'

export type SandboxToolMode = GizmoMode | 'impulse'

export interface SandboxJoint {
  id: string
  type: JointType
  bodyA: string
  bodyB: string
  anchorA?: [number, number, number]
  anchorB?: [number, number, number]
  restLength?: number
  stiffness?: number
  damping?: number
  maxDistance?: number
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
}

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
  loadScene: (scene: SandboxScene) => void
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
}

function createDefaultItem(shape: SandboxShape, position?: [number, number, number]): SandboxItem {
  const offsetX = (Math.random() - 0.5) * 2
  const offsetZ = (Math.random() - 0.5) * 2
  const isPlane = shape === 'plane'
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
    })),

  clearScene: () =>
    set((state) => ({
      items: [],
      joints: [],
      selectedId: null,
      multiSelectedIds: [],
      history: pushHistory(state),
    })),

  loadScene: (scene) =>
    set((state) => ({
      items: scene.items,
      joints: scene.joints ?? [],
      gravity: scene.gravity,
      selectedId: null,
      multiSelectedIds: [],
      history: pushHistory(state),
    })),

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
    set((state) => ({
      joints: [...state.joints, { ...joint, id }],
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
      items: state.items.map((it) =>
        it.id === id ? { ...it, locked: !it.locked } : it
      ),
      history: pushHistory(state),
    })),

  toggleVisibility: (id) =>
    set((state) => ({
      items: state.items.map((it) =>
        it.id === id ? { ...it, hidden: !it.hidden } : it
      ),
      history: pushHistory(state),
    })),

  setDisplayName: (id, name) =>
    set((state) => ({
      items: state.items.map((it) =>
        it.id === id ? { ...it, displayName: name.trim() || undefined } : it
      ),
      history: pushHistory(state),
    })),

  requestStep: () =>
    set((state) => ({ stepRequested: state.stepRequested + 1 })),

  getFriendlyName: (id) => {
    const state = get()
    return getFriendlyName(state.items, id)
  },
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
