import { EffectComposer, Bloom, SSAO } from '@react-three/postprocessing'
import { Color } from 'three'

export interface PostProcessingProps {
  enableSSAO?: boolean
  bloomIntensity?: number
  bloomLuminanceThreshold?: number
}

export function PostProcessing({
  enableSSAO = false,
  bloomIntensity = 0.4,
  bloomLuminanceThreshold = 0.85,
}: PostProcessingProps) {
  return (
    <EffectComposer>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={bloomLuminanceThreshold}
        luminanceSmoothing={0.4}
        mipmapBlur
      />
      {enableSSAO ? (
        <SSAO
          samples={16}
          radius={0.05}
          intensity={20}
          luminanceInfluence={0.6}
          color={new Color('#1a1a1a')}
        />
      ) : (
        <></>
      )}
    </EffectComposer>
  )
}
