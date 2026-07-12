import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const experiment: ExperimentDefinition = {
  id: 'OPT-05',
  category: 'optics',
  name: { zh: '用牛顿环干涉测透镜曲率半径', en: "Newton's Rings" },
  description: {
    zh: '平凸透镜放在平玻璃板上，单色光垂直入射形成等厚干涉圆环。第 k 级暗环半径 r_k 满足 r_k² = kRλ，R 为透镜曲率半径。',
    en: 'A plano-convex lens on a flat glass plate forms concentric interference rings under monochromatic light. The k-th dark ring: r_k² = kRλ.',
  },
  difficulty: 3,
  formulas: ['r_k^2 = k R \\lambda', 'R = \\frac{r_k^2}{k\\lambda}'],
  params: [
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
      key: 'radius',
      name: { zh: '透镜曲率半径 R', en: 'Lens Radius R' },
      min: 0.5,
      max: 5,
      default: 1,
      step: 0.1,
      unit: 'm',
    },
    {
      key: 'ringOrder',
      name: { zh: '环级次 k', en: 'Ring Order k' },
      min: 1,
      max: 20,
      default: 5,
      step: 1,
      unit: '',
    },
  ],
  setup: (world, params) => {
    const lambda = (params.wavelength ?? 589) * 1e-9
    const R = params.radius ?? 1
    const k = Math.round(params.ringOrder ?? 5)
    const r_k = Math.sqrt(k * R * lambda) * 1000 // mm

    world.addBody('base', {
      type: 'static',
      shape: 'box',
      dimensions: [2, 0.05, 1.5],
      position: [0, 0, 0],
    })

    // 平凸透镜
    world.addBody('lens', {
      type: 'static',
      shape: 'sphere',
      dimensions: [0.3, 0, 0],
      position: [0, 0.2, 0],
    })
    // 平玻璃板
    world.addBody('glass-plate', {
      type: 'static',
      shape: 'box',
      dimensions: [0.6, 0.02, 0.6],
      position: [0, 0.05, 0],
    })

    const lens = world.getBody('lens')!
    lens.rigidBody.userData = {
      wavelength: lambda * 1e9,
      radius: R,
      ringOrder: k,
      ringRadius: r_k,
    }

    return {
      bodyLabels: ['base', 'lens', 'glass-plate'],
      bodies: [
        {
          label: 'base',
          shape: 'box',
          dimensions: [2, 0.05, 1.5],
          material: 'wood',
          color: '#a0826d',
        },
        {
          label: 'lens',
          shape: 'sphere',
          dimensions: [0.3, 0, 0],
          material: 'glass',
          color: '#a0d8ef',
        },
        {
          label: 'glass-plate',
          shape: 'box',
          dimensions: [0.6, 0.02, 0.6],
          material: 'glass',
          color: '#c0e0f0',
        },
      ],
    }
  },
  dataCollectors: [
    {
      key: 'ringRadius',
      name: { zh: '环半径 r_k', en: 'Ring Radius r_k' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('lens')?.rigidBody.userData as Record<string, number> | undefined)
          ?.ringRadius ?? 0,
    },
    {
      key: 'wavelength',
      name: { zh: '波长 λ', en: 'Wavelength λ' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('lens')?.rigidBody.userData as Record<string, number> | undefined)
          ?.wavelength ?? 0,
    },
  ],
  guideSteps: [
    {
      title: { zh: '观察牛顿环', en: "Observe Newton's Rings" },
      description: {
        zh: '中心为暗斑，向外明暗相间的同心圆环。',
        en: 'Dark center with alternating bright/dark concentric rings.',
      },
    },
    {
      title: { zh: '测量曲率半径', en: 'Measure Curvature Radius' },
      description: {
        zh: 'R = r_k² / (kλ)。测第 k 级暗环直径，计算半径。',
        en: 'R = r_k² / (kλ). Measure k-th dark ring diameter to get radius.',
      },
      hint: {
        zh: '测直径比测半径更准确。',
        en: 'Measuring diameter is more accurate than radius.',
      },
    },
  ],
  thumbnail: 'newton-rings',
}

registerExperiment(experiment)
