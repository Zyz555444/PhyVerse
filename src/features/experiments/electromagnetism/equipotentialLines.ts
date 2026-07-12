import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const experiment: ExperimentDefinition = {
  id: 'ELEC-07',
  category: 'electromagnetism',
  name: { zh: '描绘电场中等势线', en: 'Map Equipotential Lines' },
  description: {
    zh: '在导电纸上放置两个点电极，通电后形成静电场。用探针找到电势相等的点，连接成等势线。等势线与电场线处处垂直。',
    en: 'Place two point electrodes on conductive paper and apply voltage to form an electric field. Use a probe to find equipotential points and connect them. Equipotential lines are perpendicular to field lines.',
  },
  difficulty: 2,
  formulas: ['E = -\\nabla V', '\\oint E \\cdot dl = 0'],
  params: [
    {
      key: 'voltage',
      name: { zh: '电极电压', en: 'Electrode Voltage' },
      min: 1,
      max: 12,
      default: 6,
      step: 0.5,
      unit: 'V',
    },
    {
      key: 'probeRadius',
      name: { zh: '探针位置 r', en: 'Probe Position r' },
      min: 0.5,
      max: 5,
      default: 2,
      step: 0.1,
      unit: 'cm',
    },
  ],
  setup: (world, params) => {
    const U = params.voltage ?? 6
    const r = (params.probeRadius ?? 2) / 100
    // 双电极中垂线上距正极 r 处的电势 (近似)
    const V = (U / 2) * (1 - r / 0.05)

    world.addBody('base', {
      type: 'static',
      shape: 'box',
      dimensions: [2.5, 0.05, 1.5],
      position: [0, 0, 0],
    })

    world.addBody('electrode-pos', {
      type: 'static',
      shape: 'cylinder',
      dimensions: [0.08, 0.1, 0],
      position: [-0.8, 0.1, 0],
    })
    world.addBody('electrode-neg', {
      type: 'static',
      shape: 'cylinder',
      dimensions: [0.08, 0.1, 0],
      position: [0.8, 0.1, 0],
    })

    // 探针
    world.addBody('probe', {
      type: 'static',
      shape: 'sphere',
      dimensions: [0.03, 0, 0],
      position: [-0.4, 0.1, 0],
    })

    const probe = world.getBody('probe')!
    probe.rigidBody.userData = { voltage: U, potential: V, position: r }

    return {
      bodyLabels: ['base', 'electrode-pos', 'electrode-neg', 'probe'],
      bodies: [
        {
          label: 'base',
          shape: 'box',
          dimensions: [2.5, 0.05, 1.5],
          material: 'wood',
          color: '#a0826d',
        },
        {
          label: 'electrode-pos',
          shape: 'cylinder',
          dimensions: [0.08, 0.1, 0],
          material: 'metal',
          color: '#dc2626',
        },
        {
          label: 'electrode-neg',
          shape: 'cylinder',
          dimensions: [0.08, 0.1, 0],
          material: 'metal',
          color: '#4a90e2',
        },
        {
          label: 'probe',
          shape: 'sphere',
          dimensions: [0.03, 0, 0],
          material: 'metal',
          color: '#ffd700',
        },
      ],
    }
  },
  dataCollectors: [
    {
      key: 'potential',
      name: { zh: '电势 V', en: 'Potential V' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('probe')?.rigidBody.userData as Record<string, number> | undefined)
          ?.potential ?? 0,
    },
    {
      key: 'voltage',
      name: { zh: '电源电压', en: 'Source Voltage' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('probe')?.rigidBody.userData as Record<string, number> | undefined)
          ?.voltage ?? 0,
    },
  ],
  guideSteps: [
    {
      title: { zh: '放置电极', en: 'Place Electrodes' },
      description: {
        zh: '在导电纸上放置正负两个点电极，通电后形成稳定电场。',
        en: 'Place positive and negative electrodes on conductive paper to form a steady field.',
      },
    },
    {
      title: { zh: '找等势点', en: 'Find Equipotential Points' },
      description: {
        zh: '用探针找到电势相等的点，连接成等势线。等势线垂直于电场线。',
        en: 'Probe for equal-potential points and connect them. Equipotentials are perpendicular to field lines.',
      },
    },
  ],
  thumbnail: 'equipotential-lines',
}

registerExperiment(experiment)
