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
  /** Simulation speed multiplier. Default: 1 */
  timeScale?: number
}

export function PhysicsProvider({
  children,
  config,
  autoStep = true,
  fixedTimestep,
  timeScale = 1,
}: PhysicsProviderProps) {
  const settings = usePhysicsSettingsStore()
  const globalConfig = useMemo(() => settings.toConfig(), [settings])
  const mergedConfig = useMemo<PhysicsWorldConfig>(
    () => ({ ...globalConfig, ...config }),
    [globalConfig, config]
  )
  const [world, setWorld] = useState<PhysicsWorld | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Async initialization of physics world
  useEffect(() => {
    let mounted = true
    const initPhysics = async () => {
      try {
        // Initialize Rapier WASM if needed
        await PhysicsWorld.init()
        if (!mounted) return
        
        const newWorld = new PhysicsWorld(mergedConfig)
        setWorld(newWorld)
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize physics world:', error)
      }
    }
    
    initPhysics()
    
    return () => {
      mounted = false
      if (world) {
        world.dispose()
      }
    }
  }, []) // Only run once on mount

  useEffect(() => {
    if (!world) return
    world.setGravity(mergedConfig.gravity[0], mergedConfig.gravity[1], mergedConfig.gravity[2])
    world.setTimestep(mergedConfig.timestep)
  }, [world, mergedConfig])

  const accumulatorRef = useRef(0)

  useFrame((_, delta) => {
    if (!world || !world.isReady || !autoStep) return

    const timestep = fixedTimestep ?? world.getTimestep()
    const scaledDelta = delta * timeScale
    accumulatorRef.current += Math.min(scaledDelta, 0.1)

    while (accumulatorRef.current >= timestep) {
      world.setTimestep(timestep)
      world.step()
      accumulatorRef.current -= timestep
    }
  })

  const ctxValue: PhysicsContextValue = useMemo(() => ({ world, isReady: isInitialized && world !== null }), [world, isInitialized])

  return <PhysicsContext.Provider value={ctxValue}>{children}</PhysicsContext.Provider>
}
