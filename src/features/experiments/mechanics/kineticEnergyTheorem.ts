import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

interface KineticData {
  mass: number
  friction: number
  initialX: number
  initialVelocity: number
}

const kineticEnergyTheoremExperiment: ExperimentDefinition = {
  id: 'MECH-16',
  category: 'mechanics',
  name: { zh: '探究动能定理', en: 'Kinetic Energy Theorem: W = ΔEk' },
  description: {
    zh: '小车在水平轨道上以初速度滑行，摩擦力做负功。验证动能定理：外力做的功等于动能的变化量 W = ΔEk = ½mv² - ½mv₀²。',
    en: 'A cart slides with initial velocity on a track. Friction does negative work. Verify: W = ΔEk = ½mv² - ½mv₀².',
  },
  difficulty: 3,
  formulas: ['W = \\Delta E_k', 'W = -F_{friction} \\cdot d', 'E_k = \\frac{1}{2}mv^2'],
  params: [
    {
      key: 'initialVelocity',
      name: { zh: '初速度', en: 'Initial Velocity' },
      min: 1,
      max: 8,
      default: 4,
      step: 0.5,
      unit: 'm/s',
    },
    {
      key: 'cartMass',
      name: { zh: '小车质量', en: 'Cart Mass' },
      min: 0.1,
      max: 3,
      default: 1,
      step: 0.1,
      unit: 'kg',
    },
    {
      key: 'friction',
      name: { zh: '摩擦系数', en: 'Friction' },
      min: 0.02,
      max: 0.3,
      default: 0.08,
      step: 0.01,
      unit: '',
    },
  ],
  setup: (world, params) => {
    const velocity = params.initialVelocity ?? 4
    const mass = params.cartMass ?? 1
    const friction = params.friction ?? 0.08

    world.addBody('track', {
      type: 'static',
      shape: 'box',
      dimensions: [5, 0.05, 0.4],
      position: [0, 0.5, 0],
      friction,
      restitution: 0,
    })

    const startX = -3
    world.addBody('cart', {
      type: 'dynamic',
      shape: 'box',
      dimensions: [0.2, 0.1, 0.15],
      position: [startX, 0.7, 0],
      mass,
      friction: friction * 0.5,
      restitution: 0,
      linearDamping: 0,
      angularDamping: 0.5,
    })

    const cart = world.getBody('cart')!
    cart.rigidBody.setLinvel({ x: velocity, y: 0, z: 0 }, true)
    cart.rigidBody.userData = {
      mass,
      friction,
      initialX: startX,
      initialVelocity: velocity,
    } satisfies KineticData

    return {
      bodyLabels: ['track', 'cart'],
      bodies: [
        {
          label: 'track',
          shape: 'box',
          dimensions: [5, 0.05, 0.4],
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
    {
      key: 'kineticEnergy',
      name: { zh: '动能', en: 'Kinetic Energy' },
      type: 'energy',
      collect: (world) => {
        const cart = world.getBody('cart')
        if (!cart) return 0
        const data = cart.rigidBody.userData as KineticData
        const v = cart.rigidBody.linvel().x
        return 0.5 * data.mass * v * v
      },
    },
    {
      key: 'distance',
      name: { zh: '位移', en: 'Distance' },
      type: 'scalar',
      collect: (world) => {
        const cart = world.getBody('cart')
        if (!cart) return 0
        const data = cart.rigidBody.userData as KineticData
        return cart.rigidBody.translation().x - data.initialX
      },
    },
    {
      key: 'workDone',
      name: { zh: '摩擦力做功', en: 'Work by Friction' },
      type: 'energy',
      collect: (world) => {
        const cart = world.getBody('cart')
        if (!cart) return 0
        const data = cart.rigidBody.userData as KineticData
        const distance = cart.rigidBody.translation().x - data.initialX
        const frictionForce = data.friction * data.mass * 9.81
        return -frictionForce * distance
      },
    },
    {
      key: 'energyChange',
      name: { zh: '动能变化', en: 'Kinetic Energy Change' },
      type: 'energy',
      collect: (world) => {
        const cart = world.getBody('cart')
        if (!cart) return 0
        const data = cart.rigidBody.userData as KineticData
        const v = cart.rigidBody.linvel().x
        const currentEk = 0.5 * data.mass * v * v
        const initialEk = 0.5 * data.mass * data.initialVelocity * data.initialVelocity
        return currentEk - initialEk
      },
    },
  ],
  guideSteps: [
    {
      title: { zh: '设置参数', en: 'Set Parameters' },
      description: {
        zh: '调整小车初速度、质量和摩擦系数。',
        en: 'Adjust cart initial velocity, mass, and friction.',
      },
    },
    {
      title: { zh: '观察减速过程', en: 'Observe Deceleration' },
      description: {
        zh: '小车在摩擦力作用下减速。观察动能随距离的变化。',
        en: 'The cart decelerates. Observe kinetic energy change with distance.',
      },
    },
    {
      title: { zh: '验证动能定理', en: 'Verify Theorem' },
      description: {
        zh: '比较"摩擦力做功"和"动能变化"——两者应相等（W = ΔEk），验证动能定理。',
        en: 'Compare "Work by Friction" and "Kinetic Energy Change" — they should be equal (W = ΔEk).',
      },
      hint: {
        zh: '摩擦力做负功，动能减小，二者数值相等。',
        en: 'Friction does negative work, kinetic energy decreases, and |W| = |ΔEk|.',
      },
    },
  ],
  thumbnail: 'kinetic-energy',
}

registerExperiment(kineticEnergyTheoremExperiment)
