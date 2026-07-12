import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const experiment: ExperimentDefinition = {
  id: 'OPT-02',
  category: 'optics',
  name: { zh: '用双缝干涉测光的波长', en: 'Double-Slit Interference' },
  description: {
    zh: '单色光通过双缝后形成干涉条纹。相邻明纹间距 Δx = Lλ/d。测出 Δx、双缝间距 d 和缝到屏距离 L，可求波长 λ = Δx·d/L。',
    en: 'Monochromatic light through double slits produces interference fringes. Spacing Δx = Lλ/d. Measure to get λ = Δx·d/L.',
  },
  difficulty: 3,
  formulas: ['\\Delta x = \\frac{L\\lambda}{d}', '\\lambda = \\frac{\\Delta x \\cdot d}{L}'],
  params: [
    {
      key: 'slitSpacing',
      name: { zh: '双缝间距 d', en: 'Slit Spacing d' },
      min: 0.1,
      max: 2,
      default: 0.5,
      step: 0.05,
      unit: 'mm',
    },
    {
      key: 'screenDistance',
      name: { zh: '屏距 L', en: 'Screen Distance L' },
      min: 0.5,
      max: 3,
      default: 1,
      step: 0.1,
      unit: 'm',
    },
    {
      key: 'wavelength',
      name: { zh: '波长 λ', en: 'Wavelength λ' },
      min: 400,
      max: 700,
      default: 589,
      step: 10,
      unit: 'nm',
    },
  ],
  setup: (world, params) => {
    const d = (params.slitSpacing ?? 0.5) / 1000
    const L = params.screenDistance ?? 1
    const lambda = (params.wavelength ?? 589) * 1e-9
    const deltaX = ((L * lambda) / d) * 1000 // mm

    world.addBody('base', {
      type: 'static',
      shape: 'box',
      dimensions: [3, 0.05, 0.8],
      position: [0, 0, 0],
    })

    // 光源
    world.addBody('light-source', {
      type: 'static',
      shape: 'sphere',
      dimensions: [0.08, 0, 0],
      position: [-1.2, 0.3, 0],
    })
    // 双缝
    world.addBody('double-slit', {
      type: 'static',
      shape: 'box',
      dimensions: [0.02, 0.2, 0.4],
      position: [-0.4, 0.3, 0],
    })
    // 光屏
    world.addBody('screen', {
      type: 'static',
      shape: 'box',
      dimensions: [0.02, 0.4, 0.4],
      position: [1.2, 0.3, 0],
    })

    const slit = world.getBody('double-slit')!
    slit.rigidBody.userData = {
      slitSpacing: d * 1000,
      screenDistance: L,
      wavelength: lambda * 1e9,
      fringeSpacing: deltaX,
    }

    return {
      bodyLabels: ['base', 'light-source', 'double-slit', 'screen'],
      bodies: [
        {
          label: 'base',
          shape: 'box',
          dimensions: [3, 0.05, 0.8],
          material: 'wood',
          color: '#a0826d',
        },
        {
          label: 'light-source',
          shape: 'sphere',
          dimensions: [0.08, 0, 0],
          material: 'glass',
          color: '#ffeb3b',
        },
        {
          label: 'double-slit',
          shape: 'box',
          dimensions: [0.02, 0.2, 0.4],
          material: 'metal',
          color: '#333',
        },
        {
          label: 'screen',
          shape: 'box',
          dimensions: [0.02, 0.4, 0.4],
          material: 'paper',
          color: '#f5f5dc',
        },
      ],
    }
  },
  dataCollectors: [
    {
      key: 'fringeSpacing',
      name: { zh: '条纹间距 Δx', en: 'Fringe Spacing Δx' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('double-slit')?.rigidBody.userData as Record<string, number> | undefined)
          ?.fringeSpacing ?? 0,
    },
    {
      key: 'wavelength',
      name: { zh: '波长 λ', en: 'Wavelength λ' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('double-slit')?.rigidBody.userData as Record<string, number> | undefined)
          ?.wavelength ?? 0,
    },
  ],
  guideSteps: [
    {
      title: { zh: '观察干涉条纹', en: 'Observe Fringes' },
      description: {
        zh: '屏上出现明暗相间的等距条纹。',
        en: 'Equally spaced bright and dark fringes appear on screen.',
      },
    },
    {
      title: { zh: '计算波长', en: 'Calculate Wavelength' },
      description: {
        zh: 'λ = Δx · d / L。增大 L 或减小 d 可增大条纹间距。',
        en: 'λ = Δx · d / L. Larger L or smaller d increases fringe spacing.',
      },
      hint: { zh: '钠黄光 λ ≈ 589 nm。', en: 'Sodium yellow λ ≈ 589 nm.' },
    },
  ],
  thumbnail: 'double-slit-interference',
}

registerExperiment(experiment)
