import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const experiment: ExperimentDefinition = {
  id: 'ELEC-09',
  category: 'electromagnetism',
  name: { zh: '传感器的简单应用', en: 'Sensor Applications' },
  description: {
    zh: '热敏电阻的阻值随温度升高而减小（NTC），光敏电阻的阻值随光照增强而减小。传感器可将非电学量转换为电学量。',
    en: 'NTC thermistor resistance decreases with temperature; photoresistor resistance decreases with light intensity. Sensors convert non-electrical quantities into electrical ones.',
  },
  difficulty: 2,
  formulas: ['R_T = R_0 e^{B(1/T - 1/T_0)}', 'R_{light} \\propto \\frac{1}{I_{light}}'],
  params: [
    {
      key: 'temperature',
      name: { zh: '温度', en: 'Temperature' },
      min: -20,
      max: 100,
      default: 25,
      step: 1,
      unit: '°C',
    },
    {
      key: 'lightIntensity',
      name: { zh: '光照强度', en: 'Light Intensity' },
      min: 0,
      max: 1000,
      default: 200,
      step: 10,
      unit: 'lx',
    },
  ],
  setup: (world, params) => {
    const T = (params.temperature ?? 25) + 273.15
    const T0 = 298.15
    const R0 = 10000
    const B = 3950
    const R_therm = R0 * Math.exp(B * (1 / T - 1 / T0))
    const I_light = params.lightIntensity ?? 200
    const R_photo = 1000000 / (I_light + 1)

    world.addBody('base', {
      type: 'static',
      shape: 'box',
      dimensions: [2.5, 0.05, 1.2],
      position: [0, 0, 0],
    })

    world.addBody('thermistor', {
      type: 'static',
      shape: 'sphere',
      dimensions: [0.08, 0, 0],
      position: [-0.5, 0.2, 0],
    })
    world.addBody('photoresistor', {
      type: 'static',
      shape: 'cylinder',
      dimensions: [0.1, 0.05, 0],
      position: [0.5, 0.1, 0],
    })
    world.addBody('led', {
      type: 'static',
      shape: 'cylinder',
      dimensions: [0.05, 0.05, 0],
      position: [0.5, 0.4, 0],
    })

    const therm = world.getBody('thermistor')!
    therm.rigidBody.userData = {
      temperature: T - 273.15,
      thermistorR: R_therm,
      photoresistorR: R_photo,
      lightIntensity: I_light,
    }

    return {
      bodyLabels: ['base', 'thermistor', 'photoresistor', 'led'],
      bodies: [
        {
          label: 'base',
          shape: 'box',
          dimensions: [2.5, 0.05, 1.2],
          material: 'wood',
          color: '#a0826d',
        },
        {
          label: 'thermistor',
          shape: 'sphere',
          dimensions: [0.08, 0, 0],
          material: 'plastic',
          color: '#dc2626',
        },
        {
          label: 'photoresistor',
          shape: 'cylinder',
          dimensions: [0.1, 0.05, 0],
          material: 'glass',
          color: '#ffd700',
        },
        {
          label: 'led',
          shape: 'cylinder',
          dimensions: [0.05, 0.05, 0],
          material: 'glass',
          color: '#7fff7f',
        },
      ],
    }
  },
  dataCollectors: [
    {
      key: 'thermistorR',
      name: { zh: '热敏电阻 R_T', en: 'Thermistor R_T' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('thermistor')?.rigidBody.userData as Record<string, number> | undefined)
          ?.thermistorR ?? 0,
    },
    {
      key: 'photoresistorR',
      name: { zh: '光敏电阻 R_L', en: 'Photoresistor R_L' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('thermistor')?.rigidBody.userData as Record<string, number> | undefined)
          ?.photoresistorR ?? 0,
    },
    {
      key: 'temperature',
      name: { zh: '温度', en: 'Temperature' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('thermistor')?.rigidBody.userData as Record<string, number> | undefined)
          ?.temperature ?? 0,
    },
  ],
  guideSteps: [
    {
      title: { zh: '热敏电阻特性', en: 'Thermistor Behavior' },
      description: {
        zh: 'NTC 热敏电阻温度升高时电阻减小。',
        en: 'NTC thermistor resistance decreases as temperature rises.',
      },
    },
    {
      title: { zh: '光敏电阻特性', en: 'Photoresistor Behavior' },
      description: {
        zh: '光强增大时光敏电阻减小，可实现自动控制。',
        en: 'Photoresistor resistance drops with stronger light, enabling automation.',
      },
      hint: { zh: 'R_T = R_0·exp(B·(1/T - 1/T_0))。', en: 'R_T = R_0·exp(B·(1/T - 1/T_0)).' },
    },
  ],
  thumbnail: 'sensors',
}

registerExperiment(experiment)
