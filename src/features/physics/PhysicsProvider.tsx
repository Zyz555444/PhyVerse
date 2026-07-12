import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { PhysicsWorld } from './PhysicsWorld'
import { PhysicsContext, type PhysicsContextValue } from './PhysicsContext'
import type { PhysicsWorldConfig } from '@/shared/types/physics'

interface PhysicsProviderProps {
  children: ReactNode
  config?: Partial<PhysicsWorldConfig>
  /** Whether to auto-step the physics world each frame. Default: true */
  autoStep?: boolean
  /** Fixed timestep override (seconds). If not set, uses config.timestep */
  fixedTimestep?: number
}

export function PhysicsProvider({
  children,
  config,
  autoStep = true,
  fixedTimestep,
}: PhysicsProviderProps) {
  const [world] = useState(() => new PhysicsWorld(config))

  useEffect(() => {
    return () => {
      world.dispose()
    }
  }, [world])

  const accumulatorRef = useRef(0)

  useFrame((_, delta) => {
    if (!world.isReady || !autoStep) return

    const timestep = fixedTimestep ?? world.getTimestep()
    accumulatorRef.current += Math.min(delta, 0.1)

    while (accumulatorRef.current >= timestep) {
      world.setTimestep(timestep)
      world.step()
      accumulatorRef.current -= timestep
    }
  })

  const ctxValue: PhysicsContextValue = useMemo(() => ({ world, isReady: true }), [world])

  return <PhysicsContext.Provider value={ctxValue}>{children}</PhysicsContext.Provider>
}
