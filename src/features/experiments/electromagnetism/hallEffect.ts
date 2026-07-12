import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const experiment: ExperimentDefinition = {
  id: 'ELEC-06',
  category: 'electromagnetism',
  name: { zh: '霍尔效应实验', en: 'Hall Effect' },
  description: {
    zh: '将通有电流的导体置于磁场中，载流子受洛伦兹力偏转，在导体两侧产生霍尔电压 U_H = (I B) / (n q d)。霍尔系数 R_H = 1/(n q)。',
    en: 'A current-carrying conductor in a magnetic field: Lorentz force deflects carriers, producing a Hall voltage U_H = (I B) / (n q d). Hall coefficient R_H = 1/(n q).',
  },
  difficulty: 3,
  formulas: ['U_H = \\frac{I B}{n q d}', 'R_H = \\frac{1}{n q}'],
  params: [
    {
      key: 'current',
      name: { zh: '电流 I', en: 'Current I' },
      min: 0.1,
      max: 5,
      default: 1,
      step: 0.1,
      unit: 'A',
    },
    {
      key: 'magneticField',
      name: { zh: '磁感应强度 B', en: 'Magnetic Field B' },
      min: 0,
      max: 2,
      default: 0.5,
      step: 0.05,
      unit: 'T',
    },
    {
      key: 'thickness',
      name: { zh: '导体厚度 d', en: 'Thickness d' },
      min: 0.1,
      max: 5,
      default: 1,
      step: 0.1,
      unit: 'mm',
    },
  ],
  setup: (world, params) => {
    const I = params.current ?? 1
    const B = params.magneticField ?? 0.5
    const d = (params.thickness ?? 1) / 1000
    const n = 8.5e28 // 铜的载流子密度
    const q = 1.6e-19
    const U_H = (I * B) / (n * q * d)
    const R_H = 1 / (n * q)

    world.addBody('base', {
      type: 'static',
      shape: 'box',
      dimensions: [2.5, 0.05, 1.2],
      position: [0, 0, 0],
    })

    // 霍尔元件（导体片）
    world.addBody('hall-plate', {
      type: 'static',
      shape: 'box',
      dimensions: [0.8, 0.02, 0.4],
      position: [0, 0.3, 0],
    })

    // 磁铁（上下）
    world.addBody('magnet-n', {
      type: 'static',
      shape: 'box',
      dimensions: [0.4, 0.1, 0.2],
      position: [0, 0.6, 0],
    })
    world.addBody('magnet-s', {
      type: 'static',
      shape: 'box',
      dimensions: [0.4, 0.1, 0.2],
      position: [0, 0.05, 0],
    })

    const plate = world.getBody('hall-plate')!
    plate.rigidBody.userData = { current: I, magneticField: B, hallVoltage: U_H, hallCoeff: R_H }

    return {
      bodyLabels: ['base', 'hall-plate', 'magnet-n', 'magnet-s'],
      bodies: [
        {
          label: 'base',
          shape: 'box',
          dimensions: [2.5, 0.05, 1.2],
          material: 'wood',
          color: '#a0826d',
        },
        {
          label: 'hall-plate',
          shape: 'box',
          dimensions: [0.8, 0.02, 0.4],
          material: 'metal',
          color: '#c89b3c',
        },
        {
          label: 'magnet-n',
          shape: 'box',
          dimensions: [0.4, 0.1, 0.2],
          material: 'metal',
          color: '#dc2626',
        },
        {
          label: 'magnet-s',
          shape: 'box',
          dimensions: [0.4, 0.1, 0.2],
          material: 'metal',
          color: '#4a90e2',
        },
      ],
    }
  },
  dataCollectors: [
    {
      key: 'hallVoltage',
      name: { zh: '霍尔电压 U_H', en: 'Hall Voltage U_H' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('hall-plate')?.rigidBody.userData as Record<string, number> | undefined)
          ?.hallVoltage ?? 0,
    },
    {
      key: 'hallCoeff',
      name: { zh: '霍尔系数 R_H', en: 'Hall Coefficient R_H' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('hall-plate')?.rigidBody.userData as Record<string, number> | undefined)
          ?.hallCoeff ?? 0,
    },
    {
      key: 'current',
      name: { zh: '电流 I', en: 'Current I' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('hall-plate')?.rigidBody.userData as Record<string, number> | undefined)
          ?.current ?? 0,
    },
    {
      key: 'magneticField',
      name: { zh: '磁感应强度 B', en: 'Magnetic Field B' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('hall-plate')?.rigidBody.userData as Record<string, number> | undefined)
          ?.magneticField ?? 0,
    },
  ],
  guideSteps: [
    {
      title: { zh: '理解洛伦兹力', en: 'Understand Lorentz Force' },
      description: {
        zh: '磁场中的运动电荷受洛伦兹力 F = qvB，向导体一侧偏转。',
        en: 'Moving charges in a magnetic field feel F = qvB and deflect to one side.',
      },
    },
    {
      title: { zh: '霍尔电压', en: 'Hall Voltage' },
      description: {
        zh: '电荷积累形成反向电场，达到平衡时 U_H = IB/(nqd)。',
        en: 'Charge buildup creates a counter electric field. At equilibrium, U_H = IB/(nqd).',
      },
      hint: {
        zh: 'U_H ∝ I · B，可测 B 或判断半导体类型。',
        en: 'U_H ∝ I · B; used to measure B or identify semiconductor type.',
      },
    },
  ],
  thumbnail: 'hall-effect',
}

registerExperiment(experiment)
