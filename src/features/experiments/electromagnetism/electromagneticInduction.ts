import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const experiment: ExperimentDefinition = {
  id: 'ELEC-10',
  category: 'electromagnetism',
  name: { zh: '电磁感应现象（楞次定律）', en: "Electromagnetic Induction (Lenz's Law)" },
  description: {
    zh: '当磁铁插入或拔出线圈时，磁通量变化，线圈中产生感应电流。楞次定律：感应电流的方向总是阻碍引起它的磁通量变化。',
    en: "When a magnet moves into or out of a coil, the changing magnetic flux induces a current. Lenz's law: induced current opposes the change that caused it.",
  },
  difficulty: 2,
  formulas: ['\\varepsilon = -\\frac{d\\Phi}{dt}', '\\Phi = B \\cdot A'],
  params: [
    {
      key: 'magnetSpeed',
      name: { zh: '磁铁速度', en: 'Magnet Speed' },
      min: 0.1,
      max: 5,
      default: 1,
      step: 0.1,
      unit: 'm/s',
    },
    {
      key: 'coilTurns',
      name: { zh: '线圈匝数', en: 'Coil Turns' },
      min: 10,
      max: 500,
      default: 100,
      step: 10,
      unit: '',
    },
    {
      key: 'magnetStrength',
      name: { zh: '磁铁强度', en: 'Magnet Strength' },
      min: 0.1,
      max: 2,
      default: 1,
      step: 0.1,
      unit: 'T',
    },
  ],
  setup: (world, params) => {
    const v = params.magnetSpeed ?? 1
    const N = params.coilTurns ?? 100
    const B = params.magnetStrength ?? 1
    const A = 0.001 // 线圈截面积
    const dPhiDt = B * A * v
    const emf = -N * dPhiDt

    world.addBody('base', {
      type: 'static',
      shape: 'box',
      dimensions: [3, 0.05, 1],
      position: [0, 0, 0],
    })

    // 线圈（圆环可视化）
    const coilLabels: string[] = []
    for (let i = 0; i < 5; i++) {
      const label = `coil-ring-${i}`
      world.addBody(label, {
        type: 'static',
        shape: 'cylinder',
        dimensions: [0.3 + i * 0.02, 0.03, 0],
        position: [0, 0.4, (i - 2) * 0.08],
      })
      coilLabels.push(label)
    }

    // 磁铁（可移动）
    world.addBody('magnet', {
      type: 'dynamic',
      shape: 'box',
      dimensions: [0.1, 0.3, 0.1],
      position: [-1.2, 0.4, 0],
      mass: 0.5,
      friction: 0.1,
      restitution: 0.2,
      linearDamping: 0.8,
    })

    const magnet = world.getBody('magnet')!
    magnet.rigidBody.setLinvel({ x: v, y: 0, z: 0 }, true)
    magnet.rigidBody.userData = {
      magnetSpeed: v,
      coilTurns: N,
      magnetStrength: B,
      emf,
      flux: B * A,
    }

    return {
      bodyLabels: ['base', ...coilLabels, 'magnet'],
      bodies: [
        {
          label: 'base',
          shape: 'box',
          dimensions: [3, 0.05, 1],
          material: 'wood',
          color: '#a0826d',
        },
        ...coilLabels.map((label, i) => ({
          label,
          shape: 'cylinder' as const,
          dimensions: [0.3 + i * 0.02, 0.03, 0] as [number, number, number],
          material: 'metal' as const,
          color: '#c89b3c',
        })),
        {
          label: 'magnet',
          shape: 'box',
          dimensions: [0.1, 0.3, 0.1],
          material: 'metal',
          color: '#dc2626',
        },
      ],
    }
  },
  dataCollectors: [
    {
      key: 'emf',
      name: { zh: '感应电动势 ε', en: 'Induced EMF ε' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('magnet')?.rigidBody.userData as Record<string, number> | undefined)?.emf ??
        0,
    },
    {
      key: 'flux',
      name: { zh: '磁通量 Φ', en: 'Magnetic Flux Φ' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('magnet')?.rigidBody.userData as Record<string, number> | undefined)?.flux ??
        0,
    },
    {
      key: 'magnetPosition',
      name: { zh: '磁铁位置', en: 'Magnet Position' },
      type: 'scalar',
      collect: (world) => world.getBody('magnet')?.rigidBody.translation().x ?? 0,
    },
  ],
  guideSteps: [
    {
      title: { zh: '观察感应现象', en: 'Observe Induction' },
      description: {
        zh: '磁铁运动时磁通量变化，线圈产生感应电流。',
        en: 'Moving magnet changes flux and induces a current in the coil.',
      },
    },
    {
      title: { zh: '楞次定律', en: "Lenz's Law" },
      description: {
        zh: '感应电流方向阻碍磁通量变化。N 极插入时，线圈近端变 N 极排斥。',
        en: 'Induced current opposes the flux change. Insert N pole → near end becomes N pole, repelling.',
      },
      hint: { zh: 'ε = -N · dΦ/dt。', en: 'ε = -N · dΦ/dt.' },
    },
  ],
  thumbnail: 'electromagnetic-induction',
}

registerExperiment(experiment)
