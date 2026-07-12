import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const experiment: ExperimentDefinition = {
  id: 'OPT-06',
  category: 'optics',
  name: { zh: '光栅衍射测光波波长', en: 'Diffraction Grating' },
  description: {
    zh: '光栅衍射主极大满足光栅方程 d sin θ = kλ。已知光栅常数 d，测第 k 级衍射角 θ，可求波长 λ = d sin θ / k。',
    en: 'Grating diffraction maxima satisfy d sin θ = kλ. With known grating constant d, measure angle θ to get λ = d sin θ / k.',
  },
  difficulty: 3,
  formulas: ['d \\sin\\theta = k\\lambda', '\\lambda = \\frac{d \\sin\\theta}{k}'],
  params: [
    {
      key: 'gratingConstant',
      name: { zh: '光栅常数 d', en: 'Grating Constant d' },
      min: 500,
      max: 5000,
      default: 1000,
      step: 100,
      unit: 'nm',
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
    {
      key: 'order',
      name: { zh: '衍射级次 k', en: 'Order k' },
      min: 1,
      max: 3,
      default: 1,
      step: 1,
      unit: '',
    },
  ],
  setup: (world, params) => {
    const d = (params.gratingConstant ?? 1000) * 1e-9
    const lambda = (params.wavelength ?? 589) * 1e-9
    const k = Math.round(params.order ?? 1)
    const sinTheta = Math.min(1, (k * lambda) / d)
    const theta = Math.asin(sinTheta)
    const thetaDeg = (theta * 180) / Math.PI

    world.addBody('base', {
      type: 'static',
      shape: 'box',
      dimensions: [2, 0.05, 1.5],
      position: [0, 0, 0],
    })

    world.addBody('light-source', {
      type: 'static',
      shape: 'sphere',
      dimensions: [0.08, 0, 0],
      position: [-0.8, 0.3, 0],
    })
    world.addBody('grating', {
      type: 'static',
      shape: 'box',
      dimensions: [0.02, 0.3, 0.4],
      position: [0, 0.3, 0],
    })
    world.addBody('screen', {
      type: 'static',
      shape: 'box',
      dimensions: [0.02, 0.4, 0.4],
      position: [0.8, 0.3, 0],
    })

    const grating = world.getBody('grating')!
    grating.rigidBody.userData = {
      gratingConstant: d * 1e9,
      wavelength: lambda * 1e9,
      order: k,
      diffractionAngle: thetaDeg,
    }

    return {
      bodyLabels: ['base', 'light-source', 'grating', 'screen'],
      bodies: [
        {
          label: 'base',
          shape: 'box',
          dimensions: [2, 0.05, 1.5],
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
          label: 'grating',
          shape: 'box',
          dimensions: [0.02, 0.3, 0.4],
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
      key: 'diffractionAngle',
      name: { zh: '衍射角 θ', en: 'Diffraction Angle θ' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('grating')?.rigidBody.userData as Record<string, number> | undefined)
          ?.diffractionAngle ?? 0,
    },
    {
      key: 'wavelength',
      name: { zh: '波长 λ', en: 'Wavelength λ' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('grating')?.rigidBody.userData as Record<string, number> | undefined)
          ?.wavelength ?? 0,
    },
  ],
  guideSteps: [
    {
      title: { zh: '观察衍射条纹', en: 'Observe Diffraction' },
      description: {
        zh: '中央亮纹两侧出现对称的各级主极大。',
        en: 'Symmetric maxima appear on both sides of the central bright fringe.',
      },
    },
    {
      title: { zh: '应用光栅方程', en: 'Apply Grating Equation' },
      description: {
        zh: 'd sin θ = kλ。高级次衍射角更大，便于测量。',
        en: 'd sin θ = kλ. Higher orders have larger angles, easier to measure.',
      },
      hint: { zh: 'd 通常为 1/刻线数。', en: 'd = 1/(lines per unit length).' },
    },
  ],
  thumbnail: 'diffraction-grating',
}

registerExperiment(experiment)
