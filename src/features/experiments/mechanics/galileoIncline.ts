import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const galileoInclineExperiment: ExperimentDefinition = {
  id: 'MECH-08',
  category: 'mechanics',
  name: { zh: '模拟伽利略斜面实验', en: "Galileo's Inclined Plane Experiment" },
  description: {
    zh: '小球从一侧斜面滚下，沿另一侧斜面上滚。忽略摩擦时，小球总能到达与初始高度相同的位置。这揭示了惯性概念：若无外力，物体将保持运动状态。',
    en: 'A ball rolls down one incline and up the other. Without friction, it reaches the same height, revealing the concept of inertia.',
  },
  difficulty: 1,
  formulas: ['E_p = mgh', 'E_k = \\frac{1}{2}mv^2', 'h_{final} \\approx h_{initial}'],
  params: [
    {
      key: 'inclineAngle',
      name: { zh: '斜面倾角', en: 'Incline Angle' },
      min: 5,
      max: 30,
      default: 15,
      step: 1,
      unit: '°',
    },
    {
      key: 'ballMass',
      name: { zh: '小球质量', en: 'Ball Mass' },
      min: 0.1,
      max: 2,
      default: 0.5,
      step: 0.1,
      unit: 'kg',
    },
    {
      key: 'friction',
      name: { zh: '摩擦系数', en: 'Friction' },
      min: 0,
      max: 0.1,
      default: 0.01,
      step: 0.005,
      unit: '',
    },
  ],
  setup: (world, params) => {
    const angleDeg = params.inclineAngle ?? 15
    const angle = (angleDeg * Math.PI) / 180
    const ballMass = params.ballMass ?? 0.5
    const friction = params.friction ?? 0.01

    const halfLen = 1.5
    const baseY = 0.5
    const cosA = Math.cos(angle)
    const sinA = Math.sin(angle)

    const leftCenterX = -halfLen * cosA
    const leftCenterY = baseY + halfLen * sinA
    const leftRot: [number, number, number, number] = [
      0,
      0,
      -Math.sin(angle / 2),
      Math.cos(angle / 2),
    ]

    world.addBody('incline-left', {
      type: 'static',
      shape: 'box',
      dimensions: [halfLen, 0.04, 0.4],
      position: [leftCenterX, leftCenterY, 0],
      rotation: leftRot,
      friction,
      restitution: 0,
    })

    const rightCenterX = halfLen * cosA
    const rightCenterY = baseY + halfLen * sinA
    const rightRot: [number, number, number, number] = [
      0,
      0,
      Math.sin(angle / 2),
      Math.cos(angle / 2),
    ]

    world.addBody('incline-right', {
      type: 'static',
      shape: 'box',
      dimensions: [halfLen, 0.04, 0.4],
      position: [rightCenterX, rightCenterY, 0],
      rotation: rightRot,
      friction,
      restitution: 0,
    })

    const ballStartX = -2 * halfLen * cosA
    const ballStartY = baseY + 2 * halfLen * sinA + 0.12
    world.addBody('ball', {
      type: 'dynamic',
      shape: 'sphere',
      dimensions: [0.1, 0, 0],
      position: [ballStartX, ballStartY, 0],
      mass: ballMass,
      friction: friction * 2,
      restitution: 0.1,
      linearDamping: 0,
      angularDamping: 0.1,
    })

    const ball = world.getBody('ball')!
    ball.rigidBody.userData = { startHeight: ballStartY }

    return {
      bodyLabels: ['incline-left', 'incline-right', 'ball'],
      bodies: [
        {
          label: 'incline-left',
          shape: 'box',
          dimensions: [halfLen, 0.04, 0.4],
          material: 'wood',
          color: '#a0826d',
        },
        {
          label: 'incline-right',
          shape: 'box',
          dimensions: [halfLen, 0.04, 0.4],
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
      key: 'heightRatio',
      name: { zh: '高度比', en: 'Height Ratio' },
      type: 'scalar',
      collect: (world) => {
        const ball = world.getBody('ball')
        if (!ball) return 0
        const data = ball.rigidBody.userData as { startHeight: number }
        const currentY = ball.rigidBody.translation().y
        const startHeight = data.startHeight ?? 1
        return (currentY / startHeight) * 100
      },
    },
  ],
  guideSteps: [
    {
      title: { zh: '设置斜面', en: 'Set Up Inclines' },
      description: {
        zh: '调整斜面倾角和摩擦系数。倾角越小，小球运动的距离越长。',
        en: 'Adjust incline angle and friction. Smaller angle means longer travel distance.',
      },
    },
    {
      title: { zh: '观察运动', en: 'Observe Motion' },
      description: {
        zh: '释放小球，观察其沿一侧斜面滚下并沿另一侧上滚。记录最终到达的高度。',
        en: 'Release the ball and watch it roll down one side and up the other. Record the final height reached.',
      },
    },
    {
      title: { zh: '理解惯性', en: 'Understand Inertia' },
      description: {
        zh: '当摩擦趋近于零时，小球到达的高度趋近于初始高度。若无限延伸，小球将永不停止——这就是惯性。',
        en: 'As friction approaches zero, the ball reaches nearly the same height. With no friction, it would never stop — this is inertia.',
      },
      hint: {
        zh: '伽利略由此推断：若无摩擦，物体将永远运动下去。',
        en: 'Galileo concluded: without friction, motion would continue forever.',
      },
    },
  ],
  thumbnail: 'galileo-incline',
}

registerExperiment(galileoInclineExperiment)
