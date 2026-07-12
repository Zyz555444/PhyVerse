import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const experiment: ExperimentDefinition = {
  id: 'ELEC-08',
  category: 'electromagnetism',
  name: { zh: '练习使用示波器', en: 'Using an Oscilloscope' },
  description: {
    zh: '示波器显示电压随时间变化的波形。调节扫描时间 (TIME/DIV) 和垂直灵敏度 (VOLTS/DIV) 观察正弦波。信号频率 f = 1/T。',
    en: 'An oscilloscope displays voltage vs. time. Adjust TIME/DIV and VOLTS/DIV to observe sine waves. Frequency f = 1/T.',
  },
  difficulty: 2,
  formulas: ['f = \\frac{1}{T}', 'V_{pp} = 2 V_m'],
  params: [
    {
      key: 'frequency',
      name: { zh: '信号频率', en: 'Signal Frequency' },
      min: 10,
      max: 1000,
      default: 100,
      step: 10,
      unit: 'Hz',
    },
    {
      key: 'amplitude',
      name: { zh: '信号幅值', en: 'Amplitude' },
      min: 0.1,
      max: 5,
      default: 2,
      step: 0.1,
      unit: 'V',
    },
  ],
  setup: (world, params) => {
    const f = params.frequency ?? 100
    const A = params.amplitude ?? 2
    const T = 1 / f
    const Vpp = 2 * A

    world.addBody('base', {
      type: 'static',
      shape: 'box',
      dimensions: [2.5, 0.05, 1.5],
      position: [0, 0, 0],
    })

    world.addBody('oscilloscope', {
      type: 'static',
      shape: 'box',
      dimensions: [1.2, 0.8, 0.5],
      position: [0, 0.45, 0],
    })

    world.addBody('screen', {
      type: 'static',
      shape: 'box',
      dimensions: [0.8, 0.5, 0.01],
      position: [0, 0.5, 0.26],
    })

    const screen = world.getBody('screen')!
    screen.rigidBody.userData = { frequency: f, amplitude: A, period: T, vpp: Vpp }

    return {
      bodyLabels: ['base', 'oscilloscope', 'screen'],
      bodies: [
        {
          label: 'base',
          shape: 'box',
          dimensions: [2.5, 0.05, 1.5],
          material: 'wood',
          color: '#a0826d',
        },
        {
          label: 'oscilloscope',
          shape: 'box',
          dimensions: [1.2, 0.8, 0.5],
          material: 'plastic',
          color: '#333',
        },
        {
          label: 'screen',
          shape: 'box',
          dimensions: [0.8, 0.5, 0.01],
          material: 'glass',
          color: '#0f7a3a',
        },
      ],
    }
  },
  dataCollectors: [
    {
      key: 'period',
      name: { zh: '周期 T', en: 'Period T' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('screen')?.rigidBody.userData as Record<string, number> | undefined)
          ?.period ?? 0,
    },
    {
      key: 'frequency',
      name: { zh: '频率 f', en: 'Frequency f' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('screen')?.rigidBody.userData as Record<string, number> | undefined)
          ?.frequency ?? 0,
    },
    {
      key: 'vpp',
      name: { zh: '峰峰值 V_pp', en: 'Peak-Peak V_pp' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('screen')?.rigidBody.userData as Record<string, number> | undefined)?.vpp ??
        0,
    },
  ],
  guideSteps: [
    {
      title: { zh: '调节扫描时间', en: 'Adjust Time Base' },
      description: {
        zh: 'TIME/DIV 决定横轴每格代表的时间，使屏幕显示 2-3 个完整周期。',
        en: 'TIME/DIV sets the time per horizontal division, showing 2-3 complete periods.',
      },
    },
    {
      title: { zh: '测量频率', en: 'Measure Frequency' },
      description: {
        zh: '读取一个完整周期的格数 × TIME/DIV = T，f = 1/T。',
        en: "Read one period's division count × TIME/DIV = T, then f = 1/T.",
      },
      hint: { zh: 'f = 1/T，单位 Hz。', en: 'f = 1/T in Hz.' },
    },
  ],
  thumbnail: 'oscilloscope',
}

registerExperiment(experiment)
