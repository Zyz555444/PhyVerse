import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const projectileMotionExperiment: ExperimentDefinition = {
  id: 'MECH-14',
  category: 'mechanics',
  name: { zh: '描绘平抛运动的轨迹', en: 'Projectile Motion Trajectory' },
  description: {
    zh: '小球从高处水平抛出，在重力作用下做平抛运动。水平方向匀速运动（x = v₀t），竖直方向自由落体（y = ½gt²）。轨迹为抛物线。',
    en: 'A ball is launched horizontally from a height. Horizontal motion is uniform (x = v₀t), vertical motion is free fall (y = ½gt²). The trajectory is a parabola.',
  },
  difficulty: 2,
  formulas: ['x = v_0 t', 'y = \\frac{1}{2}gt^2', 'v_y = gt'],
  params: [
    {
      key: 'initialVelocity',
      name: { zh: '水平初速度', en: 'Horizontal Velocity' },
      min: 1,
      max: 10,
      default: 3,
      step: 0.5,
      unit: 'm/s',
    },
    {
      key: 'launchHeight',
      name: { zh: '抛出高度', en: 'Launch Height' },
      min: 2,
      max: 15,
      default: 6,
      step: 0.5,
      unit: 'm',
    },
  ],
  setup: (world, params) => {
    const velocity = params.initialVelocity ?? 3
    const height = params.launchHeight ?? 6

    world.addBody('ground', {
      type: 'static',
      shape: 'plane',
      dimensions: [8, 0, 8],
      position: [0, 0, 0],
      friction: 0.5,
      restitution: 0.2,
    })

    world.addBody('table', {
      type: 'static',
      shape: 'box',
      dimensions: [1, 0.05, 0.5],
      position: [-1, height, 0],
      friction: 0.3,
      restitution: 0,
    })

    world.addBody('ball', {
      type: 'dynamic',
      shape: 'sphere',
      dimensions: [0.1, 0, 0],
      position: [0, height + 0.1, 0],
      mass: 0.2,
      friction: 0.1,
      restitution: 0.3,
      linearDamping: 0,
      angularDamping: 0,
    })

    const ball = world.getBody('ball')!
    ball.rigidBody.setLinvel({ x: velocity, y: 0, z: 0 }, true)

    return {
      bodyLabels: ['ground', 'table', 'ball'],
      bodies: [
        {
          label: 'ground',
          shape: 'plane',
          dimensions: [8, 0, 8],
          material: 'wood',
          color: '#d4c8a8',
        },
        {
          label: 'table',
          shape: 'box',
          dimensions: [1, 0.05, 0.5],
          material: 'wood',
          color: '#a0826d',
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
      key: 'positionX',
      name: { zh: '水平位置', en: 'Horizontal Position' },
      type: 'scalar',
      collect: (world) => {
        const ball = world.getBody('ball')
        if (!ball) return 0
        return ball.rigidBody.translation().x
      },
    },
    {
      key: 'positionY',
      name: { zh: '竖直位置', en: 'Vertical Position' },
      type: 'scalar',
      collect: (world) => {
        const ball = world.getBody('ball')
        if (!ball) return 0
        return ball.rigidBody.translation().y
      },
    },
    {
      key: 'velocityX',
      name: { zh: '水平速度', en: 'Horizontal Velocity' },
      type: 'scalar',
      collect: (world) => {
        const ball = world.getBody('ball')
        if (!ball) return 0
        return ball.rigidBody.linvel().x
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
  ],
  guideSteps: [
    {
      title: { zh: '设置抛射参数', en: 'Set Launch Parameters' },
      description: {
        zh: '调整水平初速度和抛出高度。',
        en: 'Adjust the horizontal velocity and launch height.',
      },
    },
    {
      title: { zh: '观察平抛轨迹', en: 'Observe Trajectory' },
      description: {
        zh: '小球水平抛出后做抛物线运动。水平速度恒定，竖直速度随时间增大。',
        en: 'The ball follows a parabolic path. Horizontal velocity stays constant, vertical velocity increases with time.',
      },
    },
    {
      title: { zh: '验证运动独立性', en: 'Verify Independence' },
      description: {
        zh: '改变水平初速度，观察落地时间是否变化。抛出高度不变时，落地时间不变（与水平速度无关）。',
        en: 'Change horizontal velocity and observe if fall time changes. With same height, fall time is independent of horizontal velocity.',
      },
      hint: {
        zh: '落地时间 t = √(2H/g)，与水平速度无关。',
        en: 'Fall time t = √(2H/g), independent of horizontal velocity.',
      },
    },
  ],
  thumbnail: 'projectile-motion',
}

registerExperiment(projectileMotionExperiment)
