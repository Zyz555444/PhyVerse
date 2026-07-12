import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const experiment: ExperimentDefinition = {
  id: 'OPT-04',
  category: 'optics',
  name: { zh: '光的偏振性研究（马吕斯定律）', en: "Polarization (Malus's Law)" },
  description: {
    zh: '自然光通过起偏器变为线偏振光。再通过检偏器，透射光强 I = I₀ cos²θ。θ 为两偏振片透光轴夹角。',
    en: 'Natural light through a polarizer becomes linearly polarized. Through an analyzer, intensity I = I₀ cos²θ. θ is the angle between polarizer axes.',
  },
  difficulty: 2,
  formulas: ['I = I_0 \\cos^2\\theta', 'I_0 = \\frac{I_{natural}}{2}'],
  params: [
    {
      key: 'analyzerAngle',
      name: { zh: '检偏器角度 θ', en: 'Analyzer Angle θ' },
      min: 0,
      max: 90,
      default: 30,
      step: 1,
      unit: '°',
    },
    {
      key: 'initialIntensity',
      name: { zh: '初始光强 I₀', en: 'Initial Intensity I₀' },
      min: 10,
      max: 100,
      default: 50,
      step: 5,
      unit: 'cd',
    },
  ],
  setup: (world, params) => {
    const thetaDeg = params.analyzerAngle ?? 30
    const theta = (thetaDeg * Math.PI) / 180
    const I0 = params.initialIntensity ?? 50
    const I = I0 * Math.cos(theta) ** 2

    world.addBody('base', {
      type: 'static',
      shape: 'box',
      dimensions: [3, 0.05, 0.8],
      position: [0, 0, 0],
    })

    world.addBody('light-source', {
      type: 'static',
      shape: 'sphere',
      dimensions: [0.08, 0, 0],
      position: [-1.2, 0.3, 0],
    })
    world.addBody('polarizer', {
      type: 'static',
      shape: 'cylinder',
      dimensions: [0.2, 0.02, 0],
      position: [-0.4, 0.3, 0],
    })
    world.addBody('analyzer', {
      type: 'static',
      shape: 'cylinder',
      dimensions: [0.2, 0.02, 0],
      position: [0.4, 0.3, 0],
    })
    world.addBody('screen', {
      type: 'static',
      shape: 'box',
      dimensions: [0.02, 0.3, 0.3],
      position: [1.2, 0.3, 0],
    })

    const analyzer = world.getBody('analyzer')!
    analyzer.rigidBody.userData = {
      analyzerAngle: thetaDeg,
      initialIntensity: I0,
      transmittedIntensity: I,
    }

    return {
      bodyLabels: ['base', 'light-source', 'polarizer', 'analyzer', 'screen'],
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
          label: 'polarizer',
          shape: 'cylinder',
          dimensions: [0.2, 0.02, 0],
          material: 'glass',
          color: '#80c0ff',
        },
        {
          label: 'analyzer',
          shape: 'cylinder',
          dimensions: [0.2, 0.02, 0],
          material: 'glass',
          color: '#80a0ff',
        },
        {
          label: 'screen',
          shape: 'box',
          dimensions: [0.02, 0.3, 0.3],
          material: 'paper',
          color: '#f5f5dc',
        },
      ],
    }
  },
  dataCollectors: [
    {
      key: 'transmittedIntensity',
      name: { zh: '透射光强 I', en: 'Transmitted I' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('analyzer')?.rigidBody.userData as Record<string, number> | undefined)
          ?.transmittedIntensity ?? 0,
    },
    {
      key: 'analyzerAngle',
      name: { zh: '夹角 θ', en: 'Angle θ' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('analyzer')?.rigidBody.userData as Record<string, number> | undefined)
          ?.analyzerAngle ?? 0,
    },
  ],
  guideSteps: [
    {
      title: { zh: '偏振片的作用', en: 'Polarizer Function' },
      description: {
        zh: '起偏器将自然光变为偏振光，检偏器检测偏振方向。',
        en: 'Polarizer converts natural to polarized light; analyzer checks polarization direction.',
      },
    },
    {
      title: { zh: '马吕斯定律', en: "Malus's Law" },
      description: {
        zh: 'I = I₀ cos²θ。θ = 90° 时全暗（正交偏振）。',
        en: 'I = I₀ cos²θ. At θ = 90°, fully dark (crossed polarizers).',
      },
      hint: { zh: 'θ = 0° 时 I = I₀；θ = 90° 时 I = 0。', en: 'θ = 0°: I = I₀; θ = 90°: I = 0.' },
    },
  ],
  thumbnail: 'polarization',
}

registerExperiment(experiment)
