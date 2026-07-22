import { Box } from '@react-three/drei'
import { useShallow } from 'zustand/shallow'
import { usePhysics } from '@/features/physics/usePhysics'
import { useSandboxStore } from '@/features/sandbox/sandboxStore'

const KE_COLOR = '#f97316' // orange
const PE_COLOR = '#3b82f6' // blue
const BAR_WIDTH = 0.15
const BAR_HEIGHT = 0.04
const MAX_BAR_LENGTH = 1.5
const BAR_OFFSET_Y = 0.8

/**
 * Renders kinetic and potential energy bars on dynamic bodies.
 * Shows KE (orange) and PE (blue) as horizontal bars above each body.
 */
export function EnergyBar({ isRunning }: { isRunning: boolean }) {
  const { world } = usePhysics()
  const { items, gravity, showEnergyBar } = useSandboxStore(
    useShallow((s) => ({
      items: s.items,
      gravity: s.gravity,
      showEnergyBar: s.editorConfig.showEnergyBar,
    }))
  )

  if (!isRunning || !showEnergyBar) return null

  return (
    <group>
      {items.map((item) => {
        if (!item.isDynamic) return null
        const record = world?.getBody(item.id)
        if (!record) return null

        const rb = record.rigidBody
        const pos = rb.translation()
        const v = rb.linvel()
        const mass = item.mass
        const speed = Math.hypot(v.x, v.y, v.z)
        const ke = 0.5 * mass * speed * speed
        const pe = mass * Math.abs(gravity[1]) * Math.max(0, pos.y)
        const totalEnergy = ke + pe
        const maxEnergy = Math.max(totalEnergy, 1)

        // Bar lengths proportional to energy
        const keLen = Math.min((ke / maxEnergy) * MAX_BAR_LENGTH, MAX_BAR_LENGTH)
        const peLen = Math.min((pe / maxEnergy) * MAX_BAR_LENGTH, MAX_BAR_LENGTH)

        const barY = pos.y + BAR_OFFSET_Y
        const barX = pos.x - MAX_BAR_LENGTH / 2

        return (
          <group key={item.id}>
            {/* KE bar (orange) */}
            <Box
              args={[keLen, BAR_HEIGHT, BAR_WIDTH]}
              position={[barX + keLen / 2, barY + 0.06, pos.z]}
            >
              <meshBasicMaterial color={KE_COLOR} transparent opacity={0.8} depthTest={false} />
            </Box>
            {/* PE bar (blue) */}
            <Box args={[peLen, BAR_HEIGHT, BAR_WIDTH]} position={[barX + peLen / 2, barY, pos.z]}>
              <meshBasicMaterial color={PE_COLOR} transparent opacity={0.8} depthTest={false} />
            </Box>
            {/* Total energy background */}
            <Box
              args={[MAX_BAR_LENGTH, BAR_HEIGHT * 2 + 0.02, BAR_WIDTH]}
              position={[barX + MAX_BAR_LENGTH / 2, barY + 0.03, pos.z]}
            >
              <meshBasicMaterial color="#ffffff" transparent opacity={0.15} depthTest={false} />
            </Box>
          </group>
        )
      })}
    </group>
  )
}
