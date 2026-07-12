import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const experiment: ExperimentDefinition = {
  id: 'MOD-01',
  category: 'modern',
  name: { zh: '光电效应实验', en: 'Photoelectric Effect' },
  description: {
    zh: '光照射金属表面时，若光子能量 hν 大于金属逸出功 W，则逸出光电子。最大初动能 E_k = hν - W。遏止电压 U_c = E_k/e。',
    en: 'When photon energy hν exceeds work function W, electrons are emitted. Max kinetic energy E_k = hν - W. Stopping voltage U_c = E_k/e.',
  },
  difficulty: 3,
  formulas: ['E_k = h\\nu - W', 'U_c = \\frac{h\\nu - W}{e}'],
  params: [
    {
      key: 'wavelength',
      name: { zh: '光波长 λ', en: 'Wavelength λ' },
      min: 200,
      max: 700,
      default: 400,
      step: 10,
      unit: 'nm',
    },
    {
      key: 'workFunction',
      name: { zh: '逸出功 W', en: 'Work Function W' },
      min: 1,
      max: 5,
      default: 2.3,
      step: 0.1,
      unit: 'eV',
    },
  ],
  setup: (world, params) => {
    const lambda = (params.wavelength ?? 400) * 1e-9
    const h = 6.626e-34
    const c = 3e8
    const e = 1.6e-19
    const nu = c / lambda
    const E_photon = (h * nu) / e // eV
    const W = params.workFunction ?? 2.3
    const Ek = E_photon - W
    const isEmitting = Ek > 0
    const U_c = isEmitting ? Ek : 0

    world.addBody('base', {
      type: 'static',
      shape: 'box',
      dimensions: [2.5, 0.05, 1.2],
      position: [0, 0, 0],
    })

    // 光源
    world.addBody('light-source', {
      type: 'static',
      shape: 'sphere',
      dimensions: [0.06, 0, 0],
      position: [-0.8, 0.4, 0],
    })
    // 光电管（金属板）
    world.addBody('photocathode', {
      type: 'static',
      shape: 'box',
      dimensions: [0.02, 0.4, 0.3],
      position: [0, 0.3, 0],
    })
    // 阳极
    world.addBody('anode', {
      type: 'static',
      shape: 'box',
      dimensions: [0.02, 0.4, 0.3],
      position: [0.6, 0.3, 0],
    })

    // 光电子（若发射）
    const electronLabels: string[] = []
    if (isEmitting) {
      for (let i = 0; i < 3; i++) {
        const label = `electron-${i}`
        world.addBody(label, {
          type: 'dynamic',
          shape: 'sphere',
          dimensions: [0.02, 0, 0],
          position: [0.1, 0.3 + i * 0.1, 0],
          mass: 0.0001,
          friction: 0,
          linearDamping: 0.1,
        })
        const eBody = world.getBody(label)!
        eBody.rigidBody.setLinvel({ x: 0.5, y: 0, z: 0 }, true)
        electronLabels.push(label)
      }
    }

    const cathode = world.getBody('photocathode')!
    cathode.rigidBody.userData = {
      wavelength: lambda * 1e9,
      photonEnergy: E_photon,
      workFunction: W,
      kineticEnergy: Math.max(0, Ek),
      stoppingVoltage: U_c,
      isEmitting,
    }

    return {
      bodyLabels: ['base', 'light-source', 'photocathode', 'anode', ...electronLabels],
      bodies: [
        {
          label: 'base',
          shape: 'box',
          dimensions: [2.5, 0.05, 1.2],
          material: 'wood',
          color: '#a0826d',
        },
        {
          label: 'light-source',
          shape: 'sphere',
          dimensions: [0.06, 0, 0],
          material: 'glass',
          color: lambda < 450 ? '#7a5aff' : lambda < 550 ? '#50c878' : '#ffd700',
        },
        {
          label: 'photocathode',
          shape: 'box',
          dimensions: [0.02, 0.4, 0.3],
          material: 'metal',
          color: '#c89b3c',
        },
        {
          label: 'anode',
          shape: 'box',
          dimensions: [0.02, 0.4, 0.3],
          material: 'metal',
          color: '#888',
        },
        ...electronLabels.map((label) => ({
          label,
          shape: 'sphere' as const,
          dimensions: [0.02, 0, 0] as [number, number, number],
          material: 'metal' as const,
          color: '#00ffff',
        })),
      ],
    }
  },
  dataCollectors: [
    {
      key: 'photonEnergy',
      name: { zh: '光子能量 hν', en: 'Photon Energy hν' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('photocathode')?.rigidBody.userData as Record<string, number> | undefined)
          ?.photonEnergy ?? 0,
    },
    {
      key: 'kineticEnergy',
      name: { zh: '光电子动能', en: 'Electron KE' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('photocathode')?.rigidBody.userData as Record<string, number> | undefined)
          ?.kineticEnergy ?? 0,
    },
    {
      key: 'stoppingVoltage',
      name: { zh: '遏止电压 U_c', en: 'Stopping Voltage U_c' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('photocathode')?.rigidBody.userData as Record<string, number> | undefined)
          ?.stoppingVoltage ?? 0,
    },
  ],
  guideSteps: [
    {
      title: { zh: '光电效应条件', en: 'Emission Condition' },
      description: {
        zh: '只有当 hν > W 时才发射光电子，与光强无关。',
        en: 'Electrons emit only when hν > W, regardless of light intensity.',
      },
    },
    {
      title: { zh: '遏止电压', en: 'Stopping Voltage' },
      description: {
        zh: 'U_c = (hν - W)/e。由 U_c 对 ν 作图可求普朗克常量 h。',
        en: 'U_c = (hν - W)/e. Plot U_c vs ν to find Planck constant h.',
      },
      hint: { zh: '红限频率 ν_0 = W/h。', en: 'Threshold frequency ν_0 = W/h.' },
    },
  ],
  thumbnail: 'photoelectric-effect',
}

registerExperiment(experiment)
