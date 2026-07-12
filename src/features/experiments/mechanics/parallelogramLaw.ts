import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

interface ParallelogramData {
  force1: number
  force2: number
  angle: number
}

const parallelogramLawExperiment: ExperimentDefinition = {
  id: 'MECH-07',
  category: 'mechanics',
  name: { zh: '探究求合力的方法（平行四边形定则）', en: 'Parallelogram Law of Force Addition' },
  description: {
    zh: '两个互成角度的力同时作用在一个节点上，其合力可用平行四边形定则求得：以两力为邻边作平行四边形，对角线即为合力。验证 F合 = √(F₁² + F₂² + 2F₁F₂cosθ)。',
    en: 'Two forces at an angle act on a node. The resultant is found using the parallelogram law: F = √(F₁² + F₂² + 2F₁F₂cosθ).',
  },
  difficulty: 2,
  formulas: [
    'F = \\sqrt{F_1^2 + F_2^2 + 2F_1 F_2 \\cos\\theta}',
    '\\tan\\phi = \\frac{F_2 \\sin\\theta}{F_1 + F_2 \\cos\\theta}',
  ],
  params: [
    {
      key: 'force1',
      name: { zh: '力 F₁', en: 'Force F₁' },
      min: 1,
      max: 20,
      default: 5,
      step: 0.5,
      unit: 'N',
    },
    {
      key: 'force2',
      name: { zh: '力 F₂', en: 'Force F₂' },
      min: 1,
      max: 20,
      default: 5,
      step: 0.5,
      unit: 'N',
    },
    {
      key: 'angle',
      name: { zh: '夹角 θ', en: 'Angle θ' },
      min: 30,
      max: 150,
      default: 90,
      step: 5,
      unit: '°',
    },
  ],
  setup: (world, params) => {
    const force1 = params.force1 ?? 5
    const force2 = params.force2 ?? 5
    const angleDeg = params.angle ?? 90

    world.addBody('ring', {
      type: 'static',
      shape: 'cylinder',
      dimensions: [0.08, 0.02, 0],
      position: [0, 1, 0],
      friction: 0.5,
      restitution: 0,
    })

    world.addBody('anchor-f1', {
      type: 'static',
      shape: 'sphere',
      dimensions: [0.04, 0, 0],
      position: [-1, 1, 0],
      friction: 0.5,
      restitution: 0,
    })

    const halfAngle = (angleDeg * Math.PI) / 180 / 2
    const ax = Math.cos(halfAngle)
    const ay = Math.sin(halfAngle)
    world.addBody('anchor-f2', {
      type: 'static',
      shape: 'sphere',
      dimensions: [0.04, 0, 0],
      position: [ax, 1 + ay, 0],
      friction: 0.5,
      restitution: 0,
    })

    const ring = world.getBody('ring')!
    ring.rigidBody.userData = { force1, force2, angle: angleDeg } satisfies ParallelogramData

    return {
      bodyLabels: ['ring', 'anchor-f1', 'anchor-f2'],
      bodies: [
        {
          label: 'ring',
          shape: 'cylinder',
          dimensions: [0.08, 0.02, 0],
          material: 'metal',
          color: '#d4a574',
        },
        {
          label: 'anchor-f1',
          shape: 'sphere',
          dimensions: [0.04, 0, 0],
          material: 'metal',
          color: '#ef4444',
        },
        {
          label: 'anchor-f2',
          shape: 'sphere',
          dimensions: [0.04, 0, 0],
          material: 'metal',
          color: '#3b82f6',
        },
      ],
    }
  },
  dataCollectors: [
    {
      key: 'resultantMagnitude',
      name: { zh: '合力大小', en: 'Resultant Magnitude' },
      type: 'scalar',
      collect: (world) => {
        const ring = world.getBody('ring')
        if (!ring) return 0
        const data = ring.rigidBody.userData as ParallelogramData
        const { force1: f1, force2: f2, angle } = data
        const rad = (angle * Math.PI) / 180
        return Math.sqrt(f1 * f1 + f2 * f2 + 2 * f1 * f2 * Math.cos(rad))
      },
    },
    {
      key: 'resultantAngle',
      name: { zh: '合力方向', en: 'Resultant Direction' },
      type: 'scalar',
      collect: (world) => {
        const ring = world.getBody('ring')
        if (!ring) return 0
        const data = ring.rigidBody.userData as ParallelogramData
        const { force1: f1, force2: f2, angle } = data
        const rad = (angle * Math.PI) / 180
        const phi = Math.atan2(f2 * Math.sin(rad), f1 + f2 * Math.cos(rad))
        return (phi * 180) / Math.PI
      },
    },
    {
      key: 'force1',
      name: { zh: '力 F₁', en: 'Force F₁' },
      type: 'scalar',
      collect: (world) => {
        const ring = world.getBody('ring')
        if (!ring) return 0
        const data = ring.rigidBody.userData as ParallelogramData
        return data.force1
      },
    },
    {
      key: 'force2',
      name: { zh: '力 F₂', en: 'Force F₂' },
      type: 'scalar',
      collect: (world) => {
        const ring = world.getBody('ring')
        if (!ring) return 0
        const data = ring.rigidBody.userData as ParallelogramData
        return data.force2
      },
    },
  ],
  guideSteps: [
    {
      title: { zh: '设置两个力', en: 'Set Two Forces' },
      description: {
        zh: '调整力 F₁ 和 F₂ 的大小，以及它们之间的夹角 θ。',
        en: 'Adjust the magnitudes of F₁ and F₂, and the angle θ between them.',
      },
    },
    {
      title: { zh: '观察合力变化', en: 'Observe Resultant' },
      description: {
        zh: '观察合力大小和方向如何随分力变化。当 θ=90° 时，F合=√(F₁²+F₂²)。',
        en: 'Observe how the resultant changes. When θ=90°, F=√(F₁²+F₂²).',
      },
    },
    {
      title: { zh: '验证平行四边形定则', en: 'Verify Parallelogram Law' },
      description: {
        zh: '改变夹角，记录多组合力数据。当 θ=0° 时合力最大（F₁+F₂），θ=180° 时最小（|F₁-F₂|）。',
        en: 'Change the angle and record data. When θ=0°, F is max (F₁+F₂); when θ=180°, F is min (|F₁-F₂|).',
      },
      hint: {
        zh: '合力范围：|F₁-F₂| ≤ F合 ≤ F₁+F₂',
        en: 'Resultant range: |F₁-F₂| ≤ F ≤ F₁+F₂',
      },
    },
  ],
  thumbnail: 'parallelogram-law',
}

registerExperiment(parallelogramLawExperiment)
