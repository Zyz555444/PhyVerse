import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

interface MotionData {
  verticalSpeed: number
  horizontalSpeed: number
}

const motionCompositionExperiment: ExperimentDefinition = {
  id: 'MECH-13',
  category: 'mechanics',
  name: { zh: '观察红蜡块运动（运动的合成与分解）', en: 'Motion Composition: Red Wax Block' },
  description: {
    zh: '红蜡块在竖直玻璃管中匀速上升，同时玻璃管水平匀速移动。蜡块的实际运动是这两个独立运动的合成——一条斜向直线。验证运动的独立性原理。',
    en: 'A red wax block rises vertically in a tube while the tube moves horizontally. The actual motion is the composition of two independent motions — a diagonal straight line.',
  },
  difficulty: 1,
  formulas: ['v_x = v_{horizontal}', 'v_y = v_{vertical}', 'v = \\sqrt{v_x^2 + v_y^2}'],
  params: [
    {
      key: 'verticalSpeed',
      name: { zh: '竖直速度', en: 'Vertical Speed' },
      min: 0.2,
      max: 3,
      default: 0.5,
      step: 0.1,
      unit: 'm/s',
    },
    {
      key: 'horizontalSpeed',
      name: { zh: '水平速度', en: 'Horizontal Speed' },
      min: 0.2,
      max: 3,
      default: 1,
      step: 0.1,
      unit: 'm/s',
    },
  ],
  setup: (world, params) => {
    const vy = params.verticalSpeed ?? 0.5
    const vx = params.horizontalSpeed ?? 1

    const g = world.world.gravity
    const originalGravity = { x: g.x, y: g.y, z: g.z }
    world.setGravity(0, 0, 0)

    const startY = 0.8

    world.addBody('tube-back', {
      type: 'static',
      shape: 'box',
      dimensions: [0.005, 2, 0.15],
      position: [-0.12, startY + 1, 0],
      friction: 0,
      restitution: 0,
    })

    world.addBody('tube-front', {
      type: 'static',
      shape: 'box',
      dimensions: [0.005, 2, 0.15],
      position: [0.12, startY + 1, 0],
      friction: 0,
      restitution: 0,
    })

    world.addBody('wax-block', {
      type: 'dynamic',
      shape: 'box',
      dimensions: [0.06, 0.06, 0.06],
      position: [0, startY, 0],
      mass: 0.1,
      friction: 0,
      restitution: 0,
      linearDamping: 0,
      angularDamping: 1,
    })

    const block = world.getBody('wax-block')!
    block.rigidBody.setLinvel({ x: vx, y: vy, z: 0 }, true)
    block.rigidBody.userData = { verticalSpeed: vy, horizontalSpeed: vx } satisfies MotionData

    return {
      bodyLabels: ['tube-back', 'tube-front', 'wax-block'],
      bodies: [
        {
          label: 'tube-back',
          shape: 'box',
          dimensions: [0.005, 2, 0.15],
          material: 'glass',
          color: '#a8d8ea',
        },
        {
          label: 'tube-front',
          shape: 'box',
          dimensions: [0.005, 2, 0.15],
          material: 'glass',
          color: '#a8d8ea',
        },
        {
          label: 'wax-block',
          shape: 'box',
          dimensions: [0.06, 0.06, 0.06],
          material: 'rubber',
          color: '#dc2626',
        },
      ],
      cleanup: () => {
        world.setGravity(originalGravity.x, originalGravity.y, originalGravity.z)
      },
    }
  },
  dataCollectors: [
    {
      key: 'positionX',
      name: { zh: '水平位置', en: 'Horizontal Position' },
      type: 'scalar',
      collect: (world) => {
        const block = world.getBody('wax-block')
        if (!block) return 0
        return block.rigidBody.translation().x
      },
    },
    {
      key: 'positionY',
      name: { zh: '竖直位置', en: 'Vertical Position' },
      type: 'scalar',
      collect: (world) => {
        const block = world.getBody('wax-block')
        if (!block) return 0
        return block.rigidBody.translation().y
      },
    },
    {
      key: 'speed',
      name: { zh: '合速度', en: 'Resultant Speed' },
      type: 'scalar',
      collect: (world) => {
        const block = world.getBody('wax-block')
        if (!block) return 0
        const v = block.rigidBody.linvel()
        return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
      },
    },
    {
      key: 'expectedSpeed',
      name: { zh: '理论合速度', en: 'Expected Speed' },
      type: 'scalar',
      collect: (world) => {
        const block = world.getBody('wax-block')
        if (!block) return 0
        const data = block.rigidBody.userData as MotionData
        return Math.sqrt(
          data.horizontalSpeed * data.horizontalSpeed + data.verticalSpeed * data.verticalSpeed
        )
      },
    },
  ],
  guideSteps: [
    {
      title: { zh: '设置分速度', en: 'Set Component Velocities' },
      description: {
        zh: '调整蜡块的竖直上升速度和水平移动速度。',
        en: 'Adjust the wax block vertical rising speed and horizontal movement speed.',
      },
    },
    {
      title: { zh: '观察合运动', en: 'Observe Composite Motion' },
      description: {
        zh: '蜡块沿斜向直线运动。合速度 v = √(vₓ² + vᵧ²)，方向由两个分速度共同决定。',
        en: 'The block moves along a diagonal straight line. Resultant speed v = √(vₓ² + vᵧ²), direction determined by both components.',
      },
    },
    {
      title: { zh: '理解运动独立性', en: 'Understand Motion Independence' },
      description: {
        zh: '水平运动和竖直运动互不影响（独立性原理）。改变一个分速度不影响另一个方向的运动。',
        en: 'Horizontal and vertical motions are independent. Changing one component does not affect the other.',
      },
      hint: {
        zh: '合位移 = 竖直位移 + 水平位移（矢量合成）。',
        en: 'Resultant displacement = vertical + horizontal (vector addition).',
      },
    },
  ],
  thumbnail: 'motion-composition',
}

registerExperiment(motionCompositionExperiment)
