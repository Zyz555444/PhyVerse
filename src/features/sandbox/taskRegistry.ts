import type { SandboxScene, SandboxItem, TelemetrySample } from './sandboxStore'

export type TaskObjectiveMetric = 'accelY' | 'speed' | 'ke' | 'pe' | 'totalEnergy' | 'period'

export interface TaskMeasureSource {
  type: 'telemetry'
  itemId?: string
  metric: TaskObjectiveMetric
}

export interface TaskObjective {
  type: 'measure' | 'compare' | 'record'
  description?: string
  measure?: {
    source: TaskMeasureSource
    target: number
    tolerance: number
  }
  compare?: {
    left: TaskMeasureSource
    right: TaskMeasureSource
    tolerance: number
  }
  record?: {
    minRecords: number
  }
}

export interface TaskStep {
  title: string
  description: string
  hint?: string
  objective?: TaskObjective
}

export interface SandboxTask {
  id: string
  title: string
  description: string
  scene: SandboxScene
  steps: TaskStep[]
}

function groundPlane(): SandboxItem {
  return {
    id: 'task-ground',
    shape: 'plane',
    position: [0, 0, 0],
    rotation: [-Math.PI / 2, 0, 0],
    scale: [1, 1, 1],
    size: [10, 0.02, 8],
    material: 'wood',
    color: '#d4c8a8',
    isDynamic: false,
    mass: 1,
    friction: 0.5,
    restitution: 0.3,
  }
}

