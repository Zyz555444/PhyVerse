import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { usePhysics } from '@/features/physics/usePhysics'
import { useExperimentStore } from './experimentStore'
import type { ExperimentDefinition } from '@/shared/types/experiment'

interface DataCollectorProps {
  experiment: ExperimentDefinition
}

const FRAME_THROTTLE = 6

export function DataCollector({ experiment }: DataCollectorProps) {
  const { world } = usePhysics()
  const frameCountRef = useRef(0)
  const elapsedRef = useRef(0)

  useFrame((_, delta) => {
    if (!world) return

    const isPaused = useExperimentStore.getState().isPaused
    if (isPaused) return

    elapsedRef.current += delta
    useExperimentStore.getState().tickRecording(delta)
    frameCountRef.current += 1

    if (frameCountRef.current < FRAME_THROTTLE) {
      return
    }
    frameCountRef.current = 0

    const t = elapsedRef.current
    const entries: Array<{ key: string; value: number; t: number }> = []
    for (const collector of experiment.dataCollectors) {
      try {
        const value = collector.collect(world)
        entries.push({ key: collector.key, value, t })
      } catch (err) {
        console.warn(`[DataCollector] collector "${collector.key}" failed:`, err)
      }
    }

    if (entries.length > 0) {
      useExperimentStore.getState().pushBatch(entries)
    }
  })

  return null
}
