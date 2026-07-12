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
  onDeselect?: () => void
  onCopy?: () => void
  onPaste?: () => void
  onToggleSnap?: () => void
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
  onDeselect,
  onCopy,
  onPaste,
  onToggleSnap,
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

      // Gizmo mode switching (only when not dragging)
      if (!isGizmoDragging && onSetGizmoMode) {
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

      // Toggle snap
      if (event.key.toLowerCase() === 'g' && onToggleSnap) {
        event.preventDefault()
        onToggleSnap()
        return
      }

      // Run/pause (disabled while dragging gizmo so Space doesn't toggle simulation)
      if ((event.key === ' ' || event.code === 'Space') && !isGizmoDragging) {
        event.preventDefault()
        onRunToggle()
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
    onDeselect,
    onCopy,
    onPaste,
    onToggleSnap,
    isGizmoActive,
    hasSelection,
  ])
}
