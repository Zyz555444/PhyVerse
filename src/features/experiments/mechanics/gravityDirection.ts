import { registerExperiment } from '../registry'
import { createJoint } from '@/features/physics/JointFactory'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const gravityDirectionExperiment: ExperimentDefinition = {
  id: 'MECH-04',
  category: 'mechanics',
  name: { zh: '判断重力的方向', en: 'Direction of Gravity' },
  description: {
    zh: '用细线悬挂小球，无论从何种角度释放，小球静止时悬线始终竖直向下。这表明重力方向始终竖直向下。',
    en: 'Suspend a ball with a string. No matter the release angle, the string aligns vertically downward at rest, showing gravity always points down.',
  },
  difficulty: 1,
  formulas: ['F_g = mg', '\\theta_{equilibrium} = 0'],
  params: [
    {
      key: 'pendulumLength',
      name: { zh: '摆长', en: 'Pendulum Length' },
      min: 0.5,
      max: 3,
      default: 1.5,
      step: 0.1,
      unit: 'm',
    },
    {
      key: 'initialAngle',
      name: { zh: '初始角度', en: 'Initial Angle' },
      min: 0,
      max: 80,
      default: 30,
      step: 5,
      unit: '°',
    },
  ],
  setup: (world, params) => {
    const length = params.pendulumLength ?? 1.5
    const angleDeg = params.initialAngle ?? 30
    const angle = (angleDeg * Math.PI) / 180

    const pivotY = 3.5

    world.addBody('pivot', {
      type: 'static',
      shape: 'cylinder',
      dimensions: [0.06, 0.04, 0],
      position: [0, pivotY, 0],
      friction: 0.5,
      restitution: 0,
    })

    const bobX = length * Math.sin(angle)
    const bobY = pivotY - length * Math.cos(angle)
    world.addBody('bob', {
      type: 'dynamic',
      shape: 'sphere',
      dimensions: [0.12, 0, 0],
      position: [bobX, bobY, 0],
      mass: 0.5,
      friction: 0.3,
      restitution: 0.2,
      linearDamping: 0.5,
      angularDamping: 0.5,
    })

    const pivot = world.getBody('pivot')!
    const bob = world.getBody('bob')!
    const joint = createJoint(world.world, {
      type: 'spring',
      body1: pivot.rigidBody,
      body2: bob.rigidBody,
      anchor1: [0, 0, 0],
      anchor2: [0, 0, 0],
      restLength: length,
      stiffness: 2000,
      damping: 50,
    })
    world.addJoint('pendulum-spring', joint)

    return {
      bodyLabels: ['pivot', 'bob'],
      jointLabels: ['pendulum-spring'],
      bodies: [
        {
          label: 'pivot',
          shape: 'cylinder',
          dimensions: [0.06, 0.04, 0],
          material: 'metal',
          color: '#6b7280',
        },
        {
          label: 'bob',
          shape: 'sphere',
          dimensions: [0.12, 0, 0],
          material: 'metal',
          color: '#d4a574',
        },
      ],
      cleanup: () => {
        world.removeJoint('pendulum-spring')
      },
    }
  },
  dataCollectors: [
    {
      key: 'angle',
      name: { zh: '摆角', en: 'Pendulum Angle' },
      type: 'scalar',
      collect: (world) => {
        const pivot = world.getBody('pivot')
        const bob = world.getBody('bob')
        if (!pivot || !bob) return 0
        const pp = pivot.rigidBody.translation()
        const bp = bob.rigidBody.translation()
        const dx = bp.x - pp.x
        const dy = bp.y - pp.y
        return Math.atan2(dx, -dy) * (180 / Math.PI)
      },
    },
    {
      key: 'displacementX',
      name: { zh: '水平偏移', en: 'Horizontal Displacement' },
      type: 'scalar',
      collect: (world) => {
        const pivot = world.getBody('pivot')
        const bob = world.getBody('bob')
        if (!pivot || !bob) return 0
        return bob.rigidBody.translation().x - pivot.rigidBody.translation().x
      },
    },
  ],
  guideSteps: [
    {
      title: { zh: '设置初始角度', en: 'Set Initial Angle' },
      description: {
        zh: '调整小球的初始释放角度（0°-80°）。',
        en: 'Adjust the initial release angle of the ball (0°-80°).',
      },
    },
    {
      title: { zh: '观察摆动', en: 'Observe Oscillation' },
      description: {
        zh: '释放小球，观察其来回摆动。注意悬线方向的变化。',
        en: 'Release the ball and observe its oscillation. Note how the string direction changes.',
      },
    },
    {
      title: { zh: '确认平衡位置', en: 'Identify Equilibrium' },
      description: {
        zh: '等待小球静止，观察悬线最终指向何方。无论初始角度如何，悬线始终竖直向下，表明重力方向竖直向下。',
        en: 'Wait for the ball to rest and observe the final string direction. Regardless of initial angle, the string points vertically downward, confirming gravity direction.',
      },
      hint: {
        zh: '重力方向始终竖直向下，指向地心。',
        en: "Gravity always points vertically downward, toward Earth's center.",
      },
    },
  ],
  thumbnail: 'gravity-direction',
}

registerExperiment(gravityDirectionExperiment)
