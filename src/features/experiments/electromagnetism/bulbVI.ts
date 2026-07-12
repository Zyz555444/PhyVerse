import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const experiment: ExperimentDefinition = {
  id: 'ELEC-02',
  category: 'electromagnetism',
  name: { zh: '描绘小灯泡的伏安特性曲线', en: 'Bulb V-I Characteristic Curve' },
  description: {
    zh: '小灯泡（钨丝）的电阻随温度升高而增大，因此其 U-I 关系是非线性的。电压增大时，灯丝温度升高，电阻增大，曲线弯曲。',
    en: "A tungsten bulb's resistance increases with temperature, so its U-I relationship is nonlinear. As voltage increases, the filament heats up and resistance rises, bending the curve.",
  },
  difficulty: 2,
  formulas: ['R = \\frac{U}{I}', 'R(T) = R_0 (1 + \\alpha T)'],
  params: [
    {
      key: 'voltage',
      name: { zh: '电压', en: 'Voltage' },
      min: 0,
      max: 6,
      default: 2,
      step: 0.1,
      unit: 'V',
    },
  ],
  setup: (world, params) => {
    const U = params.voltage ?? 2
    // 钨丝温度系数模型: R = R0 * (1 + α * T), T 与 U^2 近似正比
    const R0 = 2
    const alpha = 0.0045
    const T = (U * U) / 6
    const R = R0 * (1 + alpha * T * 100)
    const I = U / R
    const brightness = Math.min(1, (U / 6) ** 1.5)

    world.addBody('base', {
      type: 'static',
      shape: 'box',
      dimensions: [2, 0.05, 1],
      position: [0, 0, 0],
      friction: 0.5,
    })

    world.addBody('bulb-base', {
      type: 'static',
      shape: 'cylinder',
      dimensions: [0.15, 0.1, 0],
      position: [0, 0.15, 0],
      friction: 0.5,
    })

    world.addBody('bulb-glass', {
      type: 'static',
      shape: 'sphere',
      dimensions: [0.25, 0, 0],
      position: [0, 0.55, 0],
      friction: 0.5,
    })

    const bulb = world.getBody('bulb-glass')!
    bulb.rigidBody.userData = {
      voltage: U,
      current: I,
      resistance: R,
      temperature: T,
      brightness,
    }

    return {
      bodyLabels: ['base', 'bulb-base', 'bulb-glass'],
      bodies: [
        {
          label: 'base',
          shape: 'box',
          dimensions: [2, 0.05, 1],
          material: 'wood',
          color: '#a0826d',
        },
        {
          label: 'bulb-base',
          shape: 'cylinder',
          dimensions: [0.15, 0.1, 0],
          material: 'metal',
          color: '#666',
        },
        {
          label: 'bulb-glass',
          shape: 'sphere',
          dimensions: [0.25, 0, 0],
          material: 'glass',
          color: `rgb(${Math.round(255 * brightness)},${Math.round(220 * brightness)},${Math.round(100 * brightness)})`,
        },
      ],
    }
  },
  dataCollectors: [
    {
      key: 'voltage',
      name: { zh: '电压 U', en: 'Voltage U' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('bulb-glass')?.rigidBody.userData as Record<string, number> | undefined)
          ?.voltage ?? 0,
    },
    {
      key: 'current',
      name: { zh: '电流 I', en: 'Current I' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('bulb-glass')?.rigidBody.userData as Record<string, number> | undefined)
          ?.current ?? 0,
    },
    {
      key: 'resistance',
      name: { zh: '电阻 R', en: 'Resistance R' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('bulb-glass')?.rigidBody.userData as Record<string, number> | undefined)
          ?.resistance ?? 0,
    },
    {
      key: 'temperature',
      name: { zh: '温度 T', en: 'Temperature T' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('bulb-glass')?.rigidBody.userData as Record<string, number> | undefined)
          ?.temperature ?? 0,
    },
  ],
  guideSteps: [
    {
      title: { zh: '调节电压', en: 'Adjust Voltage' },
      description: {
        zh: '逐步增大电压，观察灯泡亮度和电流变化。',
        en: 'Gradually increase voltage. Observe brightness and current.',
      },
    },
    {
      title: { zh: '观察非线性特性', en: 'Observe Nonlinearity' },
      description: {
        zh: 'U-I 曲线不是直线。电压越高，灯丝越热，电阻越大，电流增长越慢。',
        en: 'The U-I curve is not linear. Higher voltage → hotter filament → larger resistance → slower current growth.',
      },
      hint: { zh: '钨丝温度系数 α ≈ 0.0045 /℃。', en: 'Tungsten α ≈ 0.0045 /°C.' },
    },
  ],
  thumbnail: 'bulb-vi',
}

registerExperiment(experiment)
