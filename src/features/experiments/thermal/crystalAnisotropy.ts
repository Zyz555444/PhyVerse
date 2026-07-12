import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const experiment: ExperimentDefinition = {
  id: 'THERM-04',
  category: 'thermal',
  name: { zh: '晶体与非晶体各向异性', en: 'Crystal Anisotropy' },
  description: {
    zh: '晶体（如云母）在不同方向上导热性不同（各向异性）；非晶体（如玻璃）各方向导热性相同（各向同性）。用蜂蜡融化快慢判断。',
    en: 'Crystals (mica) have direction-dependent thermal conductivity (anisotropic); amorphous solids (glass) are isotropic. Tested by wax melting rate.',
  },
  difficulty: 1,
  formulas: ['\\frac{dQ}{dt} = -k A \\frac{dT}{dx}'],
  params: [
    {
      key: 'direction',
      name: { zh: '导热方向', en: 'Direction' },
      min: 0,
      max: 2,
      default: 0,
      step: 1,
      unit: '',
    },
    {
      key: 'material',
      name: { zh: '材料类型', en: 'Material' },
      min: 0,
      max: 1,
      default: 0,
      step: 1,
      unit: '',
    },
  ],
  setup: (world, params) => {
    const dir = Math.round(params.direction ?? 0)
    const mat = Math.round(params.material ?? 0)
    // 晶体在不同方向热导率不同；非晶体各向同性
    const k_mica = [0.35, 0.55, 0.4][dir] // 晶体不同方向
    const k_glass = 0.8 // 玻璃各向同性
    const k = mat === 0 ? k_mica : k_glass
    const meltTime = 30 / k // s

    world.addBody('base', {
      type: 'static',
      shape: 'box',
      dimensions: [2, 0.05, 1.5],
      position: [0, 0, 0],
    })

    // 样品板
    world.addBody('sample', {
      type: 'static',
      shape: 'box',
      dimensions: [0.6, 0.02, 0.6],
      position: [0, 0.1, 0],
    })
    // 蜂蜡（球）
    world.addBody('wax', {
      type: 'static',
      shape: 'sphere',
      dimensions: [0.05, 0, 0],
      position: [0, 0.15, 0],
    })
    // 热源
    world.addBody('heat-source', {
      type: 'static',
      shape: 'box',
      dimensions: [0.1, 0.1, 0.1],
      position: [0, 0.05, 0],
    })

    const sample = world.getBody('sample')!
    sample.rigidBody.userData = {
      direction: dir,
      material: mat,
      thermalConductivity: k,
      meltTime,
    }

    return {
      bodyLabels: ['base', 'sample', 'wax', 'heat-source'],
      bodies: [
        {
          label: 'base',
          shape: 'box',
          dimensions: [2, 0.05, 1.5],
          material: 'wood',
          color: '#a0826d',
        },
        {
          label: 'sample',
          shape: 'box',
          dimensions: [0.6, 0.02, 0.6],
          material: mat === 0 ? 'glass' : 'glass',
          color: mat === 0 ? '#d4c8a8' : '#c0e0f0',
        },
        {
          label: 'wax',
          shape: 'sphere',
          dimensions: [0.05, 0, 0],
          material: 'plastic',
          color: '#ffd700',
        },
        {
          label: 'heat-source',
          shape: 'box',
          dimensions: [0.1, 0.1, 0.1],
          material: 'metal',
          color: '#dc2626',
        },
      ],
    }
  },
  dataCollectors: [
    {
      key: 'thermalConductivity',
      name: { zh: '热导率 k', en: 'Thermal Conductivity k' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('sample')?.rigidBody.userData as Record<string, number> | undefined)
          ?.thermalConductivity ?? 0,
    },
    {
      key: 'meltTime',
      name: { zh: '融化时间', en: 'Melt Time' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('sample')?.rigidBody.userData as Record<string, number> | undefined)
          ?.meltTime ?? 0,
    },
  ],
  guideSteps: [
    {
      title: { zh: '晶体各向异性', en: 'Crystal Anisotropy' },
      description: {
        zh: '云母片不同方向传热速率不同，蜂蜡融化快慢不同。',
        en: 'Mica conducts heat at different rates in different directions; wax melts unevenly.',
      },
    },
    {
      title: { zh: '非晶体各向同性', en: 'Amorphous Isotropy' },
      description: {
        zh: '玻璃片各方向传热相同，蜂蜡融化均匀。',
        en: 'Glass conducts heat equally in all directions; wax melts evenly.',
      },
      hint: {
        zh: '晶体有固定熔点，非晶体无固定熔点。',
        en: 'Crystals have sharp melting points; amorphous solids do not.',
      },
    },
  ],
  thumbnail: 'crystal-anisotropy',
}

registerExperiment(experiment)
