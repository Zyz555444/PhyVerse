import { useEffect } from 'react'
import type { GizmoMode } from './sandboxStore'

export type { GizmoMode }

interface SandboxShortcuts {
  onRunToggle: () => void
  onDelete: () => void
  onDuplicate: () => void
  onUndo: () => void
  onRedo: () => void
  onSetGizmoMode: (mode: GizmoMode) => void
  onSetGizmoSpace?: (space: 'world' | 'local') => void
  onDeselect?: () => void
  onSelectAll?: () => void
  onCopy?: () => void
  onPaste?: () => void
  onToggleSnap?: () => void
  onToggleFullscreen?: () => void
  onToggleHelp?: () => void
  onStep?: () => void
  onToggleImpulse?: () => void
  onNudge?: (axis: 'x' | 'y' | 'z', direction: 1 | -1) => void
  isGizmoActive?: () => boolean
  hasSelection?: boolean
}

export function useSandboxShortcuts({
  onRunToggle,
  onDelete,
  onDuplicate,
  onUndo,
  onRedo,
  onSetGizmoMode,
  onSetGizmoSpace,
  onDeselect,
  onSelectAll,
  onCopy,
  onPaste,
  onToggleSnap,
  onToggleFullscreen,
  onToggleHelp,
  onStep,
  onToggleImpulse,
  onNudge,
  isGizmoActive,
  hasSelection,
}: SandboxShortcuts): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.tagName === 'SELECT'

      if (isTyping) return

      const isMod = event.ctrlKey || event.metaKey
      const isGizmoDragging = isGizmoActive ? isGizmoActive() : false

      // Copy
      if (isMod && event.key.toLowerCase() === 'c' && onCopy) {
        event.preventDefault()
        onCopy()
        return
      }

      // Paste
      if (isMod && event.key.toLowerCase() === 'v' && onPaste) {
        event.preventDefault()
        onPaste()
        return
      }

      // Select all
      if (isMod && event.key.toLowerCase() === 'a' && onSelectAll) {
        event.preventDefault()
        onSelectAll()
        return
      }

      // Undo / Redo
      if (isMod && event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault()
        onUndo()
        return
      }

      if (
        (isMod && event.key.toLowerCase() === 'y') ||
        (isMod && event.shiftKey && event.key.toLowerCase() === 'z')
      ) {
        event.preventDefault()
        onRedo()
        return
      }

      // Duplicate
      if (isMod && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        onDuplicate()
        return
      }

      // Esc: deselect
      if (event.key === 'Escape' && onDeselect) {
        event.preventDefault()
        onDeselect()
        return
      }

      // Gizmo mode switching (only when not dragging and no modifier)
      if (!isMod && !isGizmoDragging && onSetGizmoMode) {
        if (event.key.toLowerCase() === 't') {
          event.preventDefault()
          onSetGizmoMode('translate')
          return
        }
        if (event.key.toLowerCase() === 'r') {
          event.preventDefault()
          onSetGizmoMode('rotate')
          return
        }
        if (event.key.toLowerCase() === 's') {
          event.preventDefault()
          onSetGizmoMode('scale')
          return
        }
      }

      // Toggle snap (no modifier)
      if (!isMod && event.key.toLowerCase() === 'g' && onToggleSnap) {
        event.preventDefault()
        onToggleSnap()
        return
      }

      // Toggle gizmo space (L)
      if (!isMod && event.key.toLowerCase() === 'l' && onSetGizmoSpace) {
        event.preventDefault()
        onSetGizmoSpace('local')
        return
      }

      // Nudge selection with arrow keys (no modifier)
      if (!isMod && onNudge) {
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          onNudge('x', -1)
          return
        }
        if (event.key === 'ArrowRight') {
          event.preventDefault()
          onNudge('x', 1)
          return
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          if (event.shiftKey) {
            onNudge('y', 1)
          } else {
            onNudge('z', -1)
          }
          return
        }
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          if (event.shiftKey) {
            onNudge('y', -1)
          } else {
            onNudge('z', 1)
          }
          return
        }
      }

      // Run/pause (disabled while dragging gizmo so Space doesn't toggle simulation)
      if ((event.key === ' ' || event.code === 'Space') && !isGizmoDragging) {
        event.preventDefault()
        onRunToggle()
        return
      }

      // Single-step simulation (N) — only meaningful while paused, but we
      // forward the request and let the host decide.
      if (!isMod && event.key.toLowerCase() === 'n' && onStep) {
        event.preventDefault()
        onStep()
        return
      }

      // Fullscreen toggle (F)
      if (!isMod && event.key.toLowerCase() === 'f' && onToggleFullscreen) {
        event.preventDefault()
        onToggleFullscreen()
        return
      }

      // Impulse mode toggle (I)
      if (!isMod && event.key.toLowerCase() === 'i' && onToggleImpulse) {
        event.preventDefault()
        onToggleImpulse()
        return
      }

      // Help overlay (?)
      if (!isMod && event.key === '?' && onToggleHelp) {
        event.preventDefault()
        onToggleHelp()
        return
      }

      // Delete
      if ((event.key === 'Delete' || event.key === 'Backspace') && hasSelection) {
        event.preventDefault()
        onDelete()
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [
    onRunToggle,
    onDelete,
    onDuplicate,
    onUndo,
    onRedo,
    onSetGizmoMode,
    onSetGizmoSpace,
    onDeselect,
    onSelectAll,
    onCopy,
    onPaste,
    onToggleSnap,
    onToggleFullscreen,
    onToggleHelp,
    onStep,
    onToggleImpulse,
    onNudge,
    isGizmoActive,
    hasSelection,
  ])
}
