import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { usePhysics } from '@/features/physics/usePhysics'
import { usePhysicsSync } from '@/features/physics/usePhysicsSync'
import { createMaterial } from '@/features/canvas/Materials'
import type { MaterialPreset } from '@/features/canvas/Materials'
import type { BodyRenderInfo, ExperimentDefinition, SetupResult } from '@/shared/types/experiment'

interface ExperimentSetupProps {
  experiment: ExperimentDefinition
  params: Record<string, number>
  children?: ReactNode
}

export function ExperimentSetup({ experiment, params, children }: ExperimentSetupProps) {
  const paramKey = useMemo(() => JSON.stringify(params), [params])
  const mountKey = `${experiment.id}-${paramKey}`

  return (
    <ExperimentSetupInner key={mountKey} experiment={experiment} params={params}>
      {children}
    </ExperimentSetupInner>
  )
}

function ExperimentSetupInner({ experiment, params, children }: ExperimentSetupProps) {
  const { world } = usePhysics()

  const [setupResult] = useState<SetupResult | null>(() => {
    if (!world) return null
    return experiment.setup(world, params)
  })

  useEffect(() => {
    if (!world || !setupResult) return
    const result = setupResult
    return () => {
      result.cleanup?.()
      for (const label of result.bodyLabels) {
        world.removeBody(label)
      }
    }
  }, [world, setupResult])

  if (!setupResult?.bodies) {
    return <>{children}</>
  }

  return (
    <>
      {setupResult.bodies.map((info) => (
        <SyncedBody key={info.label} info={info} />
      ))}
      {children}
    </>
  )
}

interface SyncedBodyProps {
  info: BodyRenderInfo
}

function SyncedBody({ info }: SyncedBodyProps) {
  const meshRef = usePhysicsSync(info.label)

  const material = useMemo(() => {
    const preset = (info.material ?? 'plastic') as MaterialPreset
    return createMaterial(preset, { color: info.color ?? '#ffffff' })
  }, [info.material, info.color])

  const geometry = useMemo(() => {
    const [a, b, c] = info.dimensions
    switch (info.shape) {
      case 'box':
        return <boxGeometry args={[a * 2, b * 2, c * 2]} />
      case 'sphere':
        return <sphereGeometry args={[a, 32, 32]} />
      case 'cylinder':
        return <cylinderGeometry args={[a, a, b * 2, 32]} />
      case 'capsule':
        return <capsuleGeometry args={[a, b * 2, 16, 32]} />
      case 'cone':
        return <coneGeometry args={[a, b * 2, 32]} />
      case 'plane':
        return <boxGeometry args={[a * 2, 0.02, c * 2]} />
      default:
        return <boxGeometry args={[a * 2, b * 2, c * 2]} />
    }
  }, [info.shape, info.dimensions])

  return (
    <mesh ref={meshRef} castShadow receiveShadow material={material}>
      {geometry}
    </mesh>
  )
}
