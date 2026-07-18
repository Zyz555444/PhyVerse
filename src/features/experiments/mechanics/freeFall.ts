import { registerExperiment } from '../registry'
import { magnitude } from '@/shared/utils/vectorMath'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const freeFallExperiment: ExperimentDefinition = {
  id: 'MECH-03',
  category: 'mechanics',
  name: { zh: '验证真空中重物下落快慢', en: 'Free Fall in Vacuum' },
  description: {
    zh: '在真空中（无空气阻力），所有物体下落的加速度相同，与质量无关。验证自由落体公式 h = ½gt²、v = gt、v² = 2gh。',
    en: 'In vacuum (no air resistance), all objects fall with the same acceleration regardless of mass. Verify h = ½gt², v = gt, v² = 2gh.',
  },
  difficulty: 1,
  formulas: ['h = \\frac{1}{2}gt^2', 'v = gt', 'v^2 = 2gh'],
  params: [
    {
      key: 'initialHeight',
      name: { zh: '初始高度', en: 'Initial Height' },
      min: 1,
      max: 20,
      default: 5,
      step: 0.5,
      unit: 'm',
    },
    {
      key: 'ballMass',
      name: { zh: '小球质量', en: 'Ball Mass' },
      min: 0.1,
      max: 10,
      default: 1,
      step: 0.1,
      unit: 'kg',
    },
  ],
  setup: (world, params) => {
    const height = params.initialHeight ?? 5
    const mass = params.ballMass ?? 1

    world.addBody('ground', {
      type: 'static',
      shape: 'plane',
      dimensions: [10, 0, 10],
      position: [0, 0, 0],
      friction: 0.5,
      restitution: 0.3,
    })

    world.addBody('ball', {
      type: 'dynamic',
      shape: 'sphere',
      dimensions: [0.2, 0, 0],
      position: [0, height, 0],
      mass,
      friction: 0.3,
      restitution: 0.5,
      linearDamping: 0,
      angularDamping: 0,
    })

    return {
      bodyLabels: ['ground', 'ball'],
      bodies: [
        {
          label: 'ground',
          shape: 'plane',
          dimensions: [10, 0, 10],
          material: 'wood',
          color: '#d4c8a8',
        },
        {
          label: 'ball',
          shape: 'sphere',
          dimensions: [0.2, 0, 0],
          material: 'metal',
          color: '#dc2626',
        },
      ],
    }
  },
  dataCollectors: [
    {
      key: 'height',
      name: { zh: '高度', en: 'Height' },
      type: 'scalar',
      collect: (world) => {
        const ball = world.getBody('ball')
        if (!ball) return 0
        return ball.rigidBody.translation().y
      },
    },
    {
      key: 'velocityY',
      name: { zh: '竖直速度', en: 'Vertical Velocity' },
      type: 'scalar',
      collect: (world) => {
        const ball = world.getBody('ball')
        if (!ball) return 0
        return ball.rigidBody.linvel().y
      },
    },
    {
      key: 'speed',
      name: { zh: '速率', en: 'Speed' },
      type: 'scalar',
      collect: (world) => {
        const ball = world.getBody('ball')
        if (!ball) return 0
        return magnitude(ball.rigidBody.linvel())
      },
    },
  ],
  guideSteps: [
    {
      title: { zh: '设置初始高度', en: 'Set Initial Height' },
      description: {
        zh: '调整滑块设置小球的初始下落高度。',
        en: 'Adjust the slider to set the initial drop height of the ball.',
      },
    },
    {
      title: { zh: '观察下落过程', en: 'Observe the Fall' },
      description: {
        zh: '释放小球，观察其在真空中的自由下落运动。注意加速度恒定。',
        en: 'Release the ball and observe its free fall in vacuum. Note the constant acceleration.',
      },
    },
    {
      title: { zh: '验证公式', en: 'Verify Formulas' },
      description: {
        zh: '使用收集的数据验证 h = ½gt² 和 v² = 2gh。改变小球质量，观察下落快慢是否变化。',
        en: 'Use collected data to verify h = ½gt² and v² = 2gh. Change ball mass and observe if fall rate changes.',
      },
      hint: {
        zh: '在真空中，轻重物体下落一样快。',
        en: 'In vacuum, light and heavy objects fall at the same rate.',
      },
    },
  ],
  thumbnail: 'free-fall',
}

registerExperiment(freeFallExperiment)
