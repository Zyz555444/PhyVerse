import { registerExperiment } from '../registry'
import { createJoint } from '@/features/physics/JointFactory'
import type { ExperimentDefinition } from '@/shared/types/experiment'

interface PendulumData {
  length: number
}

const pendulumGravityExperiment: ExperimentDefinition = {
  id: 'MECH-19',
  category: 'mechanics',
  name: { zh: '用单摆测定重力加速度', en: 'Measuring Gravity with a Pendulum' },
  description: {
    zh: '单摆在小角度下做简谐运动，周期 T = 2π√(L/g)。通过测量摆长L和周期T，计算重力加速度 g = 4π²L/T²。',
    en: 'A simple pendulum undergoes simple harmonic motion at small angles with period T = 2π√(L/g). By measuring length L and period T, compute gravity g = 4π²L/T².',
  },
  difficulty: 2,
  formulas: ['T = 2\\pi\\sqrt{\\frac{L}{g}}', 'g = \\frac{4\\pi^2 L}{T^2}'],
  params: [
    {
      key: 'pendulumLength',
      name: { zh: '摆长', en: 'Pendulum Length' },
      min: 0.5,
      max: 2.5,
      default: 1.0,
      step: 0.1,
      unit: 'm',
    },
    {
      key: 'initialAngle',
      name: { zh: '初始摆角', en: 'Initial Angle' },
      min: 5,
      max: 30,
      default: 10,
      step: 5,
      unit: '°',
    },
    {
      key: 'bobMass',
      name: { zh: '摆球质量', en: 'Bob Mass' },
      min: 0.1,
      max: 2,
      default: 0.5,
      step: 0.1,
      unit: 'kg',
    },
  ],
  setup: (world, params) => {
    const length = params.pendulumLength ?? 1.0
    const angleDeg = params.initialAngle ?? 10
    const mass = params.bobMass ?? 0.5
    const angle = (angleDeg * Math.PI) / 180

    const pivotY = 3.0
    const bobX = length * Math.sin(angle)
    const bobY = pivotY - length * Math.cos(angle)

    world.addBody('pivot', {
      type: 'static',
      shape: 'cylinder',
      dimensions: [0.06, 0.04, 0],
      position: [0, pivotY, 0],
      friction: 0.5,
      restitution: 0,
    })

    world.addBody('bob', {
      type: 'dynamic',
      shape: 'sphere',
      dimensions: [0.1, 0, 0],
      position: [bobX, bobY, 0],
      mass,
      friction: 0.3,
      restitution: 0.2,
      linearDamping: 0.02,
      angularDamping: 0.1,
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
      stiffness: 5000,
      damping: 1,
    })
    world.addJoint('pendulum-spring', joint)

    bob.rigidBody.userData = { length } satisfies PendulumData

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
          dimensions: [0.1, 0, 0],
          material: 'metal',
          color: '#dc2626',
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
      key: 'angularVelocity',
      name: { zh: '角速度', en: 'Angular Velocity' },
      type: 'scalar',
      collect: (world) => {
        const pivot = world.getBody('pivot')
        const bob = world.getBody('bob')
        if (!pivot || !bob) return 0
        const data = bob.rigidBody.userData as PendulumData
        const L = data.length
        const pp = pivot.rigidBody.translation()
        const bp = bob.rigidBody.translation()
        const dx = bp.x - pp.x
        const dy = bp.y - pp.y
        const theta = Math.atan2(dx, -dy)
        const v = bob.rigidBody.linvel()
        const vTangent = v.x * Math.cos(theta) + v.y * Math.sin(theta)
        const omega = vTangent / L
        return omega * (180 / Math.PI)
      },
    },
    {
      key: 'expectedPeriod',
      name: { zh: '理论周期', en: 'Theoretical Period' },
      type: 'scalar',
      collect: (world) => {
        const bob = world.getBody('bob')
        if (!bob) return 0
        const data = bob.rigidBody.userData as PendulumData
        return 2 * Math.PI * Math.sqrt(data.length / 9.81)
      },
    },
    {
      key: 'heightRise',
      name: { zh: '升高量', en: 'Height Rise' },
      type: 'scalar',
      collect: (world) => {
        const pivot = world.getBody('pivot')
        const bob = world.getBody('bob')
        if (!pivot || !bob) return 0
        const data = bob.rigidBody.userData as PendulumData
        const L = data.length
        const pp = pivot.rigidBody.translation()
        const bp = bob.rigidBody.translation()
        const dx = bp.x - pp.x
        const dy = bp.y - pp.y
        const theta = Math.atan2(dx, -dy)
        return L * (1 - Math.cos(theta))
      },
    },
  ],
  guideSteps: [
    {
      title: { zh: '设置单摆参数', en: 'Set Pendulum Parameters' },
      description: {
        zh: '调整摆长L和初始摆角（建议≤15°以保证小角度近似）。摆球质量不影响周期。',
        en: 'Adjust pendulum length L and initial angle (recommend ≤15° for small-angle approximation). Bob mass does not affect period.',
      },
    },
    {
      title: { zh: '观察摆动并测量周期', en: 'Observe and Measure Period' },
      description: {
        zh: '观察摆角随时间的变化曲线。从一个最大值到下一个同侧最大值的时间为一个周期T。也可用角速度：两个相邻零点间的时间为半周期。',
        en: 'Observe the angle vs time graph. Time from one maximum to the next same-side maximum is one period T. Alternatively, use angular velocity: time between adjacent zero-crossings is half a period.',
      },
    },
    {
      title: { zh: '计算重力加速度', en: 'Compute Gravity' },
      description: {
        zh: '用公式 g = 4π²L/T² 计算重力加速度。与理论值 9.81 m/s² 比较，分析误差来源（空气阻力、摆线质量、振幅过大等）。',
        en: 'Compute gravity using g = 4π²L/T². Compare with theoretical value 9.81 m/s² and analyze error sources (air resistance, string mass, large amplitude, etc.).',
      },
      hint: {
        zh: '理论周期 T = 2π√(L/g) 已在数据面板显示，可与你的测量值对比。',
        en: 'The theoretical period T = 2π√(L/g) is shown in the data panel for comparison with your measurement.',
      },
    },
  ],
  thumbnail: 'pendulum-gravity',
}

registerExperiment(pendulumGravityExperiment)
