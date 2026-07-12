import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const weightlessnessExperiment: ExperimentDefinition = {
  id: 'MECH-10',
  category: 'mechanics',
  name: { zh: '完全失重实验', en: 'Weightlessness in Free Fall' },
  description: {
    zh: '一个带孔的水瓶自由下落时，水不再从孔中喷出——因为瓶和水以相同加速度下落，它们之间没有相对作用力（完全失重）。本实验用平台和小球模拟此现象。',
    en: 'A bottle with holes stops leaking when in free fall — the bottle and water fall together with no relative force (weightlessness). This experiment simulates it with a platform and ball.',
  },
  difficulty: 1,
  formulas: ['F_{normal} = m(g - a)', 'F_{normal} = 0 \\text{ when } a = g'],
  params: [
    {
      key: 'height',
      name: { zh: '下落高度', en: 'Drop Height' },
      min: 2,
      max: 15,
      default: 6,
      step: 0.5,
      unit: 'm',
    },
    {
      key: 'ballMass',
      name: { zh: '小球质量', en: 'Ball Mass' },
      min: 0.1,
      max: 5,
      default: 0.5,
      step: 0.1,
      unit: 'kg',
    },
  ],
  setup: (world, params) => {
    const height = params.height ?? 6
    const ballMass = params.ballMass ?? 0.5

    world.addBody('ground', {
      type: 'static',
      shape: 'plane',
      dimensions: [5, 0, 5],
      position: [0, 0, 0],
      friction: 0.5,
      restitution: 0.2,
    })

    world.addBody('platform', {
      type: 'dynamic',
      shape: 'box',
      dimensions: [0.4, 0.03, 0.4],
      position: [0, height, 0],
      mass: 1,
      friction: 0.5,
      restitution: 0.1,
      linearDamping: 0,
      angularDamping: 1,
    })

    world.addBody('ball', {
      type: 'dynamic',
      shape: 'sphere',
      dimensions: [0.1, 0, 0],
      position: [0, height + 0.13, 0],
      mass: ballMass,
      friction: 0.3,
      restitution: 0.2,
      linearDamping: 0,
      angularDamping: 0.1,
    })

    return {
      bodyLabels: ['ground', 'platform', 'ball'],
      bodies: [
        {
          label: 'ground',
          shape: 'plane',
          dimensions: [5, 0, 5],
          material: 'wood',
          color: '#d4c8a8',
        },
        {
          label: 'platform',
          shape: 'box',
          dimensions: [0.4, 0.03, 0.4],
          material: 'metal',
          color: '#6b7280',
        },
        {
          label: 'ball',
          shape: 'sphere',
          dimensions: [0.1, 0, 0],
          material: 'metal',
          color: '#dc2626',
        },
      ],
    }
  },
  dataCollectors: [
    {
      key: 'relativeY',
      name: { zh: '相对高度', en: 'Relative Height' },
      type: 'scalar',
      collect: (world) => {
        const platform = world.getBody('platform')
        const ball = world.getBody('ball')
        if (!platform || !ball) return 0
        return ball.rigidBody.translation().y - platform.rigidBody.translation().y
      },
    },
    {
      key: 'platformY',
      name: { zh: '平台高度', en: 'Platform Height' },
      type: 'scalar',
      collect: (world) => {
        const platform = world.getBody('platform')
        if (!platform) return 0
        return platform.rigidBody.translation().y
      },
    },
    {
      key: 'platformVelocity',
      name: { zh: '下落速度', en: 'Fall Velocity' },
      type: 'scalar',
      collect: (world) => {
        const platform = world.getBody('platform')
        if (!platform) return 0
        return platform.rigidBody.linvel().y
      },
    },
  ],
  guideSteps: [
    {
      title: { zh: '设置高度', en: 'Set Drop Height' },
      description: {
        zh: '调整平台和小球的初始下落高度。',
        en: 'Adjust the initial drop height of the platform and ball.',
      },
    },
    {
      title: { zh: '观察自由下落', en: 'Observe Free Fall' },
      description: {
        zh: '平台和小球同时下落。注意"相对高度"数据——它保持不变，说明小球和平台以相同加速度运动，小球对平台没有压力。',
        en: 'Both fall together. Note the "Relative Height" — it stays constant, meaning the ball and platform have the same acceleration with zero contact force.',
      },
    },
    {
      title: { zh: '理解完全失重', en: 'Understand Weightlessness' },
      description: {
        zh: '在自由下落中，小球对平台没有压力（F_normal = 0），就像水瓶下落时水不喷出一样。这就是完全失重。',
        en: 'In free fall, the ball exerts no force on the platform (F_normal = 0), just like water stops leaking from a falling bottle. This is complete weightlessness.',
      },
      hint: {
        zh: '完全失重条件：a = g（自由落体加速度）。',
        en: 'Weightlessness condition: a = g (free fall acceleration).',
      },
    },
  ],
  thumbnail: 'weightlessness',
}

registerExperiment(weightlessnessExperiment)
