import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const experiment: ExperimentDefinition = {
  id: 'ELEC-11',
  category: 'electromagnetism',
  name: { zh: '把电流表改装成电压表', en: 'Convert Ammeter to Voltmeter' },
  description: {
    zh: '电流表内阻 R_g，满偏电流 I_g。串联一个分压电阻 R 即可改装为量程 U 的电压表：R = (U / I_g) - R_g。',
    en: 'An ammeter with internal resistance R_g and full-scale current I_g can be converted to a voltmeter with range U by adding series resistor R = (U / I_g) - R_g.',
  },
  difficulty: 3,
  formulas: ['R = \\frac{U}{I_g} - R_g', 'U = I_g (R_g + R)'],
  params: [
    {
      key: 'targetVoltage',
      name: { zh: '目标量程 U', en: 'Target Range U' },
      min: 1,
      max: 30,
      default: 3,
      step: 0.5,
      unit: 'V',
    },
    {
      key: 'ig',
      name: { zh: '满偏电流 I_g', en: 'Full-scale I_g' },
      min: 0.1,
      max: 10,
      default: 1,
      step: 0.1,
      unit: 'mA',
    },
    {
      key: 'rg',
      name: { zh: '电流表内阻 R_g', en: 'Ammeter R_g' },
      min: 10,
      max: 1000,
      default: 100,
      step: 10,
      unit: 'Ω',
    },
  ],
  setup: (world, params) => {
    const U = params.targetVoltage ?? 3
    const Ig = (params.ig ?? 1) / 1000
    const Rg = params.rg ?? 100
    const R = U / Ig - Rg

    world.addBody('base', {
      type: 'static',
      shape: 'box',
      dimensions: [2.5, 0.05, 1.2],
      position: [0, 0, 0],
    })

    world.addBody('ammeter', {
      type: 'static',
      shape: 'cylinder',
      dimensions: [0.2, 0.1, 0],
      position: [-0.5, 0.15, 0],
    })
    world.addBody('series-r', {
      type: 'static',
      shape: 'box',
      dimensions: [0.4, 0.1, 0.15],
      position: [0.5, 0.1, 0],
    })
    world.addBody('voltmeter', {
      type: 'static',
      shape: 'cylinder',
      dimensions: [0.25, 0.12, 0],
      position: [0, 0.4, 0],
    })

    const amm = world.getBody('ammeter')!
    amm.rigidBody.userData = {
      targetVoltage: U,
      fullScaleCurrent: Ig * 1000,
      internalR: Rg,
      seriesR: R,
    }

    return {
      bodyLabels: ['base', 'ammeter', 'series-r', 'voltmeter'],
      bodies: [
        {
          label: 'base',
          shape: 'box',
          dimensions: [2.5, 0.05, 1.2],
          material: 'wood',
          color: '#a0826d',
        },
        {
          label: 'ammeter',
          shape: 'cylinder',
          dimensions: [0.2, 0.1, 0],
          material: 'metal',
          color: '#50c878',
        },
        {
          label: 'series-r',
          shape: 'box',
          dimensions: [0.4, 0.1, 0.15],
          material: 'plastic',
          color: '#8b4513',
        },
        {
          label: 'voltmeter',
          shape: 'cylinder',
          dimensions: [0.25, 0.12, 0],
          material: 'metal',
          color: '#4a90e2',
        },
      ],
    }
  },
  dataCollectors: [
    {
      key: 'seriesR',
      name: { zh: '串联电阻 R', en: 'Series R' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('ammeter')?.rigidBody.userData as Record<string, number> | undefined)
          ?.seriesR ?? 0,
    },
    {
      key: 'totalR',
      name: { zh: '总电阻', en: 'Total R' },
      type: 'scalar',
      collect: (world) => {
        const d = world.getBody('ammeter')?.rigidBody.userData as Record<string, number> | undefined
        return d ? d.seriesR + d.internalR : 0
      },
    },
  ],
  guideSteps: [
    {
      title: { zh: '串联分压原理', en: 'Series Voltage Division' },
      description: {
        zh: '电流表满偏时，两端电压仅 I_g·R_g，远小于目标量程。需串联大电阻分压。',
        en: "At full scale, the ammeter's voltage is only I_g·R_g. A large series resistor is needed.",
      },
    },
    {
      title: { zh: '计算分压电阻', en: 'Calculate Series R' },
      description: {
        zh: 'R = (U/I_g) - R_g。改装后总内阻 R_V = R + R_g。',
        en: 'R = (U/I_g) - R_g. Total internal resistance R_V = R + R_g.',
      },
      hint: {
        zh: '改装后电压表内阻越大，对电路影响越小。',
        en: 'Higher voltmeter internal resistance → less circuit impact.',
      },
    },
  ],
  thumbnail: 'ammeter-to-voltmeter',
}

registerExperiment(experiment)
