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

const tickerTimerExperiment: ExperimentDefinition = {
  id: 'MECH-01',
  category: 'mechanics',
  name: { zh: '用打点计时器测量平均速度', en: 'Ticker Tape Timer - Average Velocity' },
  description: {
    zh: '小车沿倾斜轨道匀加速下滑，打点计时器在纸带上记录位置。通过分析纸带上的点迹，测量平均速度和加速度（匀变速直线运动）。',
    en: 'A cart slides down a tilted track with uniform acceleration. A ticker tape timer records positions. Analyze the tape to measure average velocity and acceleration.',
  },
  difficulty: 1,
  formulas: [
    'v = \\frac{\\Delta x}{\\Delta t}',
    'a = \\frac{\\Delta v}{\\Delta t}',
    'x = v_0 t + \\frac{1}{2}at^2',
  ],
  params: [
    {
      key: 'trackAngle',
      name: { zh: '轨道倾角', en: 'Track Angle' },
      min: 0,
      max: 30,
      default: 5,
      step: 1,
      unit: '°',
    },
    {
      key: 'cartMass',
      name: { zh: '小车质量', en: 'Cart Mass' },
      min: 0.1,
      max: 2,
      default: 0.5,
      step: 0.1,
      unit: 'kg',
    },
    {
      key: 'friction',
      name: { zh: '摩擦系数', en: 'Friction Coefficient' },
      min: 0,
      max: 0.3,
      default: 0.05,
      step: 0.01,
      unit: '',
    },
  ],
  setup: (world, params) => {
    const angleDeg = params.trackAngle ?? 5
    const angle = (angleDeg * Math.PI) / 180
    const cartMass = params.cartMass ?? 0.5
    const friction = params.friction ?? 0.05

    const trackHalfLen = 4
    const trackY = 1
    const trackRotation: [number, number, number, number] = [
      0,
      0,
      Math.sin(angle / 2),
      Math.cos(angle / 2),
    ]

    world.addBody('track', {
      type: 'static',
      shape: 'box',
      dimensions: [trackHalfLen, 0.05, 0.5],
      position: [0, trackY, 0],
      rotation: trackRotation,
      friction: friction,
      restitution: 0,
    })

    const cartStartX = trackHalfLen * 0.7 * Math.cos(angle)
    const cartStartY = trackY + trackHalfLen * 0.7 * Math.sin(angle) + 0.15
    world.addBody('cart', {
      type: 'dynamic',
      shape: 'box',
      dimensions: [0.2, 0.1, 0.15],
      position: [cartStartX, cartStartY, 0],
      mass: cartMass,
      friction: friction * 0.5,
      restitution: 0,
      linearDamping: 0,
      angularDamping: 0.5,
    })

    return {
      bodyLabels: ['track', 'cart'],
      bodies: [
        {
          label: 'track',
          shape: 'box',
          dimensions: [trackHalfLen, 0.05, 0.5],
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
      key: 'positionX',
      name: { zh: '水平位置', en: 'Horizontal Position' },
      type: 'scalar',
      collect: (world) => {
        const cart = world.getBody('cart')
        if (!cart) return 0
        return cart.rigidBody.translation().x
      },
    },
    {
      key: 'speed',
      name: { zh: '速率', en: 'Speed' },
      type: 'scalar',
      collect: (world) => {
        const cart = world.getBody('cart')
        if (!cart) return 0
        return magnitude(cart.rigidBody.linvel())
      },
    },
    createAccelerationCollector(),
  ],
  guideSteps: [
    {
      title: { zh: '设置轨道倾角', en: 'Set Track Angle' },
      description: {
        zh: '调整轨道倾角，倾角越大加速度越大（a = g·sinθ）。',
        en: 'Adjust the track angle. Larger angle means larger acceleration (a = g·sinθ).',
      },
    },
    {
      title: { zh: '释放小车', en: 'Release the Cart' },
      description: {
        zh: '释放小车，观察其沿轨道匀加速下滑。系统会自动记录位置数据。',
        en: 'Release the cart and observe it sliding down with uniform acceleration. Position data is recorded automatically.',
      },
    },
    {
      title: { zh: '分析数据', en: 'Analyze Data' },
      description: {
        zh: '根据记录的位置数据计算各时间段内的平均速度，并绘制 v-t 图像求加速度。',
        en: 'Calculate average velocity from position data and plot v-t graph to find acceleration.',
      },
      hint: {
        zh: 'v-t 图像的斜率即为加速度。',
        en: 'The slope of the v-t graph is the acceleration.',
      },
    },
  ],
  thumbnail: 'ticker-timer',
}

registerExperiment(tickerTimerExperiment)
