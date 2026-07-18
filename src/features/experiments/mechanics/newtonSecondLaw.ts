import { registerExperiment } from '../registry'
import { magnitude } from '@/shared/utils/vectorMath'
import type { DataCollector, ExperimentDefinition } from '@/shared/types/experiment'
import type { PhysicsWorld } from '@/features/physics/PhysicsWorld'

function createAccelerationCollector(): DataCollector {
  let lastSpeed: number | null = null
  return {
    key: 'acceleration',
    name: { zh: '加速度', en: 'Acceleration' },
    type: 'scalar',
    collect: (world: PhysicsWorld) => {
      const cart = world.getBody('cart')
      if (!cart) return 0
      const speed = magnitude(cart.rigidBody.linvel())
      const dt = world.getTimestep()
      let accel = 0
      if (lastSpeed !== null && dt > 0) {
        accel = (speed - lastSpeed) / dt
      }
      lastSpeed = speed
      return accel
    },
  }
}

const newtonSecondLawExperiment: ExperimentDefinition = {
  id: 'MECH-09',
  category: 'mechanics',
  name: { zh: '探究加速度与力、质量的关系（牛顿第二定律）', en: "Newton's Second Law: F = ma" },
  description: {
    zh: '小车在水平轨道上以初速度滑行，摩擦力使其减速。验证 F = ma：摩擦力 F = μmg 与质量成正比，但加速度 a = μg 与质量无关。',
    en: 'A cart slides on a horizontal track with initial velocity. Friction decelerates it. Verify F = ma: friction F = μmg is proportional to mass, but acceleration a = μg is mass-independent.',
  },
  difficulty: 3,
  formulas: ['F = ma', 'F_{friction} = \\mu mg', 'a = \\mu g'],
  params: [
    {
      key: 'initialVelocity',
      name: { zh: '初速度', en: 'Initial Velocity' },
      min: 1,
      max: 10,
      default: 4,
      step: 0.5,
      unit: 'm/s',
    },
    {
      key: 'cartMass',
      name: { zh: '小车质量', en: 'Cart Mass' },
      min: 0.1,
      max: 5,
      default: 1,
      step: 0.1,
      unit: 'kg',
    },
    {
      key: 'friction',
      name: { zh: '摩擦系数', en: 'Friction Coefficient' },
      min: 0.01,
      max: 0.5,
      default: 0.1,
      step: 0.01,
      unit: '',
    },
  ],
  setup: (world, params) => {
    const velocity = params.initialVelocity ?? 4
    const mass = params.cartMass ?? 1
    const friction = params.friction ?? 0.1

    world.addBody('track', {
      type: 'static',
      shape: 'box',
      dimensions: [5, 0.05, 0.5],
      position: [0, 0.5, 0],
      friction,
      restitution: 0,
    })

    world.addBody('cart', {
      type: 'dynamic',
      shape: 'box',
      dimensions: [0.2, 0.1, 0.15],
      position: [-3, 0.7, 0],
      mass,
      friction: friction * 0.5,
      restitution: 0,
      linearDamping: 0,
      angularDamping: 0.5,
    })

    const cart = world.getBody('cart')!
    cart.rigidBody.setLinvel({ x: velocity, y: 0, z: 0 }, true)
    cart.rigidBody.userData = { mass, friction, initialVelocity: velocity }

    return {
      bodyLabels: ['track', 'cart'],
      bodies: [
        {
          label: 'track',
          shape: 'box',
          dimensions: [5, 0.05, 0.5],
          material: 'wood',
          color: '#a0826d',
        },
        {
          label: 'cart',
          shape: 'box',
          dimensions: [0.2, 0.1, 0.15],
          material: 'metal',
          color: '#3b82f6',
        },
      ],
    }
  },
  dataCollectors: [
    {
      key: 'velocity',
      name: { zh: '速度', en: 'Velocity' },
      type: 'scalar',
      collect: (world) => {
        const cart = world.getBody('cart')
        if (!cart) return 0
        return cart.rigidBody.linvel().x
      },
    },
    createAccelerationCollector(),
    {
      key: 'frictionForce',
      name: { zh: '摩擦力', en: 'Friction Force' },
      type: 'scalar',
      collect: (world) => {
        const cart = world.getBody('cart')
        if (!cart) return 0
        const data = cart.rigidBody.userData as { mass: number; friction: number }
        return data.friction * data.mass * 9.81
      },
    },
    {
      key: 'expectedAcceleration',
      name: { zh: '理论加速度', en: 'Expected Acceleration' },
      type: 'scalar',
      collect: (world) => {
        const cart = world.getBody('cart')
        if (!cart) return 0
        const data = cart.rigidBody.userData as { friction: number }
        return -data.friction * 9.81
      },
    },
  ],
  guideSteps: [
    {
      title: { zh: '设置初速度和质量', en: 'Set Velocity and Mass' },
      description: {
        zh: '调整小车初速度、质量和摩擦系数。',
        en: 'Adjust the cart initial velocity, mass, and friction coefficient.',
      },
    },
    {
      title: { zh: '观察减速过程', en: 'Observe Deceleration' },
      description: {
        zh: '小车在摩擦力作用下减速。记录速度变化和加速度。',
        en: 'The cart decelerates due to friction. Record velocity change and acceleration.',
      },
    },
    {
      title: { zh: '验证 F = ma', en: 'Verify F = ma' },
      description: {
        zh: '改变质量，观察加速度是否变化。摩擦力 F = μmg 随质量增大，但加速度 a = μg 保持不变——这正是 F = ma 的体现。',
        en: 'Change mass and observe if acceleration changes. Friction F = μmg increases with mass, but acceleration a = μg stays constant — this is F = ma.',
      },
      hint: {
        zh: '加速度 a = F/m = μg，与质量无关。',
        en: 'Acceleration a = F/m = μg, independent of mass.',
      },
    },
  ],
  thumbnail: 'newton-second-law',
}

registerExperiment(newtonSecondLawExperiment)
