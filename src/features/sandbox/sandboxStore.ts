import { create } from 'zustand'
import type { MaterialPreset } from '@/features/canvas/Materials'

export type SandboxShape =
  'box' | 'sphere' | 'cylinder' | 'capsule' | 'cone' | 'plane' | 'torus' | 'spring'

export type SandboxCameraView = 'free' | 'top' | 'front' | 'side'
export type GizmoMode = 'translate' | 'rotate' | 'scale'

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
  history: HistoryState
  editorConfig: SandboxEditorConfig
  clipboard: SandboxItem | null

  addItem: (shape: SandboxShape, position?: [number, number, number]) => void
  removeItem: (id: string) => void
  selectItem: (id: string | null) => void
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
  return {
    id: generateId(),
    shape,
    position: position ?? [offsetX, 3, offsetZ],
    rotation: [0, 0, 0],
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

function snapshot(state: Pick<SandboxState, 'items' | 'gravity'>): SandboxScene {
  return { items: state.items, gravity: state.gravity }
}

const HISTORY_LIMIT = 50

function pushHistory(state: Pick<SandboxState, 'items' | 'gravity' | 'history'>): HistoryState {
  return {
    past: [...state.history.past, snapshot(state)].slice(-HISTORY_LIMIT),
    future: [],
  }
}

function commitHistoryState(
  state: Pick<SandboxState, 'items' | 'gravity' | 'history'>
): HistoryState {
  return {
    past: [...state.history.past, snapshot(state)].slice(-HISTORY_LIMIT),
    future: [],
  }
}

export const useSandboxStore = create<SandboxState>((set) => ({
  items: [],
  selectedId: null,
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
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
      history: pushHistory(state),
    })),

  selectItem: (id) => set({ selectedId: id }),

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
      const source = state.items.find((item) => item.id === id)
      if (!source) return state
      const newItem: SandboxItem = {
        ...source,
        id: generateId(),
        position: [source.position[0] + 0.5, source.position[1], source.position[2] + 0.5],
      }
      return {
        items: [...state.items, newItem],
        selectedId: newItem.id,
        history: pushHistory(state),
      }
    }),

  copyItem: (id) =>
    set((state) => {
      const source = state.items.find((item) => item.id === id)
      return { clipboard: source ? { ...source } : null }
    }),

  pasteItem: () =>
    set((state) => {
      if (!state.clipboard) return state
      const pasted: SandboxItem = {
        ...state.clipboard,
        id: generateId(),
        position: [
          state.clipboard.position[0] + 0.5,
          state.clipboard.position[1],
          state.clipboard.position[2] + 0.5,
        ],
      }
      return {
        items: [...state.items, pasted],
        selectedId: pasted.id,
        history: pushHistory(state),
      }
    }),

  setGravity: (gravity) =>
    set(() => ({
      gravity,
    })),

  resetScene: () =>
    set((state) => ({
      items: [],
      selectedId: null,
      gravity: DEFAULT_GRAVITY,
      history: pushHistory(state),
    })),

  clearScene: () =>
    set((state) => ({
      items: [],
      selectedId: null,
      history: pushHistory(state),
    })),

  loadScene: (scene) =>
    set((state) => ({
      items: scene.items,
      gravity: scene.gravity,
      selectedId: null,
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
        gravity: previous.gravity,
        selectedId: null,
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
        gravity: next.gravity,
        selectedId: null,
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
