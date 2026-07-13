import { create } from 'zustand'
import type { MaterialPreset } from '@/features/canvas/Materials'

export type SandboxShape =
  'box' | 'sphere' | 'cylinder' | 'capsule' | 'cone' | 'plane' | 'torus' | 'spring'

export type SandboxCameraView = 'free' | 'top' | 'front' | 'side'
export type GizmoMode = 'translate' | 'rotate' | 'scale'

export type JointType = 'spring' | 'fixed' | 'rope'

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
}

interface HistoryState {
  past: SandboxScene[]
  future: SandboxScene[]
}

interface SandboxState extends SandboxScene {
  selectedId: string | null
  multiSelectedIds: string[]
  history: HistoryState
  editorConfig: SandboxEditorConfig
  clipboard: SandboxItem[] | null
  joints: SandboxJoint[]

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

function pushHistory(state: Pick<SandboxState, 'items' | 'gravity' | 'joints' | 'history'>): HistoryState {
  return {
    past: [...state.history.past, snapshot(state)].slice(-HISTORY_LIMIT),
    future: [],
  }
}

function commitHistoryState(
  state: Pick<SandboxState, 'items' | 'gravity' | 'joints' | 'history'>
): HistoryState {
  return {
    past: [...state.history.past, snapshot(state)].slice(-HISTORY_LIMIT),
    future: [],
  }
}

export const useSandboxStore = create<SandboxState>((set) => ({
  items: [],
  joints: [],
  selectedId: null,
  multiSelectedIds: [],
  gravity: DEFAULT_GRAVITY,
  history: { past: [], future: [] },
  editorConfig: DEFAULT_EDITOR_CONFIG,
  clipboard: null,

  addItem: (shape, position) =>
    set((state) => {
      const newItem = createDefaultItem(shape, position)
      return {
        items: [...state.items, newItem],
        selectedId: newItem.id,
        history: pushHistory(state),
      }
    }),

  removeItem: (id) =>
    set((state) => {
      const idsToRemove = state.multiSelectedIds.length > 0
        ? [id, ...state.multiSelectedIds]
        : [id]
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
      return { items: nextItems }
    }),

  updateItemAndCommit: (id, patch) =>
    set((state) => {
      const nextItems = state.items.map((item) => (item.id === id ? { ...item, ...patch } : item))
      if (nextItems.every((item, idx) => item === state.items[idx])) {
        return state
      }
      return {
        items: nextItems,
        history: pushHistory({ ...state, items: nextItems }),
      }
    }),

  commitHistory: () =>
    set((state) => ({
      history: commitHistoryState(state),
    })),

  duplicateItem: (id) =>
    set((state) => {
      const idsToDup = state.multiSelectedIds.length > 0
        ? [id, ...state.multiSelectedIds]
        : [id]
      const dupSet = new Set(idsToDup)
      const sources = state.items.filter((item) => dupSet.has(item.id))
      if (sources.length === 0) return state
      const newItems: SandboxItem[] = sources.map((source) => ({
        ...source,
        id: generateId(),
        position: [
          source.position[0] + 0.5,
          source.position[1],
          source.position[2] + 0.5,
        ] as [number, number, number],
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
      const idsToCopy = state.multiSelectedIds.length > 0
        ? [state.selectedId, ...state.multiSelectedIds].filter(Boolean) as string[]
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
        position: [
          item.position[0] + 0.5,
          item.position[1],
          item.position[2] + 0.5,
        ] as [number, number, number],
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
      history: {
        past: [...state.history.past, snapshot(state)].slice(-HISTORY_LIMIT),
        future: [],
      },
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
}))
