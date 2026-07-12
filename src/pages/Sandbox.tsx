import { useI18n } from '@/shared/hooks/useI18n'
import { Scene } from '@/features/canvas/Scene'
import { LabTable } from '@/features/canvas/LabTable'
import { SphereEquipment, BoxEquipment } from '@/features/canvas/Equipment'

export function Sandbox() {
  const { t } = useI18n()

  return (
    <div className="py-6">
      <div className="mb-4">
        <h1 className="font-heading text-3xl text-text-primary">{t('nav.sandbox')}</h1>
        <p className="mt-2 text-text-secondary">{t('app.tagline')}</p>
      </div>
      <div className="h-[70vh] overflow-hidden rounded-xl border border-border bg-paper-tertiary">
        <Scene cameraPosition={[6, 5, 6]} cameraView="free">
          <LabTable position={[0, 0, 0]} size={[6, 4]} height={0.8} />
          <SphereEquipment position={[0, 1.5, 0]} radius={0.25} material="metal" color="#33a6b8" />
          <BoxEquipment
            position={[1.5, 1.1, 0]}
            size={[0.4, 0.4, 0.4]}
            material="wood"
            color="#8b6f47"
          />
          <BoxEquipment
            position={[-1.5, 1.1, 0.5]}
            size={[0.3, 0.6, 0.3]}
            material="glass"
            color="#a0d4e0"
          />
        </Scene>
      </div>
    </div>
  )
}
