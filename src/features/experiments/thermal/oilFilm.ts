import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const experiment: ExperimentDefinition = {
  id: 'THERM-01',
  category: 'thermal',
  name: { zh: '用油膜法估测分子直径', en: 'Oil Film Method for Molecular Diameter' },
  description: {
    zh: '将油酸酒精溶液滴在水面，油酸展开形成单分子油膜。测出油膜面积 S 和油酸体积 V，分子直径 d = V/S。',
    en: 'Drop oleic acid solution on water; it spreads to a monolayer. Measure area S and volume V; molecule diameter d = V/S.',
  },
  difficulty: 2,
  formulas: ['d = \\frac{V}{S}', 'V = c \\cdot V_{drop}'],
  params: [
    {
      key: 'dropVolume',
      name: { zh: '液滴体积 V₀', en: 'Drop Volume V₀' },
      min: 0.01,
      max: 1,
      default: 0.05,
      step: 0.01,
      unit: 'mL',
    },
    {
      key: 'concentration',
      name: { zh: '油酸浓度 c', en: 'Concentration c' },
      min: 0.001,
      max: 0.1,
      default: 0.01,
      step: 0.001,
      unit: '',
    },
    {
      key: 'filmArea',
      name: { zh: '油膜面积 S', en: 'Film Area S' },
      min: 50,
      max: 2000,
      default: 500,
      step: 10,
      unit: 'cm²',
    },
  ],
  setup: (world, params) => {
    const V0 = (params.dropVolume ?? 0.05) * 1e-6 // m³
    const c = params.concentration ?? 0.01
    const V = c * V0
    const S = (params.filmArea ?? 500) * 1e-4 // m²
    const d = V / S // m
    const d_nm = d * 1e9

    world.addBody('base', {
      type: 'static',
      shape: 'box',
      dimensions: [2, 0.05, 1.5],
      position: [0, 0, 0],
    })

    // 水槽
    world.addBody('tray', {
      type: 'static',
      shape: 'box',
      dimensions: [1.2, 0.1, 0.8],
      position: [0, 0.1, 0],
    })
    // 油膜
    world.addBody('oil-film', {
      type: 'static',
      shape: 'cylinder',
      dimensions: [0.5, 0.001, 0],
      position: [0, 0.21, 0],
    })

    const film = world.getBody('oil-film')!
    film.rigidBody.userData = {
      dropVolume: V0 * 1e6,
      concentration: c,
      filmArea: S * 1e4,
      moleculeDiameter: d_nm,
    }

    return {
      bodyLabels: ['base', 'tray', 'oil-film'],
      bodies: [
        {
          label: 'base',
          shape: 'box',
          dimensions: [2, 0.05, 1.5],
          material: 'wood',
          color: '#a0826d',
        },
        {
          label: 'tray',
          shape: 'box',
          dimensions: [1.2, 0.1, 0.8],
          material: 'glass',
          color: '#a0d8ef',
        },
        {
          label: 'oil-film',
          shape: 'cylinder',
          dimensions: [0.5, 0.001, 0],
          material: 'glass',
          color: '#ffd700',
        },
      ],
    }
  },
  dataCollectors: [
    {
      key: 'moleculeDiameter',
      name: { zh: '分子直径 d', en: 'Molecule Diameter d' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('oil-film')?.rigidBody.userData as Record<string, number> | undefined)
          ?.moleculeDiameter ?? 0,
    },
    {
      key: 'filmArea',
      name: { zh: '油膜面积 S', en: 'Film Area S' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('oil-film')?.rigidBody.userData as Record<string, number> | undefined)
          ?.filmArea ?? 0,
    },
  ],
  guideSteps: [
    {
      title: { zh: '形成单分子层', en: 'Form Monolayer' },
      description: {
        zh: '油酸在水面上展开形成单分子层，分子竖直排列。',
        en: 'Oleic acid spreads to a single-molecule layer with molecules standing vertically.',
      },
    },
    {
      title: { zh: '估测分子大小', en: 'Estimate Molecule Size' },
      description: {
        zh: 'd = V/S。V 为油酸体积（浓度 × 液滴体积）。',
        en: 'd = V/S. V is oleic acid volume (concentration × drop volume).',
      },
      hint: { zh: '油酸分子 d ≈ 10⁻¹⁰ m。', en: 'Oleic acid d ≈ 10⁻¹⁰ m.' },
    },
  ],
  thumbnail: 'oil-film',
}

registerExperiment(experiment)
