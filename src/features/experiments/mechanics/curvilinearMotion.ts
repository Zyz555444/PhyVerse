import { registerExperiment } from '../registry'
import { createJoint } from '@/features/physics/JointFactory'
import { magnitude, magnitudeXZ, distanceXZ } from '@/shared/utils/vectorMath'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const curvilinearMotionExperiment: ExperimentDefinition = {
  id: 'MECH-12',
  category: 'mechanics',
  name: { zh: '曲线运动的速度方向', en: 'Velocity Direction in Curvilinear Motion' },
  description: {
    zh: '做曲线运动的物体，其速度方向始终沿轨迹的切线方向。本实验通过小球在圆形轨道上的运动，验证速度方向始终垂直于半径（即沿切线）。',
    en: 'In curvilinear motion, velocity is always tangent to the trajectory. This experiment verifies that velocity is perpendicular to the radius in circular motion.',
  },
  difficulty: 1,
  formulas: ['\\vec{v} \\perp \\vec{r}', 'v = \\omega r', 'a_c = \\frac{v^2}{r}'],
  params: [
    {
      key: 'radius',
      name: { zh: '圆半径', en: 'Circle Radius' },
      min: 0.5,
      max: 3,
      default: 1.5,
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
    const radius = params.radius ?? 1.5
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
      mass: 0.3,
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
      stiffness: 3000,
      damping: 20,
    })
    world.addJoint('circular-spring', joint)

    ball.rigidBody.setLinvel({ x: 0, y: 0, z: speed }, true)

    return {
      bodyLabels: ['pivot', 'ball'],
      jointLabels: ['circular-spring'],
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
          color: '#dc2626',
        },
      ],
      cleanup: () => {
        world.removeJoint('circular-spring')
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
        return magnitude(ball.rigidBody.linvel())
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
        return distanceXZ(ball.rigidBody.translation(), pivot.rigidBody.translation())
      },
    },
    {
      key: 'tangentAngle',
      name: { zh: '速度与半径夹角', en: 'Velocity-Radius Angle' },
      type: 'scalar',
      collect: (world) => {
        const pivot = world.getBody('pivot')
        const ball = world.getBody('ball')
        if (!pivot || !ball) return 0
        const pp = pivot.rigidBody.translation()
        const bp = ball.rigidBody.translation()
        const v = ball.rigidBody.linvel()
        const rx = bp.x - pp.x
        const rz = bp.z - pp.z
        const dot = rx * v.x + rz * v.z
        const rMag = magnitudeXZ({ x: rx, z: rz })
        const vMag = magnitudeXZ(v)
        if (rMag < 0.01 || vMag < 0.01) return 0
        const cosAngle = dot / (rMag * vMag)
        const clamped = Math.max(-1, Math.min(1, cosAngle))
        return (Math.acos(clamped) * 180) / Math.PI
      },
    },
  ],
  guideSteps: [
    {
      title: { zh: '设置圆周参数', en: 'Set Circular Motion' },
      description: {
        zh: '调整圆半径和小球初始速率。',
        en: 'Adjust the circle radius and ball initial speed.',
      },
    },
    {
      title: { zh: '观察圆周运动', en: 'Observe Circular Motion' },
      description: {
        zh: '小球做匀速圆周运动。观察"速度与半径夹角"数据——始终约为90°，说明速度方向始终沿切线。',
        en: 'The ball moves in uniform circular motion. The "Velocity-Radius Angle" stays ~90°, showing velocity is always tangent.',
      },
    },
    {
      title: { zh: '理解曲线运动', en: 'Understand Curvilinear Motion' },
      description: {
        zh: '曲线运动中，速度方向时刻改变，但始终沿轨迹切线。这正是曲线运动与直线运动的本质区别。',
        en: 'In curvilinear motion, velocity direction changes constantly but is always tangent to the path. This is the essence of curvilinear motion.',
      },
      hint: {
        zh: '速度方向 = 切线方向，始终垂直于半径。',
        en: 'Velocity direction = tangent, always perpendicular to radius.',
      },
    },
  ],
  thumbnail: 'curvilinear-motion',
}

registerExperiment(curvilinearMotionExperiment)
