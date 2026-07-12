import type { PhysicsWorld } from '@/features/physics/PhysicsWorld'
import type { ShapeType } from '@/shared/types/physics'

export type ExperimentCategory = 'mechanics' | 'electromagnetism' | 'optics' | 'thermal' | 'modern'

export type Difficulty = 1 | 2 | 3 | 4

export interface LocalizedText {
  zh: string
  en: string
}

export interface ParamDef {
  key: string
  name: LocalizedText
  min: number
  max: number
  default: number
  step: number
  unit: string
}

export type MaterialPresetName = 'metal' | 'plastic' | 'glass' | 'wood' | 'rubber' | 'paper'

export interface BodyRenderInfo {
  label: string
  shape: ShapeType
  /** Interpreted per shape: box=[hx,hy,hz], sphere=[r,_,_], cylinder/capsule/cone=[r,halfH,_], plane=[halfW,_,halfD] */
  dimensions: [number, number, number]
  material?: MaterialPresetName
  color?: string
}

export interface SetupResult {
  /** Labels of rigid bodies created during setup */
  bodyLabels: string[]
  /** Render info for each body — drives 3D mesh rendering */
  bodies?: BodyRenderInfo[]
  /** Labels of joints created during setup */
  jointLabels?: string[]
  /** Optional cleanup function called when the experiment is torn down */
  cleanup?: () => void
}

export interface DataCollector {
  key: string
  name: LocalizedText
  type: 'scalar' | 'vector' | 'energy'
  collect: (world: PhysicsWorld) => number
}

export interface GuideStep {
  title: LocalizedText
  description: LocalizedText
  hint?: LocalizedText
  /** Optional check — returns true when the step is complete */
  checkComplete?: (world: PhysicsWorld) => boolean
}

export interface ExperimentDefinition {
  id: string
  category: ExperimentCategory
  name: LocalizedText
  description: LocalizedText
  difficulty: Difficulty
  formulas: string[]
  params: ParamDef[]
  setup: (world: PhysicsWorld, params: Record<string, number>) => SetupResult
  dataCollectors: DataCollector[]
  guideSteps: GuideStep[]
  thumbnail: string
}
