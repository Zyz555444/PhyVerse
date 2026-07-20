import { useFrame } from '@react-three/fiber'
import { useSandboxStore } from '../sandboxStore'
import { usePhysics } from '@/features/physics/usePhysics'

export function ImpulseApplier() {
  const { world } = usePhysics()
  const pendingImpulse = useSandboxStore((s) => s.pendingImpulse)
  const clearPendingImpulse = useSandboxStore((s) => s.clearPendingImpulse)

  useFrame(() => {
    if (!pendingImpulse || !world?.isReady) return
    const record = world.getBody(pendingImpulse.itemId)
    if (record) {
      const [x, y, z] = pendingImpulse.impulse
      record.rigidBody.applyImpulse({ x, y, z }, true)
    }
    clearPendingImpulse()
  })

  return null
}
