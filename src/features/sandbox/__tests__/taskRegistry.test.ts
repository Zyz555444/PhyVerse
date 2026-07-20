import { describe, it, expect } from 'vitest'
import {
  evaluateObjective,
  getTaskById,
  type TaskObjective,
} from '../taskRegistry'
import type { TelemetrySample } from '../sandboxStore'

function makeSample(overrides: Partial<TelemetrySample> = {}): TelemetrySample {
  return {
    t: 1.0,
    pos: [0, 2, 0],
    vel: [0, -3, 0],
    speed: 3,
    accel: 9.81,
    accelX: 0,
    accelY: -9.81,
    accelZ: 0,
    ke: 4.5,
    pe: 19.62,
    ...overrides,
  }
}

describe('taskRegistry', () => {
  describe('getTaskById', () => {
    it('returns the task when found', () => {
      const task = getTaskById('free-fall')
      expect(task).toBeDefined()
      expect(task!.id).toBe('free-fall')
    })

    it('returns undefined when not found', () => {
      const task = getTaskById('non-existent')
      expect(task).toBeUndefined()
    })
  })

  describe('evaluateObjective - measure', () => {
    const measureObj: TaskObjective = {
      type: 'measure',
      measure: {
        source: { type: 'telemetry', itemId: 'test-ball', metric: 'accelY' },
        target: 9.81,
        tolerance: 0.5,
      },
    }

    it('passes when measurement is within tolerance', () => {
      const sample = makeSample({ accelY: -9.85 })
      const getSample = () => sample
      const result = evaluateObjective(measureObj, getSample, 0)
      expect(result.passed).toBe(true)
    })

    it('fails when measurement is outside tolerance', () => {
      const sample = makeSample({ accelY: -5.0 })
      const getSample = () => sample
      const result = evaluateObjective(measureObj, getSample, 0)
      expect(result.passed).toBe(false)
    })

    it('returns waiting for data when sample is null', () => {
      const getSample = () => null
      const result = evaluateObjective(measureObj, getSample, 0)
      expect(result.passed).toBe(false)
      expect(result.detail).toContain('waiting')
    })

    it('uses absolute value of accelY for comparison', () => {
      // accelY -9.81 should be treated the same as +9.81
      const sample1 = makeSample({ accelY: -9.81 })
      const sample2 = makeSample({ accelY: 9.81 })
      const r1 = evaluateObjective(measureObj, () => sample1, 0)
      const r2 = evaluateObjective(measureObj, () => sample2, 0)
      expect(r1.passed).toBe(true)
      expect(r2.passed).toBe(true)
    })

    it('checks itemId mismatch via getSample function', () => {
      // The getSample should handle itemId matching externally
      const obj: TaskObjective = {
        type: 'measure',
        measure: {
          source: { type: 'telemetry', itemId: 'different-ball', metric: 'accelY' },
          target: 9.81,
          tolerance: 0.5,
        },
      }
      // Simulating itemId mismatch - getSample returns null
      const getSample = (_itemId?: string) => null
      const result = evaluateObjective(obj, getSample, 0)
      expect(result.passed).toBe(false)
      expect(result.detail).toContain('waiting')
    })
  })

  describe('evaluateObjective - compare', () => {
    const compareObj: TaskObjective = {
      type: 'compare',
      compare: {
        left: { type: 'telemetry', itemId: 'ball-a', metric: 'totalEnergy' },
        right: { type: 'telemetry', itemId: 'ball-b', metric: 'totalEnergy' },
        tolerance: 0.15,
      },
    }

    it('passes when two values are close', () => {
      const getSample = (_itemId?: string) => {
        return makeSample({ ke: 10, pe: 5 })
      }
      const result = evaluateObjective(compareObj, getSample, 0)
      expect(result.passed).toBe(true)
    })

    it('fails when two values are far apart', () => {
      const left = makeSample({ ke: 10, pe: 5 })
      const right = makeSample({ ke: 20, pe: 10 })
      // Return different values based on itemId
      let callCount = 0
      const getSample = (_itemId?: string) => {
        const isLeft = callCount % 2 === 0
        callCount++
        return isLeft ? left : right
      }
      const result = evaluateObjective(compareObj, getSample, 0)
      expect(result.passed).toBe(false)
    })

    it('returns waiting for data when left sample is null', () => {
      let callCount = 0
      const getSample = (_itemId?: string) => {
        callCount++
        return null
      }
      const result = evaluateObjective(compareObj, getSample, 0)
      expect(result.passed).toBe(false)
      expect(result.detail).toContain('waiting')
    })
  })

  describe('evaluateObjective - record', () => {
    const recordObj: TaskObjective = {
      type: 'record',
      record: { minRecords: 3 },
    }

    it('passes when record count meets minimum', () => {
      const result = evaluateObjective(recordObj, () => null, 3)
      expect(result.passed).toBe(true)
    })

    it('passes when record count exceeds minimum', () => {
      const result = evaluateObjective(recordObj, () => null, 5)
      expect(result.passed).toBe(true)
    })

    it('fails when record count is below minimum', () => {
      const result = evaluateObjective(recordObj, () => null, 2)
      expect(result.passed).toBe(false)
    })
  })

  describe('evaluateObjective - edge cases', () => {
    it('handles speed metric correctly', () => {
      const obj: TaskObjective = {
        type: 'measure',
        measure: {
          source: { type: 'telemetry', metric: 'speed' },
          target: 5,
          tolerance: 0.1,
        },
      }
      const sample = makeSample({ speed: 5.05 })
      expect(evaluateObjective(obj, () => sample, 0).passed).toBe(true)

      const sample2 = makeSample({ speed: 2.0 })
      expect(evaluateObjective(obj, () => sample2, 0).passed).toBe(false)
    })

    it('handles ke metric correctly', () => {
      const obj: TaskObjective = {
        type: 'measure',
        measure: {
          source: { type: 'telemetry', metric: 'ke' },
          target: 10,
          tolerance: 0.1,
        },
      }
      const sample = makeSample({ ke: 10.05 })
      expect(evaluateObjective(obj, () => sample, 0).passed).toBe(true)
    })

    it('handles pe metric correctly', () => {
      const obj: TaskObjective = {
        type: 'measure',
        measure: {
          source: { type: 'telemetry', metric: 'pe' },
          target: 20,
          tolerance: 0.5,
        },
      }
      const sample = makeSample({ pe: 20.3 })
      expect(evaluateObjective(obj, () => sample, 0).passed).toBe(true)
    })

    it('handles totalEnergy metric correctly', () => {
      const obj: TaskObjective = {
        type: 'measure',
        measure: {
          source: { type: 'telemetry', metric: 'totalEnergy' },
          target: 24,
          tolerance: 0.5,
        },
      }
      const sample = makeSample({ ke: 5, pe: 19.3 })
      expect(evaluateObjective(obj, () => sample, 0).passed).toBe(true)
    })

    it('returns unknown objective for unsupported type', () => {
      const result = evaluateObjective(
        { type: 'measure' as unknown as 'measure' },
        () => makeSample(),
        0
      )
      expect(result.passed).toBe(false)
      expect(result.detail).toContain('unknown')
    })
  })
})
