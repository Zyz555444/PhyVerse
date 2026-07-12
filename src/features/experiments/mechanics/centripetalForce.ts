import { registerExperiment } from '../registry'
import { createJoint } from '@/features/physics/JointFactory'
import type { ExperimentDefinition } from '@/shared/types/experiment'

interface CentripetalData {
  mass: number
}

const centripetalForceExperiment: ExperimentDefinition = {
  id: 'MECH-15',
  category: 'mechanics',
  name: { zh: '探究向心力与质量、角速度、半径的关系', en: 'Centripetal Force: F = mω²r' },
  description: {
    zh: '小球在水平面内做匀速圆周运动，弹簧提供向心力。验证向心力公式 F = mω²r = mv²/r。改变质量、角速度或半径，观察向心力的变化。',
    en: 'A ball moves in uniform circular motion. The spring provides centripetal force. Verify F = mω²r = mv²/r by changing mass, angular velocity, or radius.',
  },
  difficulty: 2,
  formulas: ['F = m\\omega^2 r', 'F = \\frac{mv^2}{r}', '\\omega = \\frac{v}{r}'],
  params: [
    {
      key: 'mass',
      name: { zh: '小球质量', en: 'Ball Mass' },
      min: 0.1,
      max: 3,
      default: 0.5,
      step: 0.1,
      unit: 'kg',
    },
    {
      key: 'radius',
      name: { zh: '圆半径', en: 'Circle Radius' },
      min: 0.5,
      max: 2.5,
      default: 1.2,
      step: 0.1,
      unit: 'm',
    },
    {
      key: 'initialSpeed',
      name: { zh: '初始速率', en: 'Initial Speed' },
      min: 0.5,
      max: 5,
      default: 2,
      step: 0.5,
      unit: 'm/s',
    },
  ],
  setup: (world, params) => {
    const mass = params.mass ?? 0.5
    const radius = params.radius ?? 1.2
    const speed = params.initialSpeed ?? 2

    const g = world.world.gravity
    const originalGravity = { x: g.x, y: g.y, z: g.z }
    world.setGravity(0, 0, 0)

    const pivotY = 2

    world.addBody('pivot', {
      type: 'static',
      shape: 'cylinder',
      dimensions: [0.05, 0.03, 0],
      position: [0, pivotY, 0],
      friction: 0.5,
      restitution: 0,
    })

    world.addBody('ball', {
      type: 'dynamic',
      shape: 'sphere',
      dimensions: [0.1, 0, 0],
      position: [radius, pivotY, 0],
      mass,
      friction: 0,
      restitution: 0,
      linearDamping: 0,
      angularDamping: 0,
    })

    const pivot = world.getBody('pivot')!
    const ball = world.getBody('ball')!
    const joint = createJoint(world.world, {
      type: 'spring',
      body1: pivot.rigidBody,
      body2: ball.rigidBody,
      anchor1: [0, 0, 0],
      anchor2: [0, 0, 0],
      restLength: radius,
      stiffness: 5000,
      damping: 10,
    })
    world.addJoint('centripetal-spring', joint)

    ball.rigidBody.setLinvel({ x: 0, y: 0, z: speed }, true)
    ball.rigidBody.userData = { mass } satisfies CentripetalData

    return {
      bodyLabels: ['pivot', 'ball'],
      jointLabels: ['centripetal-spring'],
      bodies: [
        {
          label: 'pivot',
          shape: 'cylinder',
          dimensions: [0.05, 0.03, 0],
          material: 'metal',
          color: '#6b7280',
        },
        {
          label: 'ball',
          shape: 'sphere',
          dimensions: [0.1, 0, 0],
          material: 'metal',
          color: '#3b82f6',
        },
      ],
      cleanup: () => {
        world.removeJoint('centripetal-spring')
        world.setGravity(originalGravity.x, originalGravity.y, originalGravity.z)
      },
    }
  },
  dataCollectors: [
    {
      key: 'speed',
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
      key: 'radius',
      name: { zh: '实际半径', en: 'Actual Radius' },
      type: 'scalar',
      collect: (world) => {
        const pivot = world.getBody('pivot')
        const ball = world.getBody('ball')
        if (!pivot || !ball) return 0
        const pp = pivot.rigidBody.translation()
        const bp = ball.rigidBody.translation()
        const dx = bp.x - pp.x
        const dz = bp.z - pp.z
        return Math.sqrt(dx * dx + dz * dz)
      },
    },
    {
      key: 'angularVelocity',
      name: { zh: '角速度', en: 'Angular Velocity' },
      type: 'scalar',
      collect: (world) => {
        const pivot = world.getBody('pivot')
        const ball = world.getBody('ball')
        if (!pivot || !ball) return 0
        const pp = pivot.rigidBody.translation()
        const bp = ball.rigidBody.translation()
        const dx = bp.x - pp.x
        const dz = bp.z - pp.z
        const r = Math.sqrt(dx * dx + dz * dz)
        const v = ball.rigidBody.linvel()
        const speed = Math.sqrt(v.x * v.x + v.z * v.z)
        if (r < 0.01) return 0
        return speed / r
      },
    },
    {
      key: 'centripetalForce',
      name: { zh: '向心力', en: 'Centripetal Force' },
      type: 'scalar',
      collect: (world) => {
        const pivot = world.getBody('pivot')
        const ball = world.getBody('ball')
        if (!pivot || !ball) return 0
        const data = ball.rigidBody.userData as CentripetalData
        const pp = pivot.rigidBody.translation()
        const bp = ball.rigidBody.translation()
        const dx = bp.x - pp.x
        const dz = bp.z - pp.z
        const r = Math.sqrt(dx * dx + dz * dz)
        const v = ball.rigidBody.linvel()
        const speed = Math.sqrt(v.x * v.x + v.z * v.z)
        if (r < 0.01) return 0
        return (data.mass * speed * speed) / r
      },
    },
  ],
  guideSteps: [
    {
      title: { zh: '设置圆周参数', en: 'Set Circular Parameters' },
      description: {
        zh: '调整小球质量、圆半径和初始速率。',
        en: 'Adjust ball mass, circle radius, and initial speed.',
      },
    },
    {
      title: { zh: '观察圆周运动', en: 'Observe Circular Motion' },
      description: {
        zh: '小球做匀速圆周运动，弹簧提供向心力。观察向心力 F = mv²/r 的数值。',
        en: 'The ball moves in uniform circular motion with spring providing centripetal force. Observe F = mv²/r.',
      },
    },
    {
      title: { zh: '验证向心力公式', en: 'Verify Formula' },
      description: {
        zh: '分别改变质量、速率和半径，观察向心力如何变化。F ∝ m, F ∝ v², F ∝ 1/r。',
        en: 'Change mass, speed, or radius to see how F changes. F ∝ m, F ∝ v², F ∝ 1/r.',
      },
      hint: {
        zh: '增大速率时向心力显著增大（平方关系）。',
        en: 'Increasing speed raises force significantly (squared relationship).',
      },
    },
  ],
  thumbnail: 'centripetal-force',
}

registerExperiment(centripetalForceExperiment)
