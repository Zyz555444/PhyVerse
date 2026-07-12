import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const experiment: ExperimentDefinition = {
  id: 'OPT-01',
  category: 'optics',
  name: { zh: '测定玻璃的折射率', en: 'Measure Refractive Index of Glass' },
  description: {
    zh: '光线从空气进入玻璃砖时发生折射。斯涅尔定律：n₁ sin θ₁ = n₂ sin θ₂。测出入射角和折射角即可求出玻璃折射率 n = sin θ₁ / sin θ₂。',
    en: "Light refracts when entering a glass block. Snell's law: n₁ sin θ₁ = n₂ sin θ₂. Measure angles to get n = sin θ₁ / sin θ₂.",
  },
  difficulty: 2,
  formulas: [
    'n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2',
    'n = \\frac{\\sin\\theta_1}{\\sin\\theta_2}',
  ],
  params: [
    {
      key: 'incidentAngle',
      name: { zh: '入射角 θ₁', en: 'Incident Angle θ₁' },
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
    const theta1Deg = params.incidentAngle ?? 45
    const n = params.glassN ?? 1.5
    const theta1 = (theta1Deg * Math.PI) / 180
    const theta2 = Math.asin(Math.sin(theta1) / n)
    const theta2Deg = (theta2 * 180) / Math.PI

    world.addBody('base', {
      type: 'static',
      shape: 'box',
      dimensions: [2.5, 0.05, 1.5],
      position: [0, 0, 0],
    })

    // 玻璃砖
    world.addBody('glass-block', {
      type: 'static',
      shape: 'box',
      dimensions: [0.8, 0.3, 0.4],
      position: [0, 0.2, 0],
    })

    // 入射光线（细圆柱）
    world.addBody('incident-ray', {
      type: 'static',
      shape: 'cylinder',
      dimensions: [0.01, 0.5, 0],
      position: [-0.5, 0.5, 0],
    })
    world
      .getBody('incident-ray')!
      .rigidBody.setRotation({ x: 0, y: 0, z: theta1 - Math.PI / 2, w: 1 }, true)

    // 折射光线
    world.addBody('refracted-ray', {
      type: 'static',
      shape: 'cylinder',
      dimensions: [0.01, 0.4, 0],
      position: [0, 0.2, 0],
    })
    world
      .getBody('refracted-ray')!
      .rigidBody.setRotation({ x: 0, y: 0, z: -theta2 + Math.PI / 2, w: 1 }, true)

    const ray = world.getBody('incident-ray')!
    ray.rigidBody.userData = {
      incidentAngle: theta1Deg,
      refractedAngle: theta2Deg,
      refractiveIndex: n,
    }

    return {
      bodyLabels: ['base', 'glass-block', 'incident-ray', 'refracted-ray'],
      bodies: [
        {
          label: 'base',
          shape: 'box',
          dimensions: [2.5, 0.05, 1.5],
          material: 'wood',
          color: '#a0826d',
        },
        {
          label: 'glass-block',
          shape: 'box',
          dimensions: [0.8, 0.3, 0.4],
          material: 'glass',
          color: '#a0d8ef',
        },
        {
          label: 'incident-ray',
          shape: 'cylinder',
          dimensions: [0.01, 0.5, 0],
          material: 'glass',
          color: '#ffeb3b',
        },
        {
          label: 'refracted-ray',
          shape: 'cylinder',
          dimensions: [0.01, 0.4, 0],
          material: 'glass',
          color: '#ff9800',
        },
      ],
    }
  },
  dataCollectors: [
    {
      key: 'refractedAngle',
      name: { zh: '折射角 θ₂', en: 'Refracted Angle θ₂' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('incident-ray')?.rigidBody.userData as Record<string, number> | undefined)
          ?.refractedAngle ?? 0,
    },
    {
      key: 'incidentAngle',
      name: { zh: '入射角 θ₁', en: 'Incident Angle θ₁' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('incident-ray')?.rigidBody.userData as Record<string, number> | undefined)
          ?.incidentAngle ?? 0,
    },
    {
      key: 'refractiveIndex',
      name: { zh: '折射率 n', en: 'Refractive Index n' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('incident-ray')?.rigidBody.userData as Record<string, number> | undefined)
          ?.refractiveIndex ?? 0,
    },
  ],
  guideSteps: [
    {
      title: { zh: '观察折射现象', en: 'Observe Refraction' },
      description: {
        zh: '光从空气进入玻璃，折射角小于入射角。',
        en: 'Light bends toward normal when entering glass.',
      },
    },
    {
      title: { zh: '应用斯涅尔定律', en: "Apply Snell's Law" },
      description: {
        zh: 'n = sin θ₁ / sin θ₂。多测几组取平均值更准确。',
        en: 'n = sin θ₁ / sin θ₂. Average multiple measurements for accuracy.',
      },
      hint: { zh: '玻璃 n ≈ 1.5。', en: 'Glass n ≈ 1.5.' },
    },
  ],
  thumbnail: 'refraction-index',
}

registerExperiment(experiment)
