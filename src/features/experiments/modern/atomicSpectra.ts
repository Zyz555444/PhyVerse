import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const experiment: ExperimentDefinition = {
  id: 'MOD-03',
  category: 'modern',
  name: { zh: '原子光谱观察', en: 'Atomic Spectra' },
  description: {
    zh: '原子发光产生离散的线状光谱，每条谱线对应一个能级跃迁。玻尔模型：ΔE = hν = E_n - E_m。氢原子可见光谱（巴尔末系）有 4 条主要谱线。',
    en: 'Atoms emit discrete line spectra; each line corresponds to an energy level transition. Bohr model: ΔE = hν = E_n - E_m. Hydrogen visible spectrum (Balmer series) has 4 main lines.',
  },
  difficulty: 2,
  formulas: ['\\Delta E = h\\nu', '\\frac{1}{\\lambda} = R (\\frac{1}{n_1^2} - \\frac{1}{n_2^2})'],
  params: [
    {
      key: 'upperLevel',
      name: { zh: '上能级 n₂', en: 'Upper Level n₂' },
      min: 3,
      max: 6,
      default: 3,
      step: 1,
      unit: '',
    },
  ],
  setup: (world, params) => {
    const n2 = Math.round(params.upperLevel ?? 3)
    const n1 = 2 // 巴尔末系
    const R = 1.097e7 // 里德伯常量
    const lambda = (1 / (R * (1 / (n1 * n1) - 1 / (n2 * n2)))) * 1e9 // nm
    const h = 6.626e-34
    const c = 3e8
    const e = 1.6e-19
    const deltaE = (h * c) / (lambda * 1e-9) / e

    // 谱线颜色
    const lineColor =
      lambda < 450
        ? '#7a5aff'
        : lambda < 500
          ? '#00bfff'
          : lambda < 580
            ? '#7fff7f'
            : lambda < 620
              ? '#ffd700'
              : '#ff4500'

    world.addBody('base', {
      type: 'static',
      shape: 'box',
      dimensions: [2, 0.05, 1],
      position: [0, 0, 0],
    })

    // 光谱管
    world.addBody('spectrum-tube', {
      type: 'static',
      shape: 'cylinder',
      dimensions: [0.1, 0.4, 0],
      position: [-0.6, 0.4, 0],
    })
    // 分光镜
    world.addBody('spectroscope', {
      type: 'static',
      shape: 'box',
      dimensions: [0.5, 0.3, 0.3],
      position: [0.6, 0.3, 0],
    })
    // 谱线
    world.addBody('spectral-line', {
      type: 'static',
      shape: 'box',
      dimensions: [0.02, 0.4, 0.02],
      position: [0.2, 0.4, 0],
    })

    const line = world.getBody('spectral-line')!
    line.rigidBody.userData = {
      upperLevel: n2,
      lowerLevel: n1,
      wavelength: lambda,
      energyDiff: deltaE,
    }

    return {
      bodyLabels: ['base', 'spectrum-tube', 'spectroscope', 'spectral-line'],
      bodies: [
        {
          label: 'base',
          shape: 'box',
          dimensions: [2, 0.05, 1],
          material: 'wood',
          color: '#a0826d',
        },
        {
          label: 'spectrum-tube',
          shape: 'cylinder',
          dimensions: [0.1, 0.4, 0],
          material: 'glass',
          color: '#ffeb3b',
        },
        {
          label: 'spectroscope',
          shape: 'box',
          dimensions: [0.5, 0.3, 0.3],
          material: 'metal',
          color: '#333',
        },
        {
          label: 'spectral-line',
          shape: 'box',
          dimensions: [0.02, 0.4, 0.02],
          material: 'glass',
          color: lineColor,
        },
      ],
    }
  },
  dataCollectors: [
    {
      key: 'wavelength',
      name: { zh: '波长 λ', en: 'Wavelength λ' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('spectral-line')?.rigidBody.userData as Record<string, number> | undefined)
          ?.wavelength ?? 0,
    },
    {
      key: 'energyDiff',
      name: { zh: '能级差 ΔE', en: 'Energy Difference ΔE' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('spectral-line')?.rigidBody.userData as Record<string, number> | undefined)
          ?.energyDiff ?? 0,
    },
  ],
  guideSteps: [
    {
      title: { zh: '观察线状光谱', en: 'Observe Line Spectrum' },
      description: {
        zh: '每种元素都有独特的离散谱线，如同"指纹"。',
        en: 'Each element has unique discrete spectral lines, like a "fingerprint".',
      },
    },
    {
      title: { zh: '玻尔模型解释', en: 'Bohr Model Explanation' },
      description: {
        zh: '电子在能级间跃迁时发射光子，ΔE = hν。巴尔末系对应跃迁到 n=2。',
        en: 'Electrons transitioning between levels emit photons: ΔE = hν. Balmer series ends at n=2.',
      },
      hint: {
        zh: 'Hα (n=3→2) = 656 nm, Hβ (n=4→2) = 486 nm, Hγ = 434 nm, Hδ = 410 nm。',
        en: 'Hα (n=3→2) = 656 nm, Hβ (n=4→2) = 486 nm, Hγ = 434 nm, Hδ = 410 nm.',
      },
    },
  ],
  thumbnail: 'atomic-spectra',
}

registerExperiment(experiment)
