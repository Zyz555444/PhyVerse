import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

interface CollisionData {
  mass: number
}

const momentumConservationExperiment: ExperimentDefinition = {
  id: 'MECH-18',
  category: 'mechanics',
  name: { zh: '验证动量守恒定律（平抛法）', en: 'Momentum Conservation (Projectile Method)' },
  description: {
    zh: "两球在高度为H的平台上碰撞后飞出边缘，做平抛运动落地。由于下落时间相同（t=√(2H/g)），水平射程与速度成正比。通过测量速度验证动量守恒：m₁v₁ = m₁v₁' + m₂v₂'。",
    en: "Two balls collide on a platform at height H, then fly off the edge in projectile motion. Since fall time is the same (t=√(2H/g)), horizontal range is proportional to velocity. Verify momentum conservation: m₁v₁ = m₁v₁' + m₂v₂'.",
  },
  difficulty: 3,
  formulas: ["m_1 v_1 = m_1 v_1' + m_2 v_2'", 't = \\sqrt{\\frac{2H}{g}}', 'd = v \\cdot t'],
  params: [
    {
      key: 'massA',
      name: { zh: '入射球质量', en: 'Incident Ball Mass' },
      min: 0.1,
      max: 5,
      default: 1,
      step: 0.1,
      unit: 'kg',
    },
    {
      key: 'massB',
      name: { zh: '靶球质量', en: 'Target Ball Mass' },
      min: 0.1,
      max: 5,
      default: 1,
      step: 0.1,
      unit: 'kg',
    },
    {
      key: 'initialVelocityA',
      name: { zh: '入射球初速度', en: 'Incident Ball Velocity' },
      min: 1,
      max: 8,
      default: 4,
      step: 0.5,
      unit: 'm/s',
    },
    {
      key: 'platformHeight',
      name: { zh: '平台高度', en: 'Platform Height' },
      min: 0.5,
      max: 3,
      default: 1.2,
      step: 0.1,
      unit: 'm',
    },
  ],
  setup: (world, params) => {
    const massA = params.massA ?? 1
    const massB = params.massB ?? 1
    const velA = params.initialVelocityA ?? 4
    const H = params.platformHeight ?? 1.2

    world.addBody('ground', {
      type: 'static',
      shape: 'plane',
      dimensions: [5, 0, 5],
      position: [0, 0, 0],
      friction: 0.5,
      restitution: 0.2,
    })

    world.addBody('platform', {
      type: 'static',
      shape: 'box',
      dimensions: [1, 0.025, 0.3],
      position: [0, H - 0.025, 0],
      friction: 0.02,
      restitution: 0,
    })

    const ballR = 0.08
    const ballY = H + ballR

    world.addBody('ball-a', {
      type: 'dynamic',
      shape: 'sphere',
      dimensions: [ballR, 0, 0],
      position: [-0.5, ballY, 0],
      mass: massA,
      friction: 0.02,
      restitution: 0.9,
      linearDamping: 0,
      angularDamping: 0.1,
    })

    world.addBody('ball-b', {
      type: 'dynamic',
      shape: 'sphere',
      dimensions: [ballR, 0, 0],
      position: [0.3, ballY, 0],
      mass: massB,
      friction: 0.02,
      restitution: 0.9,
      linearDamping: 0,
      angularDamping: 0.1,
    })

    const ballA = world.getBody('ball-a')!
    ballA.rigidBody.setLinvel({ x: velA, y: 0, z: 0 }, true)
    ballA.rigidBody.userData = { mass: massA } satisfies CollisionData

    const ballB = world.getBody('ball-b')!
    ballB.rigidBody.userData = { mass: massB } satisfies CollisionData

    return {
      bodyLabels: ['ground', 'platform', 'ball-a', 'ball-b'],
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
          dimensions: [1, 0.025, 0.3],
          material: 'wood',
          color: '#a0826d',
        },
        {
          label: 'ball-a',
          shape: 'sphere',
          dimensions: [ballR, 0, 0],
          material: 'metal',
          color: '#ef4444',
        },
        {
          label: 'ball-b',
          shape: 'sphere',
          dimensions: [ballR, 0, 0],
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
      title: { zh: '设置实验参数', en: 'Set Experiment Parameters' },
      description: {
        zh: '调整两球质量和入射球初速度，以及平台高度。',
        en: 'Adjust the masses of both balls, incident ball velocity, and platform height.',
      },
    },
    {
      title: { zh: '观察碰撞与平抛', en: 'Observe Collision and Projectile Motion' },
      description: {
        zh: '球A在平台上撞击静止的球B。碰撞后两球飞出平台边缘，做平抛运动落地。由于下落高度相同，下落时间相同。',
        en: 'Ball A collides with stationary ball B on the platform. After collision, both fly off the edge in projectile motion. Since they fall from the same height, the fall time is identical.',
      },
    },
    {
      title: { zh: '验证动量守恒', en: 'Verify Momentum Conservation' },
      description: {
        zh: '观察"总动量"数据：碰撞前后总动量保持不变。改变质量比，验证 m₁v₁ = m₁v₁\' + m₂v₂\' 始终成立。',
        en: "Observe total momentum: it remains constant before and after collision. Change mass ratio and verify m₁v₁ = m₁v₁' + m₂v₂' always holds.",
      },
      hint: {
        zh: '平抛法的关键：下落时间 t=√(2H/g) 相同，所以水平射程 d=v·t 与速度成正比。测量射程即可验证动量守恒。',
        en: 'Key of projectile method: fall time t=√(2H/g) is the same, so horizontal range d=v·t is proportional to velocity. Measure range to verify momentum conservation.',
      },
    },
  ],
  thumbnail: 'momentum-conservation',
}

registerExperiment(momentumConservationExperiment)
