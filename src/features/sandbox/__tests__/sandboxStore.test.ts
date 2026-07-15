import { describe, it, expect, beforeEach } from 'vitest'
import { useSandboxStore, type SandboxItem } from '../sandboxStore'

function makeBox(overrides: Partial<SandboxItem> = {}): SandboxItem {
  return {
    id: 'test-box',
    shape: 'box',
    position: [0, 5, 0],
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

describe('sandboxStore', () => {
  beforeEach(() => {
    useSandboxStore.setState({
      items: [],
      joints: [],
      selectedId: null,
      multiSelectedIds: [],
      gravity: [0, -9.81, 0],
      history: { past: [], future: [] },
      pendingHistorySnapshot: null,
      stepRequested: 0,
    })
  })

  describe('snapToGround', () => {
    it('sets y to half-height for a box', () => {
      const item = makeBox({ position: [0, 5, 0], size: [1, 1, 1], scale: [1, 1, 1] })
      useSandboxStore.setState({ items: [item] })

      useSandboxStore.getState().snapToGround('test-box')

      const updated = useSandboxStore.getState().items[0]
      expect(updated.position[1]).toBe(0.5)
      expect(updated.position[0]).toBe(0)
      expect(updated.position[2]).toBe(0)
    })

    it('sets y to radius for a sphere', () => {
      const item = makeBox({
        id: 'test-sphere',
        shape: 'sphere',
        position: [0, 5, 0],
        size: [0.4, 0, 0],
        scale: [1, 1, 1],
      })
      useSandboxStore.setState({ items: [item] })

      useSandboxStore.getState().snapToGround('test-sphere')

      const updated = useSandboxStore.getState().items[0]
      expect(updated.position[1]).toBeCloseTo(0.4)
    })

    it('does nothing for unknown id', () => {
      useSandboxStore.setState({ items: [makeBox()] })
      const before = useSandboxStore.getState().items

      useSandboxStore.getState().snapToGround('nonexistent')

      expect(useSandboxStore.getState().items).toBe(before)
    })
  })

  describe('toggleLock', () => {
    it('toggles locked from false to true', () => {
      useSandboxStore.setState({ items: [makeBox()] })

      useSandboxStore.getState().toggleLock('test-box')

      expect(useSandboxStore.getState().items[0].locked).toBe(true)
    })

    it('toggles locked from true to false', () => {
      useSandboxStore.setState({ items: [makeBox({ locked: true })] })

      useSandboxStore.getState().toggleLock('test-box')

      expect(useSandboxStore.getState().items[0].locked).toBe(false)
    })
  })

  describe('toggleVisibility', () => {
    it('toggles hidden from false to true', () => {
      useSandboxStore.setState({ items: [makeBox()] })

      useSandboxStore.getState().toggleVisibility('test-box')

      expect(useSandboxStore.getState().items[0].hidden).toBe(true)
    })

    it('toggles hidden from true to false', () => {
      useSandboxStore.setState({ items: [makeBox({ hidden: true })] })

      useSandboxStore.getState().toggleVisibility('test-box')

      expect(useSandboxStore.getState().items[0].hidden).toBe(false)
    })
  })

  describe('setDisplayName', () => {
    it('sets displayName on item', () => {
      useSandboxStore.setState({ items: [makeBox()] })

      useSandboxStore.getState().setDisplayName('test-box', '我的方块')

      expect(useSandboxStore.getState().items[0].displayName).toBe('我的方块')
    })

    it('clears displayName when given empty string', () => {
      useSandboxStore.setState({ items: [makeBox({ displayName: '旧名字' })] })

      useSandboxStore.getState().setDisplayName('test-box', '   ')

      expect(useSandboxStore.getState().items[0].displayName).toBeUndefined()
    })
  })

  describe('updateItemAndCommit + undo/redo', () => {
    it('pushes history on updateItemAndCommit', () => {
      useSandboxStore.setState({ items: [makeBox({ position: [0, 5, 0] })] })

      useSandboxStore.getState().updateItemAndCommit('test-box', { position: [1, 2, 3] })

      expect(useSandboxStore.getState().items[0].position).toEqual([1, 2, 3])
      expect(useSandboxStore.getState().history.past).toHaveLength(1)
    })

    it('undo restores previous state', () => {
      useSandboxStore.setState({ items: [makeBox({ position: [0, 5, 0] })] })

      useSandboxStore.getState().updateItemAndCommit('test-box', { position: [1, 2, 3] })
      useSandboxStore.getState().undo()

      expect(useSandboxStore.getState().items[0].position).toEqual([0, 5, 0])
    })

    it('redo restores undone state', () => {
      useSandboxStore.setState({ items: [makeBox({ position: [0, 5, 0] })] })

      useSandboxStore.getState().updateItemAndCommit('test-box', { position: [1, 2, 3] })
      useSandboxStore.getState().undo()
      useSandboxStore.getState().redo()

      expect(useSandboxStore.getState().items[0].position).toEqual([1, 2, 3])
    })
  })

  describe('addJoint + removeJoint', () => {
    it('adds a joint and returns its id', () => {
      useSandboxStore.setState({
        items: [makeBox({ id: 'a' }), makeBox({ id: 'b' })],
      })

      const jointId = useSandboxStore.getState().addJoint({
        type: 'spring',
        bodyA: 'a',
        bodyB: 'b',
      })

      expect(jointId).toBeTruthy()
      expect(useSandboxStore.getState().joints).toHaveLength(1)
      expect(useSandboxStore.getState().joints[0].bodyA).toBe('a')
    })

    it('removes a joint by id', () => {
      useSandboxStore.setState({
        items: [makeBox({ id: 'a' }), makeBox({ id: 'b' })],
      })

      const jointId = useSandboxStore.getState().addJoint({
        type: 'fixed',
        bodyA: 'a',
        bodyB: 'b',
      })
      useSandboxStore.getState().addJoint({
        type: 'rope',
        bodyA: 'a',
        bodyB: 'b',
      })

      useSandboxStore.getState().removeJoint(jointId)

      expect(useSandboxStore.getState().joints).toHaveLength(1)
      expect(useSandboxStore.getState().joints[0].type).toBe('rope')
    })
  })

  describe('loadScene', () => {
    it('pushes history by default', () => {
      useSandboxStore.setState({ items: [makeBox()] })

      useSandboxStore.getState().loadScene({
        gravity: [0, -5, 0],
        items: [makeBox({ id: 'loaded' })],
      })

      expect(useSandboxStore.getState().history.past).toHaveLength(1)
      expect(useSandboxStore.getState().items[0].id).toBe('loaded')
    })

    it('can skip pushing history', () => {
      useSandboxStore.setState({ items: [makeBox()] })

      useSandboxStore.getState().loadScene(
        {
          gravity: [0, -5, 0],
          items: [makeBox({ id: 'loaded' })],
        },
        { pushHistory: false }
      )

      expect(useSandboxStore.getState().history.past).toHaveLength(0)
      expect(useSandboxStore.getState().items[0].id).toBe('loaded')
    })
  })

  describe('requestStep', () => {
    it('increments stepRequested counter', () => {
      expect(useSandboxStore.getState().stepRequested).toBe(0)

      useSandboxStore.getState().requestStep()
      expect(useSandboxStore.getState().stepRequested).toBe(1)

      useSandboxStore.getState().requestStep()
      expect(useSandboxStore.getState().stepRequested).toBe(2)
    })
  })

  describe('selectItem', () => {
    it('sets selectedId for single select', () => {
      useSandboxStore.setState({ items: [makeBox()] })

      useSandboxStore.getState().selectItem('test-box')

      expect(useSandboxStore.getState().selectedId).toBe('test-box')
    })

    it('deselects when given null', () => {
      useSandboxStore.setState({ items: [makeBox()], selectedId: 'test-box' })

      useSandboxStore.getState().selectItem(null)

      expect(useSandboxStore.getState().selectedId).toBeNull()
    })
  })
})
