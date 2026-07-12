import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const experiment: ExperimentDefinition = {
  id: 'ELEC-03',
  category: 'electromagnetism',
  name: { zh: '测定电源的电动势和内阻', en: 'Measure EMF and Internal Resistance' },
  description: {
    zh: '由闭合电路欧姆定律 E = U + Ir，改变外电阻测多组 (U, I)，作 U-I 图。直线截距为电动势 E，斜率大小为内阻 r。',
    en: "From E = U + Ir, vary external resistance to get multiple (U, I) pairs. The U-I line's intercept is EMF E, slope magnitude is internal resistance r.",
  },
  difficulty: 3,
  formulas: ['E = U + Ir', 'r = \\frac{E - U}{I}'],
  params: [
    {
      key: 'emf',
      name: { zh: '电动势 E', en: 'EMF E' },
      min: 1.5,
      max: 12,
      default: 4.5,
      step: 0.1,
      unit: 'V',
    },
    {
      key: 'internalR',
      name: { zh: '内阻 r', en: 'Internal r' },
      min: 0.1,
      max: 5,
      default: 1,
      step: 0.1,
      unit: 'Ω',
    },
    {
      key: 'externalR',
      name: { zh: '外电阻 R', en: 'External R' },
      min: 1,
      max: 50,
      default: 10,
      step: 1,
      unit: 'Ω',
    },
  ],
  setup: (world, params) => {
    const E = params.emf ?? 4.5
    const r = params.internalR ?? 1
    const R = params.externalR ?? 10
    const I = E / (R + r)
    const U = I * R

    world.addBody('base', {
      type: 'static',
      shape: 'box',
      dimensions: [2.5, 0.05, 1.2],
      position: [0, 0, 0],
    })

    world.addBody('battery', {
      type: 'static',
      shape: 'box',
      dimensions: [0.3, 0.3, 0.2],
      position: [-1, 0.2, 0],
    })

    world.addBody('resistor', {
      type: 'static',
      shape: 'box',
      dimensions: [0.5, 0.15, 0.2],
      position: [1, 0.13, 0],
    })

    world.addBody('voltmeter', {
      type: 'static',
      shape: 'cylinder',
      dimensions: [0.25, 0.08, 0],
      position: [1, 0.4, 0.4],
    })

    world.addBody('ammeter', {
      type: 'static',
      shape: 'cylinder',
      dimensions: [0.25, 0.08, 0],
      position: [0, 0.4, 0.4],
    })

    const resistor = world.getBody('resistor')!
    resistor.rigidBody.userData = { emf: E, internalR: r, externalR: R, voltage: U, current: I }

    return {
      bodyLabels: ['base', 'battery', 'resistor', 'voltmeter', 'ammeter'],
      bodies: [
        {
          label: 'base',
          shape: 'box',
          dimensions: [2.5, 0.05, 1.2],
          material: 'wood',
          color: '#a0826d',
        },
        {
          label: 'battery',
          shape: 'box',
          dimensions: [0.3, 0.3, 0.2],
          material: 'metal',
          color: '#333',
        },
        {
          label: 'resistor',
          shape: 'box',
          dimensions: [0.5, 0.15, 0.2],
          material: 'plastic',
          color: '#8b4513',
        },
        {
          label: 'voltmeter',
          shape: 'cylinder',
          dimensions: [0.25, 0.08, 0],
          material: 'metal',
          color: '#4a90e2',
        },
        {
          label: 'ammeter',
          shape: 'cylinder',
          dimensions: [0.25, 0.08, 0],
          material: 'metal',
          color: '#50c878',
        },
      ],
    }
  },
  dataCollectors: [
    {
      key: 'terminalVoltage',
      name: { zh: '路端电压 U', en: 'Terminal Voltage U' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('resistor')?.rigidBody.userData as Record<string, number> | undefined)
          ?.voltage ?? 0,
    },
    {
      key: 'current',
      name: { zh: '电流 I', en: 'Current I' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('resistor')?.rigidBody.userData as Record<string, number> | undefined)
          ?.current ?? 0,
    },
    {
      key: 'internalDrop',
      name: { zh: '内压降 Ir', en: 'Internal Drop Ir' },
      type: 'scalar',
      collect: (world) => {
        const d = world.getBody('resistor')?.rigidBody.userData as
          Record<string, number> | undefined
        return d ? d.current * d.internalR : 0
      },
    },
  ],
  guideSteps: [
    {
      title: { zh: '理解闭合电路', en: 'Understand Closed Circuit' },
      description: {
        zh: '电源有内阻，电流流过时产生内压降。U_外 = E - Ir。',
        en: 'A battery has internal resistance; current causes internal voltage drop. U_external = E - Ir.',
      },
    },
    {
      title: { zh: '外电阻变化的影响', en: 'Effect of External R' },
      description: {
        zh: '外电阻增大时，电流减小，路端电压增大（接近 E）。',
        en: 'As external R increases, current decreases and terminal voltage rises toward E.',
      },
      hint: { zh: 'U-I 图中斜率 = -r。', en: 'In U-I plot, slope = -r.' },
    },
  ],
  thumbnail: 'emf-internal-resistance',
}

registerExperiment(experiment)
