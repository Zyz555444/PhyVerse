import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  registerExperiment,
  getExperiment,
  getAllExperiments,
  getExperimentsByCategory,
  getExperimentCount,
  clearRegistry,
} from '../registry'
import type { ExperimentDefinition } from '@/shared/types/experiment'

function makeDef(overrides: Partial<ExperimentDefinition> = {}): ExperimentDefinition {
  return {
    id: 'TEST-01',
    category: 'mechanics',
    name: { zh: '测试', en: 'Test' },
    description: { zh: '描述', en: 'Description' },
    difficulty: 1,
    formulas: [],
    params: [],
    setup: () => ({ bodyLabels: [], bodies: [] }),
    dataCollectors: [],
    guideSteps: [],
    thumbnail: 'test',
    ...overrides,
  }
}

describe('experiment registry', () => {
  beforeEach(() => {
    clearRegistry()
  })

  it('registers and retrieves an experiment by id', () => {
    const def = makeDef()
    registerExperiment(def)
    expect(getExperiment('TEST-01')).toBe(def)
  })

  it('returns undefined for an unknown id', () => {
    expect(getExperiment('DOES-NOT-EXIST')).toBeUndefined()
  })

  it('tracks the total experiment count', () => {
    expect(getExperimentCount()).toBe(0)
    registerExperiment(makeDef({ id: 'A' }))
    registerExperiment(makeDef({ id: 'B' }))
    expect(getExperimentCount()).toBe(2)
  })

  it('returns all registered experiments', () => {
    registerExperiment(makeDef({ id: 'A' }))
    registerExperiment(makeDef({ id: 'B' }))
    expect(
      getAllExperiments()
        .map((e) => e.id)
        .sort()
    ).toEqual(['A', 'B'])
  })

  it('filters experiments by category', () => {
    registerExperiment(makeDef({ id: 'M1', category: 'mechanics' }))
    registerExperiment(makeDef({ id: 'O1', category: 'optics' }))
    registerExperiment(makeDef({ id: 'M2', category: 'mechanics' }))

    const mechanics = getExperimentsByCategory('mechanics')
    expect(mechanics.map((e) => e.id).sort()).toEqual(['M1', 'M2'])
    expect(getExperimentsByCategory('optics')).toHaveLength(1)
    expect(getExperimentsByCategory('thermal')).toHaveLength(0)
  })

  it('overwrites and warns when registering a duplicate id', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const first = makeDef({ difficulty: 1 })
    const second = makeDef({ difficulty: 3 })

    registerExperiment(first)
    registerExperiment(second)

    expect(warnSpy).toHaveBeenCalledOnce()
    expect(getExperimentCount()).toBe(1)
    expect(getExperiment('TEST-01')).toBe(second)
    warnSpy.mockRestore()
  })

  it('clears the registry', () => {
    registerExperiment(makeDef())
    clearRegistry()
    expect(getExperimentCount()).toBe(0)
    expect(getAllExperiments()).toEqual([])
  })

  afterEach(() => {
    clearRegistry()
  })
})
