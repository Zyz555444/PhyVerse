import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const experiment: ExperimentDefinition = {
  id: 'ELEC-01',
  category: 'electromagnetism',
  name: { zh: '伏安法测电阻', en: 'Measure Resistance by Volt-Ampere Method' },
  description: {
    zh: '用电压表和电流表同时测量电阻两端的电压 U 和通过的电流 I，由欧姆定律 R = U/I 计算电阻。验证线性电阻的 U-I 关系为过原点的直线。',
    en: 'Measure voltage U across and current I through a resistor simultaneously. Calculate resistance R = U/I. Verify that for a linear resistor, the U-I graph is a straight line through the origin.',
  },
  difficulty: 2,
  formulas: ['R = \\frac{U}{I}', 'U = IR'],
  params: [
    {
      key: 'voltage',
      name: { zh: '电压', en: 'Voltage' },
      min: 0,
      max: 12,
      default: 3,
      step: 0.1,
      unit: 'V',
    },
    {
      key: 'resistance',
      name: { zh: '电阻', en: 'Resistance' },
      min: 1,
      max: 50,
      default: 10,
      step: 1,
      unit: 'Ω',
    },
  ],
  setup: (world, params) => {
    const U = params.voltage ?? 3
    const R = params.resistance ?? 10
    const I = U / R

    world.addBody('base', {
      type: 'static',
      shape: 'box',
      dimensions: [2.5, 0.05, 1.2],
      position: [0, 0, 0],
      friction: 0.5,
      restitution: 0.1,
    })

    // 电阻箱 (visual)
    world.addBody('resistor', {
      type: 'static',
      shape: 'box',
      dimensions: [0.6, 0.2, 0.3],
      position: [0, 0.3, 0],
      friction: 0.5,
      restitution: 0.1,
    })

    // 电压表
    world.addBody('voltmeter', {
      type: 'static',
      shape: 'cylinder',
      dimensions: [0.3, 0.1, 0],
      position: [-1.5, 0.15, 0],
      friction: 0.5,
      restitution: 0.1,
    })

    // 电流表
    world.addBody('ammeter', {
      type: 'static',
      shape: 'cylinder',
      dimensions: [0.3, 0.1, 0],
      position: [1.5, 0.15, 0],
      friction: 0.5,
      restitution: 0.1,
    })

    // 电子 (流动可视化)
    const electronLabels: string[] = []
    for (let i = 0; i < 5; i++) {
      const label = `electron-${i}`
      world.addBody(label, {
        type: 'dynamic',
        shape: 'sphere',
        dimensions: [0.04, 0, 0],
        position: [-1.8 + i * 0.7, 0.5, 0],
        mass: 0.001,
        friction: 0,
        restitution: 0.5,
        linearDamping: 0.5,
        angularDamping: 0.5,
      })
      const body = world.getBody(label)!
      body.rigidBody.setLinvel({ x: I * 0.5, y: 0, z: 0 }, true)
      body.rigidBody.userData = { voltage: U, current: I, resistance: R }
      electronLabels.push(label)
    }

    return {
      bodyLabels: ['base', 'resistor', 'voltmeter', 'ammeter', ...electronLabels],
      bodies: [
        {
          label: 'base',
          shape: 'box',
          dimensions: [2.5, 0.05, 1.2],
          material: 'wood',
          color: '#a0826d',
        },
        {
          label: 'resistor',
          shape: 'box',
          dimensions: [0.6, 0.2, 0.3],
          material: 'plastic',
          color: '#8b4513',
        },
        {
          label: 'voltmeter',
          shape: 'cylinder',
          dimensions: [0.3, 0.1, 0],
          material: 'metal',
          color: '#4a90e2',
        },
        {
          label: 'ammeter',
          shape: 'cylinder',
          dimensions: [0.3, 0.1, 0],
          material: 'metal',
          color: '#50c878',
        },
        ...electronLabels.map((label) => ({
          label,
          shape: 'sphere' as const,
          dimensions: [0.04, 0, 0] as [number, number, number],
          material: 'metal' as const,
          color: '#ffd700',
        })),
      ],
    }
  },
  dataCollectors: [
    {
      key: 'voltage',
      name: { zh: '电压 U', en: 'Voltage U' },
      type: 'scalar',
      collect: (world) => {
        const e = world.getBody('electron-0')
        return (e?.rigidBody.userData as Record<string, number> | undefined)?.voltage ?? 0
      },
    },
    {
      key: 'current',
      name: { zh: '电流 I', en: 'Current I' },
      type: 'scalar',
      collect: (world) => {
        const e = world.getBody('electron-0')
        return (e?.rigidBody.userData as Record<string, number> | undefined)?.current ?? 0
      },
    },
    {
      key: 'resistance',
      name: { zh: '电阻 R', en: 'Resistance R' },
      type: 'scalar',
      collect: (world) => {
        const e = world.getBody('electron-0')
        return (e?.rigidBody.userData as Record<string, number> | undefined)?.resistance ?? 0
      },
    },
  ],
  guideSteps: [
    {
      title: { zh: '设置电路参数', en: 'Set Circuit Parameters' },
      description: {
        zh: '调节电压和电阻值，观察电流变化。',
        en: 'Adjust voltage and resistance. Observe the current change.',
      },
    },
    {
      title: { zh: '验证欧姆定律', en: "Verify Ohm's Law" },
      description: {
        zh: '电流与电压成正比，与电阻成反比。R = U/I 保持恒定。',
        en: 'Current is proportional to voltage and inversely proportional to resistance. R = U/I stays constant.',
      },
      hint: { zh: '电压增大一倍，电流也增大一倍。', en: 'Double voltage → double current.' },
    },
  ],
  thumbnail: 'ohms-law',
}

registerExperiment(experiment)
