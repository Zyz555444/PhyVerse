import { create } from 'zustand'
import type { PhysicsWorldConfig } from '@/shared/types/physics'

const STORAGE_KEY = 'phyverse-physics-settings'

export interface PhysicsSettingsState {
  gravity: [number, number, number]
  timestep: number
  maxSubSteps: number
  allowSleep: boolean
  friction: number
  restitution: number

  setGravity: (gravity: [number, number, number]) => void
  setGravityY: (y: number) => void
  setTimestep: (timestep: number) => void
  setMaxSubSteps: (steps: number) => void
  setAllowSleep: (allow: boolean) => void
  setFriction: (friction: number) => void
  setRestitution: (restitution: number) => void
  resetToDefaults: () => void
  toConfig: () => PhysicsWorldConfig
}

const DEFAULT_GRAVITY: [number, number, number] = [0, -9.81, 0]
const DEFAULT_TIMESTEP = 1 / 60
const DEFAULT_MAX_SUB_STEPS = 4
const DEFAULT_FRICTION = 0.5
const DEFAULT_RESTITUTION = 0.3

function loadStoredSettings(): Partial<PhysicsSettingsState> {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Partial<PhysicsSettingsState>
    return parsed
  } catch (err) {
    console.warn('[physicsSettingsStore] failed to parse stored settings, using defaults:', err)
    return {}
  }
}

function buildInitialState(): Omit<
  PhysicsSettingsState,
  | 'setGravity'
  | 'setGravityY'
  | 'setTimestep'
  | 'setMaxSubSteps'
  | 'setAllowSleep'
  | 'setFriction'
  | 'setRestitution'
  | 'resetToDefaults'
  | 'toConfig'
> {
  const stored = loadStoredSettings()
  return {
    gravity: stored.gravity ?? DEFAULT_GRAVITY,
    timestep: stored.timestep ?? DEFAULT_TIMESTEP,
    maxSubSteps: stored.maxSubSteps ?? DEFAULT_MAX_SUB_STEPS,
    allowSleep: stored.allowSleep ?? true,
    friction: stored.friction ?? DEFAULT_FRICTION,
    restitution: stored.restitution ?? DEFAULT_RESTITUTION,
  }
}

export const usePhysicsSettingsStore = create<PhysicsSettingsState>((set, get) => ({
  ...buildInitialState(),

  setGravity: (gravity) => set({ gravity }),
  setGravityY: (y) => set({ gravity: [0, y, 0] }),
  setTimestep: (timestep) => set({ timestep }),
  setMaxSubSteps: (maxSubSteps) => set({ maxSubSteps }),
  setAllowSleep: (allowSleep) => set({ allowSleep }),
  setFriction: (friction) => set({ friction }),
  setRestitution: (restitution) => set({ restitution }),

  resetToDefaults: () =>
    set({
      gravity: DEFAULT_GRAVITY,
      timestep: DEFAULT_TIMESTEP,
      maxSubSteps: DEFAULT_MAX_SUB_STEPS,
      allowSleep: true,
      friction: DEFAULT_FRICTION,
      restitution: DEFAULT_RESTITUTION,
    }),

  toConfig: () => ({
    gravity: get().gravity,
    timestep: get().timestep,
    maxSubSteps: get().maxSubSteps,
    allowSleep: get().allowSleep,
    contactMaterial: {
      friction: get().friction,
      restitution: get().restitution,
    },
  }),
}))

usePhysicsSettingsStore.subscribe((state) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    console.warn('[physicsSettingsStore] failed to persist settings:', err)
  }
})
