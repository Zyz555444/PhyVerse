import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSandboxStore } from '../sandboxStore'
import { usePhysics } from '@/features/physics/usePhysics'

export function ManualStepper() {
  const { world } = usePhysics()
  const stepRequested = useSandboxStore((s) => s.stepRequested)
  const lastSeenRef = useRef(stepRequested)

  useFrame(() => {
    if (stepRequested !== lastSeenRef.current) {
      lastSeenRef.current = stepRequested
      if (world && world.isReady) {
        world.step()
      }
    }
  })
  return null
}
