import { describe, it, expect, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen } from '@/test/utils'
import { SceneHierarchyPanel } from '../SceneHierarchyPanel'
import { useSandboxStore, type SandboxItem } from '../sandboxStore'

function makeItem(overrides: Partial<SandboxItem> = {}): SandboxItem {
  return {
    id: 'item-1',
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

describe('SceneHierarchyPanel', () => {
  beforeEach(() => {
    useSandboxStore.setState({
      items: [],
      joints: [],
      selectedId: null,
      multiSelectedIds: [],
      ui: {
        isFullscreen: false,
        isLeftPanelOpen: true,
        isRightPanelOpen: true,
        isAiPanelOpen: true,
        isHierarchyPanelOpen: true,
        isHelpOpen: false,
      },
    })
  })

  it('shows empty message when no items', () => {
    renderWithProviders(<SceneHierarchyPanel />)
    expect(screen.getByText('No objects')).toBeInTheDocument()
  })

  it('renders friendly name for items', () => {
    useSandboxStore.setState({
      items: [makeItem({ id: 'item-1', shape: 'box' })],
    })
    renderWithProviders(<SceneHierarchyPanel />)
    expect(screen.getByText('长方体 1')).toBeInTheDocument()
  })

  it('renders displayName when set', () => {
    useSandboxStore.setState({
      items: [makeItem({ id: 'item-1', displayName: '我的方块' })],
    })
    renderWithProviders(<SceneHierarchyPanel />)
    expect(screen.getByText('我的方块')).toBeInTheDocument()
  })

  it('selects item on row click', async () => {
    const item = makeItem({ id: 'item-1', shape: 'box' })
    useSandboxStore.setState({ items: [item] })
    renderWithProviders(<SceneHierarchyPanel />)

    await userEvent.click(screen.getByText('长方体 1'))

    expect(useSandboxStore.getState().selectedId).toBe('item-1')
  })

  it('toggles visibility on eye button click', async () => {
    const item = makeItem({ id: 'item-1', shape: 'box' })
    useSandboxStore.setState({ items: [item] })
    renderWithProviders(<SceneHierarchyPanel />)

    const hideButton = screen.getByTitle('Hide')
    await userEvent.click(hideButton)

    expect(useSandboxStore.getState().items[0].hidden).toBe(true)
  })

  it('toggles lock on lock button click', async () => {
    const item = makeItem({ id: 'item-1', shape: 'box' })
    useSandboxStore.setState({ items: [item] })
    renderWithProviders(<SceneHierarchyPanel />)

    const lockButton = screen.getByTitle('Lock')
    await userEvent.click(lockButton)

    expect(useSandboxStore.getState().items[0].locked).toBe(true)
  })

  it('removes item on delete button click', async () => {
    const item = makeItem({ id: 'item-1', shape: 'box' })
    useSandboxStore.setState({ items: [item] })
    renderWithProviders(<SceneHierarchyPanel />)

    const deleteButton = screen.getByTitle('Delete')
    await userEvent.click(deleteButton)

    expect(useSandboxStore.getState().items).toHaveLength(0)
  })

  it('shows multiple items with incremented indices', () => {
    useSandboxStore.setState({
      items: [
        makeItem({ id: 'item-1', shape: 'box' }),
        makeItem({ id: 'item-2', shape: 'sphere' }),
        makeItem({ id: 'item-3', shape: 'box' }),
      ],
    })
    renderWithProviders(<SceneHierarchyPanel />)

    expect(screen.getByText('长方体 1')).toBeInTheDocument()
    expect(screen.getByText('球体 1')).toBeInTheDocument()
    expect(screen.getByText('长方体 2')).toBeInTheDocument()
  })
})
