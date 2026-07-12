import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

interface EnergyData {
  mass: number
}

const energyConservationExperiment: ExperimentDefinition = {
  id: 'MECH-17',
  category: 'mechanics',
  name: { zh: '验证机械能守恒定律', en: 'Conservation of Mechanical Energy' },
  description: {
    zh: '小球从高处自由下落，只有重力做功。验证机械能守恒：动能 + 势能 = 常量（Ek + Ep = mgH）。下落过程中势能转化为动能，但总量不变。',
    en: 'A ball falls freely under gravity. Verify mechanical energy conservation: Ek + Ep = constant. Potential energy converts to kinetic energy, but the total remains unchanged.',
  },
  difficulty: 3,
  formulas: ['E_k + E_p = const', 'E_k = \\frac{1}{2}mv^2', 'E_p = mgh'],
  params: [
    {
      key: 'initialHeight',
      name: { zh: '初始高度', en: 'Initial Height' },
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
    const height = params.initialHeight ?? 6
    const mass = params.ballMass ?? 0.5

    world.addBody('ground', {
      type: 'static',
      shape: 'plane',
      dimensions: [6, 0, 6],
      position: [0, 0, 0],
      friction: 0.5,
      restitution: 0.1,
    })

    world.addBody('ball', {
      type: 'dynamic',
      shape: 'sphere',
      dimensions: [0.12, 0, 0],
      position: [0, height, 0],
      mass,
      friction: 0.1,
      restitution: 0.2,
      linearDamping: 0,
      angularDamping: 0,
    })

    const ball = world.getBody('ball')!
    ball.rigidBody.userData = { mass } satisfies EnergyData

    return {
      bodyLabels: ['ground', 'ball'],
      bodies: [
        {
          label: 'ground',
          shape: 'plane',
          dimensions: [6, 0, 6],
          material: 'wood',
          color: '#d4c8a8',
        },
        {
          label: 'ball',
          shape: 'sphere',
          dimensions: [0.12, 0, 0],
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
      key: 'velocity',
      name: { zh: '速率', en: 'Speed' },
      type: 'scalar',
      collect: (world) => {
        const ball = world.getBody('ball')
        if (!ball) return 0
        const v = ball.rigidBody.linvel()
        return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
      },
    },
    {
      key: 'kineticEnergy',
      name: { zh: '动能', en: 'Kinetic Energy' },
      type: 'energy',
      collect: (world) => {
        const ball = world.getBody('ball')
        if (!ball) return 0
        const data = ball.rigidBody.userData as EnergyData
        const v = ball.rigidBody.linvel()
        const speed = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
        return 0.5 * data.mass * speed * speed
      },
    },
    {
      key: 'potentialEnergy',
      name: { zh: '势能', en: 'Potential Energy' },
      type: 'energy',
      collect: (world) => {
        const ball = world.getBody('ball')
        if (!ball) return 0
        const data = ball.rigidBody.userData as EnergyData
        const h = ball.rigidBody.translation().y
        return data.mass * 9.81 * h
      },
    },
    {
      key: 'totalEnergy',
      name: { zh: '机械能', en: 'Total Mechanical Energy' },
      type: 'energy',
      collect: (world) => {
        const ball = world.getBody('ball')
        if (!ball) return 0
        const data = ball.rigidBody.userData as EnergyData
        const v = ball.rigidBody.linvel()
        const speed = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
        const h = ball.rigidBody.translation().y
        const ek = 0.5 * data.mass * speed * speed
        const ep = data.mass * 9.81 * h
        return ek + ep
      },
    },
  ],
  guideSteps: [
    {
      title: { zh: '设置初始条件', en: 'Set Initial Conditions' },
      description: {
        zh: '调整小球的初始高度和质量。',
        en: 'Adjust the ball initial height and mass.',
      },
    },
    {
      title: { zh: '观察能量转换', en: 'Observe Energy Conversion' },
      description: {
        zh: '小球下落时，势能减小、动能增大。观察"机械能"总量是否保持不变。',
        en: 'As the ball falls, potential energy decreases while kinetic energy increases. Observe if total mechanical energy stays constant.',
      },
    },
    {
      title: { zh: '验证守恒定律', en: 'Verify Conservation' },
      description: {
        zh: '在任意时刻，Ek + Ep = mgH（初始势能）。只有重力做功时，机械能守恒。',
        en: 'At any moment, Ek + Ep = mgH (initial potential energy). With only gravity doing work, mechanical energy is conserved.',
      },
      hint: {
        zh: '改变质量不影响机械能守恒——Ek 和 Ep 都与 m 成正比。',
        en: 'Changing mass does not affect conservation — both Ek and Ep are proportional to m.',
      },
    },
  ],
  thumbnail: 'energy-conservation',
}

registerExperiment(energyConservationExperiment)
