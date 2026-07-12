import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const experiment: ExperimentDefinition = {
  id: 'ELEC-12',
  category: 'electromagnetism',
  name: { zh: 'RLC 串联电路的暂态过程', en: 'RLC Transient Response' },
  description: {
    zh: 'RLC 串联电路在充放电时呈现振荡、临界、过阻尼三种暂态。阻尼系数 α = R/(2L)，固有频率 ω_0 = 1/√(LC)。当 α < ω_0 时为欠阻尼振荡。',
    en: 'RLC series circuit exhibits underdamped (oscillatory), critically damped, and overdamped transients. α = R/(2L), ω_0 = 1/√(LC). Underdamped when α < ω_0.',
  },
  difficulty: 3,
  formulas: [
    '\\omega_0 = \\frac{1}{\\sqrt{LC}}',
    '\\alpha = \\frac{R}{2L}',
    '\\omega = \\sqrt{\\omega_0^2 - \\alpha^2}',
  ],
  params: [
    {
      key: 'resistance',
      name: { zh: '电阻 R', en: 'Resistance R' },
      min: 1,
      max: 1000,
      default: 50,
      step: 10,
      unit: 'Ω',
    },
    {
      key: 'inductance',
      name: { zh: '电感 L', en: 'Inductance L' },
      min: 0.001,
      max: 1,
      default: 0.1,
      step: 0.01,
      unit: 'H',
    },
    {
      key: 'capacitance',
      name: { zh: '电容 C', en: 'Capacitance C' },
      min: 1e-6,
      max: 1e-3,
      default: 1e-4,
      step: 1e-5,
      unit: 'F',
    },
  ],
  setup: (world, params) => {
    const R = params.resistance ?? 50
    const L = params.inductance ?? 0.1
    const C = params.capacitance ?? 1e-4
    const omega0 = 1 / Math.sqrt(L * C)
    const alpha = R / (2 * L)
    const omega = Math.sqrt(Math.max(0, omega0 * omega0 - alpha * alpha))
    const dampingType = alpha < omega0 ? 'underdamped' : alpha > omega0 ? 'overdamped' : 'critical'

    world.addBody('base', {
      type: 'static',
      shape: 'box',
      dimensions: [2.5, 0.05, 1.2],
      position: [0, 0, 0],
    })

    world.addBody('resistor', {
      type: 'static',
      shape: 'box',
      dimensions: [0.4, 0.1, 0.15],
      position: [-0.8, 0.1, 0],
    })
    world.addBody('inductor', {
      type: 'static',
      shape: 'cylinder',
      dimensions: [0.15, 0.15, 0],
      position: [0, 0.2, 0],
    })
    world.addBody('capacitor', {
      type: 'static',
      shape: 'box',
      dimensions: [0.3, 0.15, 0.1],
      position: [0.8, 0.1, 0],
    })
    world.addBody('oscilloscope', {
      type: 'static',
      shape: 'box',
      dimensions: [0.6, 0.4, 0.3],
      position: [0, 0.6, 0],
    })

    const scope = world.getBody('oscilloscope')!
    scope.rigidBody.userData = {
      resistance: R,
      inductance: L,
      capacitance: C,
      omega0,
      alpha,
      omega,
      dampingType,
    }

    return {
      bodyLabels: ['base', 'resistor', 'inductor', 'capacitor', 'oscilloscope'],
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
          dimensions: [0.4, 0.1, 0.15],
          material: 'plastic',
          color: '#8b4513',
        },
        {
          label: 'inductor',
          shape: 'cylinder',
          dimensions: [0.15, 0.15, 0],
          material: 'metal',
          color: '#c89b3c',
        },
        {
          label: 'capacitor',
          shape: 'box',
          dimensions: [0.3, 0.15, 0.1],
          material: 'plastic',
          color: '#333',
        },
        {
          label: 'oscilloscope',
          shape: 'box',
          dimensions: [0.6, 0.4, 0.3],
          material: 'plastic',
          color: '#1a1a1a',
        },
      ],
    }
  },
  dataCollectors: [
    {
      key: 'omega0',
      name: { zh: '固有频率 ω_0', en: 'Natural Frequency ω_0' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('oscilloscope')?.rigidBody.userData as Record<string, number> | undefined)
          ?.omega0 ?? 0,
    },
    {
      key: 'alpha',
      name: { zh: '阻尼系数 α', en: 'Damping α' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('oscilloscope')?.rigidBody.userData as Record<string, number> | undefined)
          ?.alpha ?? 0,
    },
    {
      key: 'omega',
      name: { zh: '振荡频率 ω', en: 'Oscillation ω' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('oscilloscope')?.rigidBody.userData as Record<string, number> | undefined)
          ?.omega ?? 0,
    },
  ],
  guideSteps: [
    {
      title: { zh: '三种阻尼状态', en: 'Three Damping Regimes' },
      description: {
        zh: '欠阻尼（α < ω_0）：振荡衰减；临界阻尼：最快稳定；过阻尼：缓慢稳定。',
        en: 'Underdamped (α < ω_0): oscillating decay; Critical: fastest settling; Overdamped: slow settling.',
      },
    },
    {
      title: { zh: '调节 R 改变阻尼', en: 'Vary R to Change Damping' },
      description: {
        zh: '增大 R 使阻尼增大，振荡减弱直至消失。',
        en: 'Increasing R raises damping and suppresses oscillation.',
      },
      hint: { zh: '临界阻尼 R = 2√(L/C)。', en: 'Critical damping R = 2√(L/C).' },
    },
  ],
  thumbnail: 'rlc-transient',
}

registerExperiment(experiment)
