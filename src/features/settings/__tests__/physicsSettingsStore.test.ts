import { describe, it, expect, beforeEach } from 'vitest'
import { usePhysicsSettingsStore } from '../physicsSettingsStore'

const DEFAULTS = {
  gravity: [0, -9.81, 0] as [number, number, number],
  timestep: 1 / 60,
  maxSubSteps: 4,
  allowSleep: true,
  friction: 0.5,
  restitution: 0.3,
}

describe('physicsSettingsStore', () => {
  beforeEach(() => {
    usePhysicsSettingsStore.getState().resetToDefaults()
  })

  it('exposes the expected default values', () => {
    const state = usePhysicsSettingsStore.getState()
    expect(state.gravity).toEqual(DEFAULTS.gravity)
    expect(state.timestep).toBeCloseTo(DEFAULTS.timestep)
    expect(state.maxSubSteps).toBe(DEFAULTS.maxSubSteps)
    expect(state.allowSleep).toBe(true)
    expect(state.friction).toBe(DEFAULTS.friction)
    expect(state.restitution).toBe(DEFAULTS.restitution)
  })

  it('setGravity replaces the full gravity vector', () => {
    usePhysicsSettingsStore.getState().setGravity([1, 2, 3])
    expect(usePhysicsSettingsStore.getState().gravity).toEqual([1, 2, 3])
  })

  it('setGravityY only changes the vertical component', () => {
    usePhysicsSettingsStore.getState().setGravityY(-3.7)
    expect(usePhysicsSettingsStore.getState().gravity).toEqual([0, -3.7, 0])
  })

  it('updates scalar settings via their setters', () => {
    const store = usePhysicsSettingsStore.getState()
    store.setTimestep(1 / 120)
    store.setMaxSubSteps(8)
    store.setAllowSleep(false)
    store.setFriction(0.9)
    store.setRestitution(0.1)

    const state = usePhysicsSettingsStore.getState()
    expect(state.timestep).toBeCloseTo(1 / 120)
    expect(state.maxSubSteps).toBe(8)
    expect(state.allowSleep).toBe(false)
    expect(state.friction).toBe(0.9)
    expect(state.restitution).toBe(0.1)
  })

  it('resetToDefaults restores every value', () => {
    const store = usePhysicsSettingsStore.getState()
    store.setGravity([5, 5, 5])
    store.setFriction(0.99)
    store.resetToDefaults()

    const state = usePhysicsSettingsStore.getState()
    expect(state.gravity).toEqual(DEFAULTS.gravity)
    expect(state.friction).toBe(DEFAULTS.friction)
  })

  it('toConfig maps state into a PhysicsWorldConfig shape', () => {
    const store = usePhysicsSettingsStore.getState()
    store.setGravity([0, -5, 0])
    store.setFriction(0.7)
    store.setRestitution(0.2)

    const config = usePhysicsSettingsStore.getState().toConfig()
    expect(config).toEqual({
      gravity: [0, -5, 0],
      timestep: DEFAULTS.timestep,
      maxSubSteps: DEFAULTS.maxSubSteps,
      allowSleep: true,
      contactMaterial: { friction: 0.7, restitution: 0.2 },
    })
  })

  it('persists changes to localStorage', () => {
    usePhysicsSettingsStore.getState().setMaxSubSteps(6)
    const raw = localStorage.getItem('phyverse-physics-settings')
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw as string).maxSubSteps).toBe(6)
  })
})
