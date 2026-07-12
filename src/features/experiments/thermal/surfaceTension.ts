import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const experiment: ExperimentDefinition = {
  id: 'THERM-03',
  category: 'thermal',
  name: { zh: '液体表面张力实验', en: 'Surface Tension' },
  description: {
    zh: '液体表面有尽量缩小面积的趋势，这是表面张力的表现。表面张力系数 α = F/L，F 为作用在长度 L 上的力。',
    en: 'Liquid surfaces tend to minimize area due to surface tension. Coefficient α = F/L, where F acts on length L.',
  },
  difficulty: 1,
  formulas: ['F = \\alpha L', '\\alpha = \\frac{F}{L}'],
  params: [
    {
      key: 'surfaceTension',
      name: { zh: '表面张力系数 α', en: 'Surface Tension α' },
      min: 20,
      max: 500,
      default: 72,
      step: 1,
      unit: 'mN/m',
    },
    {
      key: 'frameWidth',
      name: { zh: '膜框宽度 L', en: 'Frame Width L' },
      min: 1,
      max: 10,
      default: 3,
      step: 0.5,
      unit: 'cm',
    },
  ],
  setup: (world, params) => {
    const alpha = (params.surfaceTension ?? 72) / 1000 // N/m
    const L = (params.frameWidth ?? 3) / 100 // m
    const F = alpha * L * 2 // 两个表面

    world.addBody('base', {
      type: 'static',
      shape: 'box',
      dimensions: [2, 0.05, 1],
      position: [0, 0, 0],
    })

    // 金属框
    world.addBody('frame', {
      type: 'static',
      shape: 'box',
      dimensions: [0.5, 0.4, 0.02],
      position: [0, 0.3, 0],
    })
    // 液膜
    world.addBody('film', {
      type: 'static',
      shape: 'box',
      dimensions: [0.4, 0.3, 0.001],
      position: [0, 0.3, 0],
    })
    // 可移动边
    world.addBody('movable-bar', {
      type: 'dynamic',
      shape: 'box',
      dimensions: [0.02, 0.02, 0.05],
      position: [0.2, 0.1, 0],
      mass: 0.01,
      friction: 0,
      linearDamping: 0.8,
    })

    const bar = world.getBody('movable-bar')!
    bar.rigidBody.userData = {
      surfaceTension: alpha * 1000,
      frameWidth: L * 100,
      force: F * 1000, // mN
    }

    return {
      bodyLabels: ['base', 'frame', 'film', 'movable-bar'],
      bodies: [
        {
          label: 'base',
          shape: 'box',
          dimensions: [2, 0.05, 1],
          material: 'wood',
          color: '#a0826d',
        },
        {
          label: 'frame',
          shape: 'box',
          dimensions: [0.5, 0.4, 0.02],
          material: 'metal',
          color: '#666',
        },
        {
          label: 'film',
          shape: 'box',
          dimensions: [0.4, 0.3, 0.001],
          material: 'glass',
          color: '#a0d8ef',
        },
        {
          label: 'movable-bar',
          shape: 'box',
          dimensions: [0.02, 0.02, 0.05],
          material: 'metal',
          color: '#c89b3c',
        },
      ],
    }
  },
  dataCollectors: [
    {
      key: 'force',
      name: { zh: '表面张力 F', en: 'Surface Tension F' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('movable-bar')?.rigidBody.userData as Record<string, number> | undefined)
          ?.force ?? 0,
    },
    {
      key: 'surfaceTension',
      name: { zh: '张力系数 α', en: 'Coefficient α' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('movable-bar')?.rigidBody.userData as Record<string, number> | undefined)
          ?.surfaceTension ?? 0,
    },
  ],
  guideSteps: [
    {
      title: { zh: '观察表面张力', en: 'Observe Surface Tension' },
      description: {
        zh: '液膜收缩，带动可移动边向内移动。',
        en: 'The film contracts, pulling the movable bar inward.',
      },
    },
    {
      title: { zh: '测量张力系数', en: 'Measure Tension Coefficient' },
      description: {
        zh: 'α = F/(2L)。液膜有两个表面，故 F = 2αL。',
        en: 'α = F/(2L). Film has two surfaces, so F = 2αL.',
      },
      hint: { zh: '水 20°C 时 α ≈ 72.8 mN/m。', en: 'Water at 20°C: α ≈ 72.8 mN/m.' },
    },
  ],
  thumbnail: 'surface-tension',
}

registerExperiment(experiment)
