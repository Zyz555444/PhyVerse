import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { PhysicsWorld } from './PhysicsWorld'
import { PhysicsContext, type PhysicsContextValue } from './PhysicsContext'
import { usePhysicsSettingsStore } from '@/features/settings/physicsSettingsStore'
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
  const settings = usePhysicsSettingsStore()
  const globalConfig = useMemo(() => settings.toConfig(), [settings])
  const mergedConfig = useMemo<PhysicsWorldConfig>(
    () => ({ ...globalConfig, ...config }),
    [globalConfig, config]
  )
  const [world] = useState(() => new PhysicsWorld(mergedConfig))

  useEffect(() => {
    world.setGravity(mergedConfig.gravity[0], mergedConfig.gravity[1], mergedConfig.gravity[2])
    world.setTimestep(mergedConfig.timestep)
  }, [world, mergedConfig])

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
