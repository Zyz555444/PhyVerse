import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const experiment: ExperimentDefinition = {
  id: 'OPT-07',
  category: 'optics',
  name: { zh: '全反射实验', en: 'Total Internal Reflection' },
  description: {
    zh: '光从光密介质（玻璃）射向光疏介质（空气），当入射角大于临界角时发生全反射。临界角 sin C = 1/n。',
    en: 'Light from denser (glass) to rarer (air) medium undergoes total internal reflection when incident angle exceeds the critical angle: sin C = 1/n.',
  },
  difficulty: 2,
  formulas: ['\\sin C = \\frac{1}{n}', 'n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2'],
  params: [
    {
      key: 'incidentAngle',
      name: { zh: '入射角 θ', en: 'Incident Angle θ' },
      min: 10,
      max: 80,
      default: 45,
      step: 1,
      unit: '°',
    },
    {
      key: 'glassN',
      name: { zh: '玻璃折射率 n', en: 'Glass Index n' },
      min: 1.3,
      max: 2.0,
      default: 1.5,
      step: 0.01,
      unit: '',
    },
  ],
  setup: (world, params) => {
    const thetaDeg = params.incidentAngle ?? 45
    const n = params.glassN ?? 1.5
    const criticalAngleRad = Math.asin(1 / n)
    const criticalAngleDeg = (criticalAngleRad * 180) / Math.PI
    const theta = (thetaDeg * Math.PI) / 180
    const sinThetaR = n * Math.sin(theta)
    const isTIR = sinThetaR > 1
    const thetaR = isTIR ? 90 : (Math.asin(sinThetaR) * 180) / Math.PI

    world.addBody('base', {
      type: 'static',
      shape: 'box',
      dimensions: [2, 0.05, 1.5],
      position: [0, 0, 0],
    })

    // 半圆形玻璃砖
    world.addBody('glass-semicircle', {
      type: 'static',
      shape: 'cylinder',
      dimensions: [0.4, 0.2, 0],
      position: [0, 0.2, 0],
    })

    world.addBody('incident-ray', {
      type: 'static',
      shape: 'cylinder',
      dimensions: [0.01, 0.4, 0],
      position: [-0.4, 0.2, 0],
    })

    const ray = world.getBody('incident-ray')!
    ray.rigidBody.userData = {
      incidentAngle: thetaDeg,
      criticalAngle: criticalAngleDeg,
      refractedAngle: thetaR,
      isTotalReflection: isTIR,
      refractiveIndex: n,
    }

    return {
      bodyLabels: ['base', 'glass-semicircle', 'incident-ray'],
      bodies: [
        {
          label: 'base',
          shape: 'box',
          dimensions: [2, 0.05, 1.5],
          material: 'wood',
          color: '#a0826d',
        },
        {
          label: 'glass-semicircle',
          shape: 'cylinder',
          dimensions: [0.4, 0.2, 0],
          material: 'glass',
          color: '#a0d8ef',
        },
        {
          label: 'incident-ray',
          shape: 'cylinder',
          dimensions: [0.01, 0.4, 0],
          material: 'glass',
          color: '#ffeb3b',
        },
      ],
    }
  },
  dataCollectors: [
    {
      key: 'criticalAngle',
      name: { zh: '临界角 C', en: 'Critical Angle C' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('incident-ray')?.rigidBody.userData as Record<string, number> | undefined)
          ?.criticalAngle ?? 0,
    },
    {
      key: 'isTotalReflection',
      name: { zh: '全反射', en: 'TIR' },
      type: 'scalar',
      collect: (world) =>
        (
          world.getBody('incident-ray')?.rigidBody.userData as
            Record<string, number | boolean> | undefined
        )?.isTotalReflection
          ? 1
          : 0,
    },
    {
      key: 'refractedAngle',
      name: { zh: '折射角', en: 'Refracted Angle' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('incident-ray')?.rigidBody.userData as Record<string, number> | undefined)
          ?.refractedAngle ?? 0,
    },
  ],
  guideSteps: [
    {
      title: { zh: '寻找临界角', en: 'Find Critical Angle' },
      description: {
        zh: '增大入射角，当折射角为 90° 时的入射角即临界角。',
        en: "Increase incident angle; when refracted angle = 90°, that's the critical angle.",
      },
    },
    {
      title: { zh: '全反射条件', en: 'TIR Condition' },
      description: {
        zh: '入射角 > 临界角时发生全反射，无折射光。',
        en: 'Incident angle > critical angle → total internal reflection, no refraction.',
      },
      hint: { zh: 'sin C = 1/n。n=1.5 时 C ≈ 41.8°。', en: 'sin C = 1/n. For n=1.5, C ≈ 41.8°.' },
    },
  ],
  thumbnail: 'total-internal-reflection',
}

registerExperiment(experiment)
