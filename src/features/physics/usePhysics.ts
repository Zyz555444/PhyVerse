import { useContext } from 'react'
import { PhysicsContext, type PhysicsContextValue } from './PhysicsContext'

export function usePhysics(): PhysicsContextValue {
  const ctx = useContext(PhysicsContext)
  if (!ctx) {
    throw new Error('usePhysics must be used within a PhysicsProvider')
  }
  return ctx
}
