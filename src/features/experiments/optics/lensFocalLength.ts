import { registerExperiment } from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

const experiment: ExperimentDefinition = {
  id: 'OPT-03',
  category: 'optics',
  name: { zh: '薄透镜焦距的测定', en: 'Thin Lens Focal Length' },
  description: {
    zh: '薄透镜成像公式：1/u + 1/v = 1/f。物距 u 和像距 v 满足此关系。测出 u 和 v 即可求焦距 f = uv/(u+v)。',
    en: 'Thin lens formula: 1/u + 1/v = 1/f. Measure object distance u and image distance v to find f = uv/(u+v).',
  },
  difficulty: 2,
  formulas: ['\\frac{1}{u} + \\frac{1}{v} = \\frac{1}{f}', 'f = \\frac{uv}{u+v}'],
  params: [
    {
      key: 'objectDistance',
      name: { zh: '物距 u', en: 'Object Distance u' },
      min: 10,
      max: 100,
      default: 30,
      step: 1,
      unit: 'cm',
    },
    {
      key: 'focalLength',
      name: { zh: '焦距 f', en: 'Focal Length f' },
      min: 5,
      max: 50,
      default: 15,
      step: 0.5,
      unit: 'cm',
    },
  ],
  setup: (world, params) => {
    const u = (params.objectDistance ?? 30) / 100
    const f = (params.focalLength ?? 15) / 100
    const v = 1 / (1 / f - 1 / u)
    const magnification = -v / u

    world.addBody('base', {
      type: 'static',
      shape: 'box',
      dimensions: [2, 0.05, 0.8],
      position: [0, 0, 0],
    })

    // 物体（蜡烛）
    world.addBody('object', {
      type: 'static',
      shape: 'cylinder',
      dimensions: [0.05, 0.2, 0],
      position: [-u, 0.25, 0],
    })
    // 透镜
    world.addBody('lens', {
      type: 'static',
      shape: 'cylinder',
      dimensions: [0.25, 0.02, 0],
      position: [0, 0.25, 0],
    })
    // 光屏
    world.addBody('screen', {
      type: 'static',
      shape: 'box',
      dimensions: [0.02, 0.4, 0.3],
      position: [v, 0.25, 0],
    })

    const lens = world.getBody('lens')!
    lens.rigidBody.userData = {
      objectDistance: u * 100,
      imageDistance: v * 100,
      focalLength: f * 100,
      magnification,
    }

    return {
      bodyLabels: ['base', 'object', 'lens', 'screen'],
      bodies: [
        {
          label: 'base',
          shape: 'box',
          dimensions: [2, 0.05, 0.8],
          material: 'wood',
          color: '#a0826d',
        },
        {
          label: 'object',
          shape: 'cylinder',
          dimensions: [0.05, 0.2, 0],
          material: 'glass',
          color: '#ff9800',
        },
        {
          label: 'lens',
          shape: 'cylinder',
          dimensions: [0.25, 0.02, 0],
          material: 'glass',
          color: '#a0d8ef',
        },
        {
          label: 'screen',
          shape: 'box',
          dimensions: [0.02, 0.4, 0.3],
          material: 'paper',
          color: '#f5f5dc',
        },
      ],
    }
  },
  dataCollectors: [
    {
      key: 'imageDistance',
      name: { zh: '像距 v', en: 'Image Distance v' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('lens')?.rigidBody.userData as Record<string, number> | undefined)
          ?.imageDistance ?? 0,
    },
    {
      key: 'focalLength',
      name: { zh: '焦距 f', en: 'Focal Length f' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('lens')?.rigidBody.userData as Record<string, number> | undefined)
          ?.focalLength ?? 0,
    },
    {
      key: 'magnification',
      name: { zh: '放大率 M', en: 'Magnification M' },
      type: 'scalar',
      collect: (world) =>
        (world.getBody('lens')?.rigidBody.userData as Record<string, number> | undefined)
          ?.magnification ?? 0,
    },
  ],
  guideSteps: [
    {
      title: { zh: '调整物距', en: 'Adjust Object Distance' },
      description: {
        zh: '当 u > 2f 时成倒立缩小实像；f < u < 2f 时成倒立放大实像。',
        en: 'u > 2f: inverted, reduced real image; f < u < 2f: inverted, magnified real image.',
      },
    },
    {
      title: { zh: '测量焦距', en: 'Measure Focal Length' },
      description: {
        zh: 'f = uv/(u+v)。移动光屏直到像最清晰。',
        en: 'f = uv/(u+v). Move screen until image is sharpest.',
      },
      hint: { zh: 'u = 2f 时 v = 2f，像与物等大。', en: 'u = 2f → v = 2f, image equals object.' },
    },
  ],
  thumbnail: 'lens-focal-length',
}

registerExperiment(experiment)
