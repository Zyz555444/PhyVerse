import { create } from 'zustand'
import type { MaterialPreset } from '@/features/canvas/Materials'

export type SandboxShape =
  | 'box'
  | 'sphere'
  | 'cylinder'
  | 'capsule'
  | 'cone'
  | 'plane'
  | 'torus'
  | 'spring'

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
}

export interface SandboxScene {
  gravity: [number, number, number]
  items: SandboxItem[]
}

interface SandboxState {
  items: SandboxItem[]
  selectedId: string | null
  gravity: [number, number, number]

  addItem: (shape: SandboxShape, position?: [number, number, number]) => void
  removeItem: (id: string) => void
  selectItem: (id: string | null) => void
  updateItem: (id: string, patch: Partial<SandboxItem>) => void
  setGravity: (gravity: [number, number, number]) => void
  resetScene: () => void
  loadScene: (scene: SandboxScene) => void
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

let idCounter = 0

function generateId(): string {
  return `sandbox-${++idCounter}`
}

export const useSandboxStore = create<SandboxState>((set) => ({
  items: [],
  selectedId: null,
  gravity: [0, -9.81, 0],

  addItem: (shape, position = [0, 2, 0]) =>
    set((state) => {
      const id = generateId()
      const newItem: SandboxItem = {
        id,
        shape,
        position,
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        size: DEFAULT_SIZES[shape],
        material: shape === 'plane' ? 'wood' : 'plastic',
        color: DEFAULT_COLORS[shape],
        isDynamic: shape !== 'plane',
      }
      return {
        items: [...state.items, newItem],
        selectedId: id,
      }
    }),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),

  selectItem: (id) => set({ selectedId: id }),

  updateItem: (id, patch) =>
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    })),

  setGravity: (gravity) => set({ gravity }),

  resetScene: () =>
    set({
      items: [],
      selectedId: null,
      gravity: [0, -9.81, 0],
    }),

  loadScene: (scene) =>
    set({
      items: scene.items,
      gravity: scene.gravity,
      selectedId: null,
    }),
}))