export const freeFallTask: SandboxTask = {
  id: 'free-fall',
  title: 'task.freeFall.title',
  description: 'task.freeFall.description',
  scene: {
    gravity: [0, -9.81, 0],
    items: [
      groundPlane(),
      {
        id: 'task-ball',
        shape: 'sphere',
        position: [0, 5, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        size: [0.4, 0, 0],
        material: 'metal',
        color: '#2563eb',
        isDynamic: true,
        mass: 1,
        friction: 0.2,
        restitution: 0.3,
      },
    ],
  },
  steps: [
    {
      title: 'task.step.reset',
      description: 'task.freeFall.step1',
      hint: 'task.freeFall.hint1',
    },
    {
      title: 'task.step.run',
      description: 'task.freeFall.step2',
      hint: 'task.freeFall.hint2',
      objective: {
        type: 'measure',
        description: 'task.freeFall.objective',
        measure: {
          source: { type: 'telemetry', itemId: 'task-ball', metric: 'accelY' },
          target: 9.81,
          tolerance: 0.5,
        },
      },
    },
  ],
}

export const rampTask: SandboxTask = {
  id: 'ramp-acceleration',
  title: 'task.ramp.title',
  description: 'task.ramp.description',
  scene: {
    gravity: [0, -9.81, 0],
    items: [
      groundPlane(),
      {
        id: 'task-ramp',
        shape: 'slope',
        position: [0, 0.6, 0],
        rotation: [0, 0, Math.PI / 6],
        scale: [1, 1, 1],
        size: [4, 0.1, 2],
        material: 'wood',
        color: '#d4c8a8',
        isDynamic: false,
        mass: 1,
        friction: 0.2,
        restitution: 0.1,
      },
      {
        id: 'task-cart',
        shape: 'box',
        position: [-1.4, 2.3, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        size: [0.4, 0.4, 0.4],
        material: 'plastic',
        color: '#33a6b8',
        isDynamic: true,
        mass: 1,
        friction: 0.15,
        restitution: 0.1,
      },
    ],
  },
  steps: [
    {
      title: 'task.step.prepare',
      description: 'task.ramp.step1',
      hint: 'task.ramp.hint1',
    },
    {
      title: 'task.step.measure',
      description: 'task.ramp.step2',
      hint: 'task.ramp.hint2',
      objective: {
        type: 'measure',
        description: 'task.ramp.objective',
        measure: {
          source: { type: 'telemetry', itemId: 'task-cart', metric: 'speed' },
          target: 2.8,
          tolerance: 0.4,
        },
      },
    },
  ],
}

export const pendulumTask: SandboxTask = {
  id: 'pendulum-period',
  title: 'task.pendulum.title',
  description: 'task.pendulum.description',
  scene: {
    gravity: [0, -9.81, 0],
    items: [
      groundPlane(),
      {
        id: 'task-frame',
        shape: 'box',
        position: [0, 3.5, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        size: [0.4, 0.2, 0.4],
        material: 'metal',
        color: '#666666',
        isDynamic: false,
        mass: 1,
        friction: 0.5,
        restitution: 0.1,
      },
      {
        id: 'task-bob',
        shape: 'sphere',
        position: [1.2, 1.5, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        size: [0.3, 0, 0],
        material: 'metal',
        color: '#ea580c',
        isDynamic: true,
        mass: 1,
        friction: 0.2,
        restitution: 0.2,
      },
    ],
    joints: [
      {
        id: 'task-rope',
        type: 'rope',
        bodyA: 'task-frame',
        bodyB: 'task-bob',
        anchorA: [0, -0.1, 0],
        anchorB: [0, 0.2, 0],
        maxDistance: 2,
      },
    ],
  },
  steps: [
    {
      title: 'task.step.release',
      description: 'task.pendulum.step1',
      hint: 'task.pendulum.hint1',
    },
    {
      title: 'task.step.record',
      description: 'task.pendulum.step2',
      hint: 'task.pendulum.hint2',
      objective: {
        type: 'record',
        description: 'task.pendulum.objective',
        record: { minRecords: 3 },
      },
    },
  ],
}

export const energyTask: SandboxTask = {
  id: 'energy-conservation',
  title: 'task.energy.title',
  description: 'task.energy.description',
  scene: {
    gravity: [0, -9.81, 0],
    items: [
      groundPlane(),
      {
        id: 'task-ramp',
        shape: 'slope',
        position: [0, 0.6, 0],
        rotation: [0, 0, Math.PI / 5],
        scale: [1, 1, 1],
        size: [4, 0.1, 2],
        material: 'wood',
        color: '#d4c8a8',
        isDynamic: false,
        mass: 1,
        friction: 0.05,
        restitution: 0.05,
      },
      {
        id: 'task-ball',
        shape: 'sphere',
        position: [-1.3, 2.4, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        size: [0.35, 0, 0],
        material: 'metal',
        color: '#dc2626',
        isDynamic: true,
        mass: 1,
        friction: 0.05,
        restitution: 0.1,
      },
    ],
  },
  steps: [
    {
      title: 'task.step.prepare',
      description: 'task.energy.step1',
      hint: 'task.energy.hint1',
    },
    {
      title: 'task.step.compare',
      description: 'task.energy.step2',
      hint: 'task.energy.hint2',
      objective: {
        type: 'compare',
        description: 'task.energy.objective',
        compare: {
          left: { type: 'telemetry', itemId: 'task-ball', metric: 'totalEnergy' },
          right: { type: 'telemetry', itemId: 'task-ball', metric: 'totalEnergy' },
          tolerance: 0.15,
        },
      },
    },
  ],
}

export const TASK_REGISTRY: SandboxTask[] = [freeFallTask, rampTask, pendulumTask, energyTask]

export function getTaskById(id: string): SandboxTask | undefined {
  return TASK_REGISTRY.find((t) => t.id === id)
}

function getSampleMetric(sample: TelemetrySample, metric: TaskObjectiveMetric): number {
  switch (metric) {
    case 'accelY':
      return Math.abs(sample.accel)
    case 'speed':
      return sample.speed
    case 'ke':
      return sample.ke
    case 'pe':
      return sample.pe
    case 'totalEnergy':
      return sample.ke + sample.pe
    default:
      return 0
  }
}

export function evaluateObjective(
  objective: TaskObjective,
  getSample: (itemId?: string) => TelemetrySample | null,
  recordCount: number
): { passed: boolean; detail: string } {
  if (objective.type === 'measure' && objective.measure) {
    const sample = getSample(objective.measure.source.itemId)
    if (!sample) {
      return { passed: false, detail: 'waiting for data' }
    }
    const value = getSampleMetric(sample, objective.measure.source.metric)
    const diff = Math.abs(value - objective.measure.target)
    const passed = diff <= objective.measure.tolerance
    return {
      passed,
      detail: `measured ${value.toFixed(2)}, target ${objective.measure.target.toFixed(2)}`,
    }
  }

  if (objective.type === 'compare' && objective.compare) {
    const leftSample = getSample(objective.compare.left.itemId)
    const rightSample = getSample(objective.compare.right.itemId)
    if (!leftSample || !rightSample) {
      return { passed: false, detail: 'waiting for data' }
    }
    const left = getSampleMetric(leftSample, objective.compare.left.metric)
    const right = getSampleMetric(rightSample, objective.compare.right.metric)
    const passed = Math.abs(left - right) <= objective.compare.tolerance
    return {
      passed,
      detail: `left ${left.toFixed(2)}, right ${right.toFixed(2)}`,
    }
  }

  if (objective.type === 'record' && objective.record) {
    const passed = recordCount >= objective.record.minRecords
    return {
      passed,
      detail: `${recordCount}/${objective.record.minRecords} records`,
    }
  }

  return { passed: false, detail: 'unknown objective' }
}
