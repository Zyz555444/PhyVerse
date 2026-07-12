import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const experiment: ExperimentDefinition = {
  id: 'ELEC-05',
  category: 'electromagnetism',
  name: { zh: '用惠斯通电桥测电阻', en: 'Wheatstone Bridge' },
  description: {
    zh: '惠斯通电桥由四个臂组成。当检流计示数为零时电桥平衡：Rx = R3 · (R2 / R1)。平衡条件是对臂电阻乘积相等。',
    en: 'A Wheatstone bridge has four arms. When the galvanometer reads zero, the bridge balances: Rx = R3 · (R2 / R1). The balance condition is equal products of opposite arms.',
  },
  difficulty: 3,
  formulas: ['R_x = R_3 \\cdot \\frac{R_2}{R_1}', 'R_1 R_3 = R_2 R_x'],
  params: [
    {
      key: 'r1',
      name: { zh: 'R1', en: 'R1' },
      min: 10,
      max: 1000,
      default: 100,
      step: 10,
      unit: 'Ω',
    },
    {
      key: 'r2',
      name: { zh: 'R2', en: 'R2' },
      min: 10,
      max: 1000,
      default: 200,
      step: 10,
      unit: 'Ω',
    },
    {
      key: 'r3',
      name: { zh: 'R3', en: 'R3' },
      min: 10,
      max: 1000,
      default: 150,
      step: 10,
      unit: 'Ω',
    },
  ],
  setup: (world, params) => {
    const R1 = params.r1 ?? 100
    const R2 = params.r2 ?? 200
    const R3 = params.r3 ?? 150
    const Rx = R3 * (R2 / R1)
    const balanced = Math.abs(R1 * R3 - R2 * Rx) < 0.001

    world.addBody('base', {
      type: 'static',
      shape: 'box',
      dimensions: [2.5, 0.05, 2],
      position: [0, 0, 0],
    })

    // 四个臂呈菱形排列
    const armPos: [number, number, number][] = [
      [-0.8, 0.2, 0],
      [0, 0.2, 0.8],
      [0.8, 0.2, 0],
      [0, 0.2, -0.8],
    ]
    const labels = ['arm-r1', 'arm-r2', 'arm-r3', 'arm-rx']
    armPos.forEach((pos, i) => {
      world.addBody(labels[i], {
        type: 'static',
        shape: 'box',
        dimensions: [0.3, 0.1, 0.15],
        position: pos,
      })
    })

    world.addBody('galvanometer', {
      type: 'static',
      shape: 'cylinder',
      dimensions: [0.2, 0.1, 0],
      position: [0, 0.4, 0],
    })

    const g = world.getBody('galvanometer')!
    g.rigidBody.userData = { R1, R2, R3, Rx, balanced }

    return {
      bodyLabels: ['base', ...labels, 'galvanometer'],
      bodies: [
        {
          label: 'base',
          shape: 'box',
          dimensions: [2.5, 0.05, 2],
          material: 'wood',
          color: '#a0826d',
        },
        {
          label: 'arm-r1',
          shape: 'box',
          dimensions: [0.3, 0.1, 0.15],
          material: 'plastic',
          color: '#8b4513',
        },
        {
          label: 'arm-r2',
          shape: 'box',
          dimensions: [0.3, 0.1, 0.15],
          material: 'plastic',
          color: '#8b4513',
        },
        {
          label: 'arm-r3',
          shape: 'box',
          dimensions: [0.3, 0.1, 0.15],
          material: 'plastic',
          color: '#8b4513',
        },
        {
          label: 'arm-rx',
          shape: 'box',
          dimensions: [0.3, 0.1, 0.15],
          material: 'plastic',
          color: '#dc2626',
        },
        {
          label: 'galvanometer',
          shape: 'cylinder',
          dimensions: [0.2, 0.1, 0],
          material: 'metal',
          color: '#4a90e2',
        },
      ],
    }
  },
  dataCollectors: [
    {
      key: 'rx',
      name: { zh: '待测电阻 Rx', en: 'Unknown Rx' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('galvanometer')?.rigidBody.userData as Record<string, number> | undefined)
          ?.Rx ?? 0,
    },
    {
      key: 'balanced',
      name: { zh: '平衡状态', en: 'Balanced' },
      type: 'scalar',
      collect: (world) =>
        (
          world.getBody('galvanometer')?.rigidBody.userData as
            Record<string, number | boolean> | undefined
        )?.balanced
          ? 1
          : 0,
    },
  ],
  guideSteps: [
    {
      title: { zh: '电桥平衡条件', en: 'Balance Condition' },
      description: {
        zh: '当对臂电阻乘积相等时电桥平衡，检流计电流为零。',
        en: 'When opposite arm products are equal, the bridge balances and galvanometer reads zero.',
      },
    },
    {
      title: { zh: '计算 Rx', en: 'Calculate Rx' },
      description: {
        zh: 'Rx = R3 · (R2 / R1)。调节 R3 使检流计归零。',
        en: 'Rx = R3 · (R2 / R1). Adjust R3 until galvanometer zeros.',
      },
      hint: { zh: '平衡时 R1·R3 = R2·Rx。', en: 'At balance: R1·R3 = R2·Rx.' },
    },
  ],
  thumbnail: 'wheatstone-bridge',
}

registerExperiment(experiment)
