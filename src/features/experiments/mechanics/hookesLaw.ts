import { registerExperiment } from '../registry'
import { createJoint } from '@/features/physics/JointFactory'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const hookesLawExperiment: ExperimentDefinition = {
  id: 'MECH-06',
  category: 'mechanics',
  name: { zh: '探究弹力与弹簧伸长的关系（胡克定律）', en: "Hooke's Law: F = kx" },
  description: {
    zh: '在弹簧下悬挂不同质量的钩码，测量弹簧的伸长量。验证弹力与伸长量成正比：F = kx，其中 k 为弹簧劲度系数。',
    en: 'Hang weights of different masses on a spring and measure the extension. Verify that force is proportional to extension: F = kx, where k is the spring constant.',
  },
  difficulty: 2,
  formulas: ['F = kx', 'k = \\frac{F}{x}', 'F_g = mg'],
  params: [
    {
      key: 'springStiffness',
      name: { zh: '弹簧劲度系数', en: 'Spring Constant k' },
      min: 10,
      max: 500,
      default: 50,
      step: 10,
      unit: 'N/m',
    },
    {
      key: 'mass',
      name: { zh: '钩码质量', en: 'Weight Mass' },
      min: 0.1,
      max: 5,
      default: 1,
      step: 0.1,
      unit: 'kg',
    },
    {
      key: 'restLength',
      name: { zh: '弹簧原长', en: 'Spring Rest Length' },
      min: 0.2,
      max: 2,
      default: 0.8,
      step: 0.1,
      unit: 'm',
    },
  ],
  setup: (world, params) => {
    const stiffness = params.springStiffness ?? 50
    const mass = params.mass ?? 1
    const restLength = params.restLength ?? 0.8

    const ceilingY = 4
    const g = 9.81
    const equilibriumExtension = (mass * g) / stiffness
    const weightY = ceilingY - restLength - equilibriumExtension - 0.1

    world.addBody('ceiling', {
      type: 'static',
      shape: 'box',
      dimensions: [1, 0.05, 0.5],
      position: [0, ceilingY, 0],
      friction: 0.5,
      restitution: 0,
    })

    world.addBody('weight', {
      type: 'dynamic',
      shape: 'box',
      dimensions: [0.12, 0.12, 0.12],
      position: [0, weightY, 0],
      mass,
      friction: 0.3,
      restitution: 0.1,
      linearDamping: 1.5,
      angularDamping: 1.0,
    })

    const ceiling = world.getBody('ceiling')!
    const weight = world.getBody('weight')!
    const joint = createJoint(world.world, {
      type: 'spring',
      body1: ceiling.rigidBody,
      body2: weight.rigidBody,
      anchor1: [0, 0, 0],
      anchor2: [0, 0.12, 0],
      restLength,
      stiffness,
      damping: 10,
    })
    world.addJoint('spring-joint', joint)

    ceiling.rigidBody.userData = { restLength, stiffness, mass }

    return {
      bodyLabels: ['ceiling', 'weight'],
      jointLabels: ['spring-joint'],
      bodies: [
        {
          label: 'ceiling',
          shape: 'box',
          dimensions: [1, 0.05, 0.5],
          material: 'wood',
          color: '#8b7355',
        },
        {
          label: 'weight',
          shape: 'box',
          dimensions: [0.12, 0.12, 0.12],
          material: 'metal',
          color: '#4b5563',
        },
      ],
      cleanup: () => {
        world.removeJoint('spring-joint')
      },
    }
  },
  dataCollectors: [
    {
      key: 'extension',
      name: { zh: '伸长量', en: 'Extension' },
      type: 'scalar',
      collect: (world) => {
        const ceiling = world.getBody('ceiling')
        const weight = world.getBody('weight')
        if (!ceiling || !weight) return 0
        const cy = ceiling.rigidBody.translation().y
        const wy = weight.rigidBody.translation().y
        const currentLength = cy - wy
        const data = ceiling.rigidBody.userData as { restLength: number }
        return Math.max(0, currentLength - (data.restLength ?? 0.8))
      },
    },
    {
      key: 'force',
      name: { zh: '弹力', en: 'Spring Force' },
      type: 'scalar',
      collect: (world) => {
        const ceiling = world.getBody('ceiling')
        const weight = world.getBody('weight')
        if (!ceiling || !weight) return 0
        const cy = ceiling.rigidBody.translation().y
        const wy = weight.rigidBody.translation().y
        const currentLength = cy - wy
        const data = ceiling.rigidBody.userData as { restLength: number; stiffness: number }
        const extension = Math.max(0, currentLength - (data.restLength ?? 0.8))
        return (data.stiffness ?? 50) * extension
      },
    },
    {
      key: 'gravityForce',
      name: { zh: '重力', en: 'Gravity Force' },
      type: 'scalar',
      collect: (world) => {
        const ceiling = world.getBody('ceiling')
        if (!ceiling) return 0
        const data = ceiling.rigidBody.userData as { mass: number }
        return (data.mass ?? 1) * 9.81
      },
    },
  ],
  guideSteps: [
    {
      title: { zh: '设置弹簧参数', en: 'Set Spring Parameters' },
      description: {
        zh: '调整弹簧劲度系数 k 和钩码质量 m。',
        en: 'Adjust the spring constant k and weight mass m.',
      },
    },
    {
      title: { zh: '观察平衡位置', en: 'Observe Equilibrium' },
      description: {
        zh: '等待重物静止，此时弹力等于重力（kx = mg）。记录伸长量 x。',
        en: 'Wait for the weight to rest. At equilibrium, spring force equals gravity (kx = mg). Record the extension x.',
      },
    },
    {
      title: { zh: '验证胡克定律', en: "Verify Hooke's Law" },
      description: {
        zh: '改变钩码质量，记录多组 (F, x) 数据。绘制 F-x 图像，斜率即为劲度系数 k。',
        en: 'Change the mass and record multiple (F, x) data pairs. Plot F-x graph; the slope is the spring constant k.',
      },
      hint: {
        zh: 'F-x 图像为过原点的直线，斜率 = k。',
        en: 'The F-x graph is a straight line through the origin with slope = k.',
      },
    },
  ],
  thumbnail: 'hookes-law',
}

registerExperiment(hookesLawExperiment)
