import { registerExperiment } from '../registry'
import { createJoint } from '@/features/physics/JointFactory'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const smallDeformationExperiment: ExperimentDefinition = {
  id: 'MECH-05',
  category: 'mechanics',
  name: { zh: '观察桌面的微小形变', en: 'Small Deformation of a Table' },
  description: {
    zh: '在桌面上放置重物时，桌面会发生微小形变，肉眼难以观察。利用激光笔和平面镜组成的"光放大"装置，可将微小形变放大数十倍以便观察。',
    en: 'When a heavy object is placed on a table, the surface deforms slightly. This is too small to see directly. A laser and mirror setup (optical lever) amplifies the deformation for observation.',
  },
  difficulty: 1,
  formulas: ['\\Delta x_{amplified} = \\Delta x \\cdot \\frac{2D}{L}', 'F = k \\Delta x'],
  params: [
    {
      key: 'loadMass',
      name: { zh: '载荷质量', en: 'Load Mass' },
      min: 0.1,
      max: 10,
      default: 2,
      step: 0.1,
      unit: 'kg',
    },
    {
      key: 'tableStiffness',
      name: { zh: '桌面刚度', en: 'Table Stiffness' },
      min: 100,
      max: 5000,
      default: 2000,
      step: 100,
      unit: 'N/m',
    },
  ],
  setup: (world, params) => {
    const loadMass = params.loadMass ?? 2
    const stiffness = params.tableStiffness ?? 2000

    const tableY = 1.0
    const tableHalfWidth = 1.2
    const tableHalfDepth = 0.6

    world.addBody('table-base', {
      type: 'static',
      shape: 'box',
      dimensions: [0.1, 0.5, 0.1],
      position: [0, tableY - 0.5, 0],
      friction: 0.8,
      restitution: 0,
    })

    const surfaceY = tableY + 0.05
    world.addBody('table-surface', {
      type: 'dynamic',
      shape: 'box',
      dimensions: [tableHalfWidth, 0.03, tableHalfDepth],
      position: [0, surfaceY, 0],
      mass: 5,
      friction: 0.5,
      restitution: 0.1,
      linearDamping: 5,
      angularDamping: 5,
    })

    const weightY = surfaceY + 0.1
    world.addBody('weight', {
      type: 'dynamic',
      shape: 'box',
      dimensions: [0.15, 0.15, 0.15],
      position: [0, weightY, 0],
      mass: loadMass,
      friction: 0.5,
      restitution: 0,
      linearDamping: 2,
      angularDamping: 2,
    })

    const base = world.getBody('table-base')!
    const surface = world.getBody('table-surface')!
    const joint = createJoint(world.world, {
      type: 'spring',
      body1: base.rigidBody,
      body2: surface.rigidBody,
      anchor1: [0, 0.5, 0],
      anchor2: [0, -0.03, 0],
      restLength: 0.02,
      stiffness,
      damping: 30,
    })
    world.addJoint('table-spring', joint)

    surface.rigidBody.userData = { restY: surfaceY, stiffness }

    return {
      bodyLabels: ['table-base', 'table-surface', 'weight'],
      jointLabels: ['table-spring'],
      bodies: [
        {
          label: 'table-base',
          shape: 'box',
          dimensions: [0.1, 0.5, 0.1],
          material: 'metal',
          color: '#6b7280',
        },
        {
          label: 'table-surface',
          shape: 'box',
          dimensions: [tableHalfWidth, 0.03, tableHalfDepth],
          material: 'wood',
          color: '#a0826d',
        },
        {
          label: 'weight',
          shape: 'box',
          dimensions: [0.15, 0.15, 0.15],
          material: 'metal',
          color: '#1f2937',
        },
      ],
      cleanup: () => {
        world.removeJoint('table-spring')
      },
    }
  },
  dataCollectors: [
    {
      key: 'deformation',
      name: { zh: '形变量', en: 'Deformation' },
      type: 'scalar',
      collect: (world) => {
        const surface = world.getBody('table-surface')
        if (!surface) return 0
        const data = surface.rigidBody.userData as { restY: number }
        const currentY = surface.rigidBody.translation().y
        return Math.max(0, (data.restY ?? 1.05) - currentY)
      },
    },
    {
      key: 'amplifiedReading',
      name: { zh: '光放大读数', en: 'Amplified Reading' },
      type: 'scalar',
      collect: (world) => {
        const surface = world.getBody('table-surface')
        if (!surface) return 0
        const data = surface.rigidBody.userData as { restY: number }
        const currentY = surface.rigidBody.translation().y
        const deformation = Math.max(0, (data.restY ?? 1.05) - currentY)
        return deformation * 50
      },
    },
    {
      key: 'loadForce',
      name: { zh: '载荷重力', en: 'Load Force' },
      type: 'scalar',
      collect: (world) => {
        const surface = world.getBody('table-surface')
        if (!surface) return 0
        const surfaceData = surface.rigidBody.userData as { restY: number; stiffness: number }
        const deformation = Math.max(
          0,
          (surfaceData.restY ?? 1.05) - surface.rigidBody.translation().y
        )
        return (surfaceData.stiffness ?? 2000) * deformation
      },
    },
  ],
  guideSteps: [
    {
      title: { zh: '设置载荷', en: 'Set the Load' },
      description: {
        zh: '调整放在桌面上的重物质量。',
        en: 'Adjust the mass of the weight placed on the table.',
      },
    },
    {
      title: { zh: '观察放大效果', en: 'Observe Amplification' },
      description: {
        zh: '激光经桌面上的平面镜反射后投射到远处屏幕上。桌面微小形变导致镜面倾斜，光斑在屏幕上产生明显位移。',
        en: 'The laser reflects off a mirror on the table surface onto a distant screen. Small table deformation tilts the mirror, causing a noticeable spot displacement.',
      },
    },
    {
      title: { zh: '理解光放大原理', en: 'Understand Optical Amplification' },
      description: {
        zh: '光斑位移 = 2D × tan(θ)，其中 D 为镜到屏的距离，θ 为镜面倾角。形变越大，光斑偏移越大。',
        en: 'Spot displacement = 2D × tan(θ), where D is the mirror-to-screen distance and θ is the mirror tilt angle.',
      },
    },
  ],
  thumbnail: 'small-deformation',
}

registerExperiment(smallDeformationExperiment)
