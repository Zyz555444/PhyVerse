import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  isSandboxScene,
  saveScene,
  loadStoredScene,
  importScene,
  exportScene,
  exportTelemetryCsv,
} from '../sceneStorage'
import type { SandboxItem, SandboxScene, SandboxJoint, TelemetrySample } from '../sandboxStore'

function makeItem(overrides: Partial<SandboxItem> = {}): SandboxItem {
  return {
    id: 'item-1',
    shape: 'box',
    position: [0, 1, 0],
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

function makeScene(overrides: Partial<SandboxScene> = {}): SandboxScene {
  return {
    gravity: [0, -9.81, 0],
    items: [makeItem()],
    ...overrides,
  }
}

function makeFile(content: string): File {
  return new File([content], 'scene.json', { type: 'application/json' })
}

describe('isSandboxScene', () => {
  it('accepts a valid scene', () => {
    expect(isSandboxScene(makeScene())).toBe(true)
  })

  it('accepts a scene with valid joints', () => {
    const joint: SandboxJoint = {
      id: 'j1',
      type: 'spring',
      bodyA: 'a',
      bodyB: 'b',
      anchorA: [0, 0, 0],
    }
    expect(isSandboxScene(makeScene({ joints: [joint] }))).toBe(true)
  })

  it.each([
    ['null', null],
    ['a primitive', 42],
    ['missing gravity', { items: [] }],
    ['non-tuple gravity', { gravity: [0, 0], items: [] }],
    ['items not an array', { gravity: [0, -9.81, 0], items: {} }],
  ])('rejects %s', (_label, value) => {
    expect(isSandboxScene(value)).toBe(false)
  })

  it('rejects a scene containing an invalid item', () => {
    const badItem = { ...makeItem(), mass: -5 }
    expect(isSandboxScene({ gravity: [0, -9.81, 0], items: [badItem] })).toBe(false)
  })

  it('rejects an item with an unknown shape', () => {
    const badItem = { ...makeItem(), shape: 'triangle' }
    expect(isSandboxScene({ gravity: [0, -9.81, 0], items: [badItem] })).toBe(false)
  })

  it('rejects an item with an unknown material', () => {
    const badItem = { ...makeItem(), material: 'titanium' }
    expect(isSandboxScene({ gravity: [0, -9.81, 0], items: [badItem] })).toBe(false)
  })

  it('rejects a scene with an invalid joint', () => {
    const badJoint = { id: 'j', type: 'nope', bodyA: 'a', bodyB: 'b' }
    expect(isSandboxScene({ gravity: [0, -9.81, 0], items: [], joints: [badJoint] })).toBe(false)
  })

  it('rejects a joint with a malformed anchor', () => {
    const badJoint = { id: 'j', type: 'spring', bodyA: 'a', bodyB: 'b', anchorA: [0, 0] }
    expect(isSandboxScene({ gravity: [0, -9.81, 0], items: [], joints: [badJoint] })).toBe(false)
  })
})

describe('saveScene / loadStoredScene', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('round-trips a scene through localStorage', () => {
    const scene = makeScene()
    saveScene(scene)
    const loaded = loadStoredScene()
    expect(loaded).toMatchObject(scene)
    expect(loaded?.items).toHaveLength(1)
  })

  it('persists a versioned payload', () => {
    saveScene(makeScene())
    const raw = JSON.parse(localStorage.getItem('phyverse-sandbox-scene') as string)
    expect(raw.version).toBe(1)
  })

  it('returns null when nothing is stored', () => {
    expect(loadStoredScene()).toBeNull()
  })

  it('returns null on corrupt JSON', () => {
    localStorage.setItem('phyverse-sandbox-scene', '{ not json')
    expect(loadStoredScene()).toBeNull()
  })

  it('loads a legacy scene without a version field', () => {
    localStorage.setItem('phyverse-sandbox-scene', JSON.stringify(makeScene()))
    expect(loadStoredScene()).toEqual(makeScene())
  })

  it('returns null for stored data that is not a valid scene', () => {
    localStorage.setItem('phyverse-sandbox-scene', JSON.stringify({ foo: 'bar' }))
    expect(loadStoredScene()).toBeNull()
  })
})

describe('importScene', () => {
  it('imports a valid versioned scene file', async () => {
    const payload = { version: 1, ...makeScene() }
    const result = await importScene(makeFile(JSON.stringify(payload)))
    expect(result.scene.items).toHaveLength(1)
  })

  it('imports a legacy scene file without a version', async () => {
    const result = await importScene(makeFile(JSON.stringify(makeScene())))
    expect(result.scene.gravity).toEqual([0, -9.81, 0])
  })

  it('rejects invalid JSON', async () => {
    await expect(importScene(makeFile('{ broken'))).rejects.toThrow('JSON')
  })

  it('rejects a structurally invalid scene', async () => {
    await expect(importScene(makeFile(JSON.stringify({ hello: 'world' })))).rejects.toThrow(
      '格式不正确'
    )
  })

  it('rejects a scene from a newer version', async () => {
    const payload = { version: 999, ...makeScene() }
    await expect(importScene(makeFile(JSON.stringify(payload)))).rejects.toThrow('高于当前支持版本')
  })

  it('returns metadata from new-format scenes', async () => {
    const payload = {
      version: 1,
      metadata: { name: 'Test Scene', createdAt: '2024-01-01', itemCount: 2 },
      ...makeScene(),
    }
    const result = await importScene(makeFile(JSON.stringify(payload)))
    expect(result.metadata?.name).toBe('Test Scene')
    expect(result.metadata?.itemCount).toBe(2)
  })

  it('remaps item IDs to avoid conflicts', async () => {
    const scene = makeScene()
    const originalId = scene.items[0].id
    const payload = { version: 1, ...scene }
    const result = await importScene(makeFile(JSON.stringify(payload)))
    // Imported items should have new IDs
    expect(result.scene.items[0].id).not.toBe(originalId)
  })
})

describe('export helpers', () => {
  let clickSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('exportScene triggers a download', () => {
    exportScene(makeScene())
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock')
  })

  it('exportTelemetryCsv serializes samples and triggers a download', () => {
    const samples: TelemetrySample[] = [
      {
        t: 0,
        pos: [1, 2, 3],
        vel: [4, 5, 6],
        speed: 8.775,
        accel: 1.5,
        accelX: 0.5,
        accelY: 1.2,
        accelZ: 0.8,
        ke: 10,
        pe: 20,
      },
    ]
    const blobSpy = vi.spyOn(globalThis, 'Blob')
    exportTelemetryCsv(samples, '自由落体 test')

    expect(clickSpy).toHaveBeenCalledTimes(1)
    const blobParts = blobSpy.mock.calls[0][0] as string[]
    const csv = blobParts.join('')
    expect(csv).toContain('time_s,pos_x_m')
    expect(csv).toContain('0.0000,1.0000,2.0000,3.0000')
    expect(csv).toContain('30.0000') // total energy ke + pe
  })

  it('exportTelemetryCsv writes empty strings for non-finite values', () => {
    const samples: TelemetrySample[] = [
      {
        t: 0,
        pos: [Number.NaN, 0, 0],
        vel: [0, 0, 0],
        speed: Number.POSITIVE_INFINITY,
        accel: 0,
        accelX: 0,
        accelY: 0,
        accelZ: 0,
        ke: 0,
        pe: 0,
      },
    ]
    const blobSpy = vi.spyOn(globalThis, 'Blob')
    exportTelemetryCsv(samples, '')
    const csv = (blobSpy.mock.calls[0][0] as string[]).join('')
    const dataRow = csv.split('\n')[1]
    expect(dataRow.startsWith('0.0000,,0.0000')).toBe(true)
  })
})
