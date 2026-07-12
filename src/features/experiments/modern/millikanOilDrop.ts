import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const experiment: ExperimentDefinition = {
  id: 'MOD-02',
  category: 'modern',
  name: { zh: '密立根油滴实验', en: 'Millikan Oil Drop' },
  description: {
    zh: '带电油滴在电场中平衡时 mg = qE，测得 q = mg/E。多次测量发现 q 总是基本电荷 e = 1.6×10⁻¹⁹ C 的整数倍。',
    en: 'A charged oil drop balanced in an electric field: mg = qE. Measurements show q is always an integer multiple of elementary charge e = 1.6×10⁻¹⁹ C.',
  },
  difficulty: 4,
  formulas: ['qE = mg', 'q = \\frac{mg}{E}', 'q = n e'],
  params: [
    {
      key: 'dropRadius',
      name: { zh: '油滴半径 r', en: 'Drop Radius r' },
      min: 0.5,
      max: 5,
      default: 1,
      step: 0.1,
      unit: 'μm',
    },
    {
      key: 'voltage',
      name: { zh: '极板电压 U', en: 'Plate Voltage U' },
      min: 100,
      max: 1000,
      default: 300,
      step: 10,
      unit: 'V',
    },
    {
      key: 'plateDistance',
      name: { zh: '极板距离 d', en: 'Plate Distance d' },
      min: 0.5,
      max: 2,
      default: 1,
      step: 0.1,
      unit: 'cm',
    },
  ],
  setup: (world, params) => {
    const r = (params.dropRadius ?? 1) * 1e-6
    const U = params.voltage ?? 300
    const d = (params.plateDistance ?? 1) / 100
    const E = U / d
    const rho = 900 // 油密度 kg/m³
    const m = (4 / 3) * Math.PI * r ** 3 * rho
    const q = (m * 9.81) / E
    const e = 1.6e-19
    const n = Math.round(q / e)
    const q_actual = n * e

    world.addBody('base', {
      type: 'static',
      shape: 'box',
      dimensions: [2, 0.05, 1.2],
      position: [0, 0, 0],
    })

    // 极板
    world.addBody('plate-top', {
      type: 'static',
      shape: 'box',
      dimensions: [0.8, 0.02, 0.4],
      position: [0, 0.7, 0],
    })
    world.addBody('plate-bottom', {
      type: 'static',
      shape: 'box',
      dimensions: [0.8, 0.02, 0.4],
      position: [0, 0.2, 0],
    })
    // 油滴
    world.addBody('oil-drop', {
      type: 'dynamic',
      shape: 'sphere',
      dimensions: [0.04, 0, 0],
      position: [0, 0.45, 0],
      mass: 0.001,
      friction: 0.5,
      linearDamping: 0.9,
    })

    const drop = world.getBody('oil-drop')!
    drop.rigidBody.userData = {
      dropRadius: r * 1e6,
      voltage: U,
      plateDistance: d * 100,
      electricField: E,
      charge: q_actual,
      elementaryCharges: n,
    }

    return {
      bodyLabels: ['base', 'plate-top', 'plate-bottom', 'oil-drop'],
      bodies: [
        {
          label: 'base',
          shape: 'box',
          dimensions: [2, 0.05, 1.2],
          material: 'wood',
          color: '#a0826d',
        },
        {
          label: 'plate-top',
          shape: 'box',
          dimensions: [0.8, 0.02, 0.4],
          material: 'metal',
          color: '#dc2626',
        },
        {
          label: 'plate-bottom',
          shape: 'box',
          dimensions: [0.8, 0.02, 0.4],
          material: 'metal',
          color: '#4a90e2',
        },
        {
          label: 'oil-drop',
          shape: 'sphere',
          dimensions: [0.04, 0, 0],
          material: 'glass',
          color: '#ffd700',
        },
      ],
    }
  },
  dataCollectors: [
    {
      key: 'charge',
      name: { zh: '电荷量 q', en: 'Charge q' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('oil-drop')?.rigidBody.userData as Record<string, number> | undefined)
          ?.charge ?? 0,
    },
    {
      key: 'elementaryCharges',
      name: { zh: '基本电荷数 n', en: 'Elementary Charges n' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('oil-drop')?.rigidBody.userData as Record<string, number> | undefined)
          ?.elementaryCharges ?? 0,
    },
    {
      key: 'electricField',
      name: { zh: '电场强度 E', en: 'Electric Field E' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('oil-drop')?.rigidBody.userData as Record<string, number> | undefined)
          ?.electricField ?? 0,
    },
  ],
  guideSteps: [
    {
      title: { zh: '平衡测量法', en: 'Balance Method' },
      description: {
        zh: '调节电压使油滴静止，此时 qE = mg。',
        en: 'Adjust voltage until the drop is stationary: qE = mg.',
      },
    },
    {
      title: { zh: '电荷量子化', en: 'Charge Quantization' },
      description: {
        zh: '多次测量发现 q = ne，e = 1.6×10⁻¹⁹ C。',
        en: 'Repeated measurements show q = ne, e = 1.6×10⁻¹⁹ C.',
      },
      hint: {
        zh: '基本电荷是最小电荷单位。',
        en: 'Elementary charge is the smallest unit of charge.',
      },
    },
  ],
  thumbnail: 'millikan-oil-drop',
}

registerExperiment(experiment)
