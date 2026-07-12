import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const experiment: ExperimentDefinition = {
  id: 'ELEC-04',
  category: 'electromagnetism',
  name: { zh: '练习使用多用电表', en: 'Using a Multimeter' },
  description: {
    zh: '多用电表可测量电压、电流和电阻。直流电压档并联在被测电路两端，电流档串联在电路中，电阻档需先调零后再测量。',
    en: 'A multimeter measures voltage, current, and resistance. Voltage mode connects in parallel, current mode in series, resistance mode requires zeroing first.',
  },
  difficulty: 2,
  formulas: ['U = IR', 'P = UI'],
  params: [
    {
      key: 'mode',
      name: { zh: '测量模式', en: 'Mode' },
      min: 0,
      max: 2,
      default: 0,
      step: 1,
      unit: '',
    },
    {
      key: 'testVoltage',
      name: { zh: '被测电压', en: 'Test Voltage' },
      min: 0,
      max: 12,
      default: 6,
      step: 0.5,
      unit: 'V',
    },
    {
      key: 'testResistance',
      name: { zh: '被测电阻', en: 'Test Resistance' },
      min: 1,
      max: 1000,
      default: 100,
      step: 10,
      unit: 'Ω',
    },
  ],
  setup: (world, params) => {
    const mode = Math.round(params.mode ?? 0)
    const U = params.testVoltage ?? 6
    const R = params.testResistance ?? 100
    const I = U / R
    const P = U * I

    world.addBody('base', {
      type: 'static',
      shape: 'box',
      dimensions: [2.5, 0.05, 1.2],
      position: [0, 0, 0],
    })

    world.addBody('multimeter', {
      type: 'static',
      shape: 'box',
      dimensions: [0.5, 0.3, 0.3],
      position: [0, 0.2, 0],
    })

    const m = world.getBody('multimeter')!
    m.rigidBody.userData = { mode, voltage: U, current: I, resistance: R, power: P }

    return {
      bodyLabels: ['base', 'multimeter'],
      bodies: [
        {
          label: 'base',
          shape: 'box',
          dimensions: [2.5, 0.05, 1.2],
          material: 'wood',
          color: '#a0826d',
        },
        {
          label: 'multimeter',
          shape: 'box',
          dimensions: [0.5, 0.3, 0.3],
          material: 'plastic',
          color: '#1a1a1a',
        },
      ],
    }
  },
  dataCollectors: [
    {
      key: 'reading',
      name: { zh: '读数', en: 'Reading' },
      type: 'scalar',
      collect: (world) => {
        const d = world.getBody('multimeter')?.rigidBody.userData as
          Record<string, number> | undefined
        if (!d) return 0
        return d.mode === 0 ? d.voltage : d.mode === 1 ? d.current : d.resistance
      },
    },
    {
      key: 'voltage',
      name: { zh: '电压', en: 'Voltage' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('multimeter')?.rigidBody.userData as Record<string, number> | undefined)
          ?.voltage ?? 0,
    },
    {
      key: 'current',
      name: { zh: '电流', en: 'Current' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('multimeter')?.rigidBody.userData as Record<string, number> | undefined)
          ?.current ?? 0,
    },
    {
      key: 'resistance',
      name: { zh: '电阻', en: 'Resistance' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('multimeter')?.rigidBody.userData as Record<string, number> | undefined)
          ?.resistance ?? 0,
    },
  ],
  guideSteps: [
    {
      title: { zh: '选择测量模式', en: 'Select Mode' },
      description: {
        zh: '切换模式：0=电压，1=电流，2=电阻。',
        en: 'Switch mode: 0=Voltage, 1=Current, 2=Resistance.',
      },
    },
    {
      title: { zh: '读数方法', en: 'Reading Method' },
      description: {
        zh: '电压档: 并联, 测 U；电流档: 串联, 测 I；电阻档: 先调零, 再测量。',
        en: 'V: parallel; A: series; Ω: zero first, then measure.',
      },
    },
  ],
  thumbnail: 'multimeter',
}

registerExperiment(experiment)
