import { createContext } from 'react'
import type { PhysicsWorld } from './PhysicsWorld'

export interface PhysicsContextValue {
  world: PhysicsWorld | null
  isReady: boolean
}

export const PhysicsContext = createContext<PhysicsContextValue | null>(null)
