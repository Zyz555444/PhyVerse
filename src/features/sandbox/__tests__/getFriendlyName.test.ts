import { describe, it, expect } from 'vitest'
import { getFriendlyName, getShapeLabelZh } from '../friendlyName'
import type { SandboxItem } from '../sandboxStore'

function makeItem(overrides: Partial<SandboxItem> = {}): SandboxItem {
  return {
    id: 'test-id-1234',
    shape: 'box',
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    size: [1, 1, 1],
    material: 'plastic',
    color: '#ffffff',
    isDynamic: true,
    mass: 1,
    friction: 0.5,
    restitution: 0.3,
    ...overrides,
  }
}

describe('getFriendlyName', () => {
  it('returns id slice for empty items array', () => {
    const result = getFriendlyName([], 'abcdef1234567890')
    expect(result).toBe('abcdef12')
  })

  it('returns id slice for unknown id', () => {
    const items = [makeItem({ id: 'known-id' })]
    const result = getFriendlyName(items, 'unknown1234567890')
    expect(result).toBe('unknown1')
  })

  it('returns displayName when set', () => {
    const items = [makeItem({ id: 'item-1', displayName: '我的方块' })]
    const result = getFriendlyName(items, 'item-1')
    expect(result).toBe('我的方块')
  })

  it('returns auto-generated name when no displayName', () => {
    const items = [makeItem({ id: 'item-1', shape: 'box' })]
    const result = getFriendlyName(items, 'item-1')
    expect(result).toBe('长方体 1')
  })

  it('increments index for same-shape items', () => {
    const items = [
      makeItem({ id: 'item-1', shape: 'box' }),
      makeItem({ id: 'item-2', shape: 'sphere' }),
      makeItem({ id: 'item-3', shape: 'box' }),
    ]
    expect(getFriendlyName(items, 'item-1')).toBe('长方体 1')
    expect(getFriendlyName(items, 'item-3')).toBe('长方体 2')
    expect(getFriendlyName(items, 'item-2')).toBe('球体 1')
  })

  it('falls back to auto name when displayName is empty string', () => {
    const items = [makeItem({ id: 'item-1', shape: 'box', displayName: '' })]
    const result = getFriendlyName(items, 'item-1')
    expect(result).toBe('长方体 1')
  })

  it('falls back to auto name when displayName is whitespace', () => {
    const items = [makeItem({ id: 'item-1', shape: 'box', displayName: '   ' })]
    const result = getFriendlyName(items, 'item-1')
    expect(result).toBe('长方体 1')
  })
})

describe('getShapeLabelZh', () => {
  it('returns Chinese label for each shape', () => {
    expect(getShapeLabelZh('box')).toBe('长方体')
    expect(getShapeLabelZh('sphere')).toBe('球体')
    expect(getShapeLabelZh('cylinder')).toBe('圆柱')
    expect(getShapeLabelZh('capsule')).toBe('胶囊')
    expect(getShapeLabelZh('cone')).toBe('圆锥')
    expect(getShapeLabelZh('plane')).toBe('平面')
    expect(getShapeLabelZh('torus')).toBe('圆环')
    expect(getShapeLabelZh('spring')).toBe('弹簧')
  })
})
