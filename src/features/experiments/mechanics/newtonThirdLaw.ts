import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

interface CollisionData {
  mass: number
}

const newtonThirdLawExperiment: ExperimentDefinition = {
  id: 'MECH-11',
  category: 'mechanics',
  name: { zh: '验证牛顿第三定律', en: "Newton's Third Law" },
  description: {
    zh: '两个小球在轨道上碰撞。碰撞时，A对B的力与B对A的力大小相等、方向相反（F_AB = -F_BA）。通过测量碰撞前后的动量验证：总动量守恒，且冲量大小相等。',
    en: 'Two balls collide on a track. During collision, the force A exerts on B equals the force B exerts on A (F_AB = -F_BA). Verify via momentum: total momentum is conserved.',
  },
  difficulty: 1,
  formulas: [
    'F_{AB} = -F_{BA}',
    "m_1 v_1 + m_2 v_2 = m_1 v_1' + m_2 v_2'",
    '\\Delta p_1 = -\\Delta p_2',
  ],
  params: [
    {
      key: 'massA',
      name: { zh: '球A质量', en: 'Ball A Mass' },
      min: 0.1,
      max: 5,
      default: 1,
      step: 0.1,
      unit: 'kg',
    },
    {
      key: 'massB',
      name: { zh: '球B质量', en: 'Ball B Mass' },
      min: 0.1,
      max: 5,
      default: 1,
      step: 0.1,
      unit: 'kg',
    },
    {
      key: 'initialVelocityA',
      name: { zh: '球A初速度', en: 'Ball A Initial Velocity' },
      min: 0.5,
      max: 8,
      default: 3,
      step: 0.5,
      unit: 'm/s',
    },
  ],
  setup: (world, params) => {
    const massA = params.massA ?? 1
    const massB = params.massB ?? 1
    const velA = params.initialVelocityA ?? 3

    world.addBody('track', {
      type: 'static',
      shape: 'box',
      dimensions: [4, 0.05, 0.3],
      position: [0, 0.5, 0],
      friction: 0.02,
      restitution: 0,
    })

    world.addBody('ball-a', {
      type: 'dynamic',
      shape: 'sphere',
      dimensions: [0.12, 0, 0],
      position: [-2, 0.67, 0],
      mass: massA,
      friction: 0.01,
      restitution: 0.95,
      linearDamping: 0,
      angularDamping: 0.1,
    })

    world.addBody('ball-b', {
      type: 'dynamic',
      shape: 'sphere',
      dimensions: [0.12, 0, 0],
      position: [0.5, 0.67, 0],
      mass: massB,
      friction: 0.01,
      restitution: 0.95,
      linearDamping: 0,
      angularDamping: 0.1,
    })

    const ballA = world.getBody('ball-a')!
    ballA.rigidBody.setLinvel({ x: velA, y: 0, z: 0 }, true)
    ballA.rigidBody.userData = { mass: massA } satisfies CollisionData

    const ballB = world.getBody('ball-b')!
    ballB.rigidBody.userData = { mass: massB } satisfies CollisionData

    return {
      bodyLabels: ['track', 'ball-a', 'ball-b'],
      bodies: [
        {
          label: 'track',
          shape: 'box',
          dimensions: [4, 0.05, 0.3],
          material: 'wood',
          color: '#a0826d',
        },
        {
          label: 'ball-a',
          shape: 'sphere',
          dimensions: [0.12, 0, 0],
          material: 'metal',
          color: '#ef4444',
        },
        {
          label: 'ball-b',
          shape: 'sphere',
          dimensions: [0.12, 0, 0],
          material: 'metal',
          color: '#3b82f6',
        },
      ],
    }
  },
  dataCollectors: [
    {
      key: 'velocityA',
      name: { zh: '球A速度', en: 'Ball A Velocity' },
      type: 'scalar',
      collect: (world) => {
        const ball = world.getBody('ball-a')
        if (!ball) return 0
        return ball.rigidBody.linvel().x
      },
    },
    {
      key: 'velocityB',
      name: { zh: '球B速度', en: 'Ball B Velocity' },
      type: 'scalar',
      collect: (world) => {
        const ball = world.getBody('ball-b')
        if (!ball) return 0
        return ball.rigidBody.linvel().x
      },
    },
    {
      key: 'momentumA',
      name: { zh: '球A动量', en: 'Ball A Momentum' },
      type: 'scalar',
      collect: (world) => {
        const ball = world.getBody('ball-a')
        if (!ball) return 0
        const data = ball.rigidBody.userData as CollisionData
        return data.mass * ball.rigidBody.linvel().x
      },
    },
    {
      key: 'momentumB',
      name: { zh: '球B动量', en: 'Ball B Momentum' },
      type: 'scalar',
      collect: (world) => {
        const ball = world.getBody('ball-b')
        if (!ball) return 0
        const data = ball.rigidBody.userData as CollisionData
        return data.mass * ball.rigidBody.linvel().x
      },
    },
    {
      key: 'totalMomentum',
      name: { zh: '总动量', en: 'Total Momentum' },
      type: 'scalar',
      collect: (world) => {
        const ballA = world.getBody('ball-a')
        const ballB = world.getBody('ball-b')
        if (!ballA || !ballB) return 0
        const dataA = ballA.rigidBody.userData as CollisionData
        const dataB = ballB.rigidBody.userData as CollisionData
        const pA = dataA.mass * ballA.rigidBody.linvel().x
        const pB = dataB.mass * ballB.rigidBody.linvel().x
        return pA + pB
      },
    },
  ],
  guideSteps: [
    {
      title: { zh: '设置两球参数', en: 'Set Ball Parameters' },
      description: {
        zh: '调整球A和球B的质量，以及球A的初速度。球B初始静止。',
        en: 'Adjust masses of ball A and B, and ball A initial velocity. Ball B starts at rest.',
      },
    },
    {
      title: { zh: '观察碰撞', en: 'Observe Collision' },
      description: {
        zh: '球A撞击球B。碰撞后两球速度发生变化，但总动量保持不变——这验证了作用力与反作用力大小相等、方向相反。',
        en: 'Ball A hits ball B. Velocities change after collision, but total momentum is conserved — verifying equal and opposite forces.',
      },
    },
    {
      title: { zh: '验证动量守恒', en: 'Verify Momentum Conservation' },
      description: {
        zh: '改变质量比，观察碰撞后速度变化。当 m_A = m_B 时，球A停止而球B以相同速度前进（弹性碰撞中速度交换）。',
        en: 'Change mass ratio. When m_A = m_B, ball A stops and ball B moves at the same velocity (velocity exchange in elastic collision).',
      },
      hint: {
        zh: '总动量在碰撞前后保持不变——这是牛顿第三定律的直接体现。',
        en: "Total momentum is conserved before and after collision — a direct consequence of Newton's third law.",
      },
    },
  ],
  thumbnail: 'newton-third-law',
}

registerExperiment(newtonThirdLawExperiment)
