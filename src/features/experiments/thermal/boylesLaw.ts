import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const experiment: ExperimentDefinition = {
  id: 'THERM-02',
  category: 'thermal',
  name: { zh: '验证玻意耳定律（气体等温变化）', en: "Boyle's Law (Isothermal)" },
  description: {
    zh: '一定质量气体在温度不变时，压强与体积成反比：PV = 常数。增大压强 P，体积 V 减小，乘积保持恒定。',
    en: 'At constant temperature, gas pressure and volume are inversely proportional: PV = const. As P increases, V decreases, product stays constant.',
  },
  difficulty: 2,
  formulas: ['PV = \\text{const}', 'P_1 V_1 = P_2 V_2'],
  params: [
    {
      key: 'pressure',
      name: { zh: '压强 P', en: 'Pressure P' },
      min: 0.5,
      max: 5,
      default: 1,
      step: 0.1,
      unit: 'atm',
    },
    {
      key: 'initialVolume',
      name: { zh: '初始体积 V₀', en: 'Initial Volume V₀' },
      min: 0.5,
      max: 5,
      default: 1,
      step: 0.1,
      unit: 'L',
    },
  ],
  setup: (world, params) => {
    const P0 = params.pressure ?? 1
    const V0 = params.initialVolume ?? 1
    const PV = P0 * V0
    // 在 P 作用下的体积
    const V = PV / P0

    world.addBody('base', {
      type: 'static',
      shape: 'box',
      dimensions: [2, 0.05, 1],
      position: [0, 0, 0],
    })

    // 气缸
    world.addBody('cylinder', {
      type: 'static',
      shape: 'cylinder',
      dimensions: [0.2, 0.6, 0],
      position: [0, 0.4, 0],
    })
    // 活塞
    world.addBody('piston', {
      type: 'dynamic',
      shape: 'cylinder',
      dimensions: [0.22, 0.05, 0],
      position: [0, 0.5, 0],
      mass: 1,
      friction: 0.1,
      linearDamping: 0.5,
    })
    // 气体（球体可视化）
    world.addBody('gas-particle', {
      type: 'static',
      shape: 'sphere',
      dimensions: [0.1, 0, 0],
      position: [0, 0.2, 0],
    })

    const piston = world.getBody('piston')!
    piston.rigidBody.userData = {
      pressure: P0,
      volume: V,
      initialVolume: V0,
      product: PV,
    }

    return {
      bodyLabels: ['base', 'cylinder', 'piston', 'gas-particle'],
      bodies: [
        {
          label: 'base',
          shape: 'box',
          dimensions: [2, 0.05, 1],
          material: 'wood',
          color: '#a0826d',
        },
        {
          label: 'cylinder',
          shape: 'cylinder',
          dimensions: [0.2, 0.6, 0],
          material: 'glass',
          color: '#a0d8ef',
        },
        {
          label: 'piston',
          shape: 'cylinder',
          dimensions: [0.22, 0.05, 0],
          material: 'metal',
          color: '#666',
        },
        {
          label: 'gas-particle',
          shape: 'sphere',
          dimensions: [0.1, 0, 0],
          material: 'glass',
          color: '#ffd700',
        },
      ],
    }
  },
  dataCollectors: [
    {
      key: 'pressure',
      name: { zh: '压强 P', en: 'Pressure P' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('piston')?.rigidBody.userData as Record<string, number> | undefined)
          ?.pressure ?? 0,
    },
    {
      key: 'volume',
      name: { zh: '体积 V', en: 'Volume V' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('piston')?.rigidBody.userData as Record<string, number> | undefined)
          ?.volume ?? 0,
    },
    {
      key: 'product',
      name: { zh: 'PV 乘积', en: 'PV Product' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('piston')?.rigidBody.userData as Record<string, number> | undefined)
          ?.product ?? 0,
    },
  ],
  guideSteps: [
    {
      title: { zh: '等温过程', en: 'Isothermal Process' },
      description: {
        zh: '温度恒定，压强与体积成反比。',
        en: 'At constant temperature, pressure and volume are inversely proportional.',
      },
    },
    {
      title: { zh: '验证 PV = 常数', en: 'Verify PV = const' },
      description: {
        zh: '改变压强测量体积，PV 应保持恒定。',
        en: 'Vary pressure and measure volume; PV should remain constant.',
      },
      hint: { zh: 'P-V 图中为双曲线。', en: 'P-V plot is a hyperbola.' },
    },
  ],
  thumbnail: 'boyles-law',
}

registerExperiment(experiment)
