import { useState } from 'react'
import { useShallow } from 'zustand/shallow'
import {
  Box,
  Circle,
  CircleDashed,
  Cylinder,
  Cone,
  Pill,
  Square,
  Spline,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  ChevronDown,
  ChevronRight,
  RotateCw,
  Ruler,
  BrickWall,
  Weight,
  Atom,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/shared/hooks/useI18n'
import { cn } from '@/shared/utils/cn'
import { useSandboxStore, type SandboxShape } from './sandboxStore'
import { getFriendlyName } from './friendlyName'

const SHAPE_ICON: Record<SandboxShape, LucideIcon> = {
  box: Box,
  sphere: Circle,
  cylinder: Cylinder,
  capsule: Pill,
  cone: Cone,
  plane: Square,
  torus: CircleDashed,
  spring: Spline,
  pulley: RotateCw,
  slope: Ruler,
  barrier: BrickWall,
  force_meter: Weight,
  force_field: Atom,
}

export function SceneHierarchyPanel() {
  const { t } = useI18n()
  const { items, selectedId, multiSelectedIds, isHierarchyPanelOpen } = useSandboxStore(
    useShallow((s) => ({
      items: s.items,
      selectedId: s.selectedId,
      multiSelectedIds: s.multiSelectedIds,
      isHierarchyPanelOpen: s.ui.isHierarchyPanelOpen,
    }))
  )
  const selectItem = useSandboxStore((s) => s.selectItem)
  const removeItem = useSandboxStore((s) => s.removeItem)
  const toggleLock = useSandboxStore((s) => s.toggleLock)
  const toggleVisibility = useSandboxStore((s) => s.toggleVisibility)
  const setDisplayName = useSandboxStore((s) => s.setDisplayName)
  const setUI = useSandboxStore((s) => s.setUI)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')

  const commitRename = (id: string) => {
    setDisplayName(id, draftName)
    setEditingId(null)
    setDraftName('')
  }

  const startRename = (id: string, currentName: string) => {
    setEditingId(id)
    setDraftName(currentName)
  }

  const handleRowClick = (id: string, e: React.MouseEvent) => {
    if (editingId === id) return
    const multi = e.ctrlKey || e.metaKey || e.shiftKey
    selectItem(id, multi)
  }

  const isRowSelected = (id: string) => id === selectedId || multiSelectedIds.includes(id)

  return (
    <div className="flex flex-col rounded-lg border border-border bg-paper-secondary">
      <button
        type="button"
        onClick={() => setUI({ isHierarchyPanelOpen: !isHierarchyPanelOpen })}
        className="flex items-center justify-between rounded-t-lg px-3 py-2 text-left hover:bg-paper-tertiary/40"
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          {isHierarchyPanelOpen ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          {t('sandbox.hierarchy')}
          {items.length > 0 && (
            <span className="rounded-full bg-paper-tertiary px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
              {items.length}
            </span>
          )}
        </span>
      </button>

      {isHierarchyPanelOpen && (
        <div className="max-h-[40%] overflow-y-auto px-2 pb-2">
          {items.length === 0 ? (
            <p className="px-1 py-2 text-xs text-text-tertiary">{t('sandbox.hierarchyEmpty')}</p>
          ) : (
            <ul className="space-y-0.5">
              {items.map((item) => {
                const Icon = SHAPE_ICON[item.shape] ?? Box
                const isSelected = isRowSelected(item.id)
                const isPrimary = item.id === selectedId
                const name = getFriendlyName(items, item.id)
                const isEditing = editingId === item.id
                return (
                  <li
                    key={item.id}
                    onClick={(e) => handleRowClick(item.id, e)}
                    onDoubleClick={() => startRename(item.id, name)}
                    className={cn(
                      'group flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-xs transition-colors',
                      isPrimary
                        ? 'bg-accent-soft text-accent'
                        : isSelected
                          ? 'bg-paper-tertiary/60 text-text-primary'
                          : 'text-text-secondary hover:bg-paper-tertiary/40'
                    )}
                  >
                    <Icon className={cn('h-3 w-3 shrink-0', item.hidden && 'opacity-40')} />
                    {isEditing ? (
                      <input
                        autoFocus
                        type="text"
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={() => commitRename(item.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename(item.id)
                          if (e.key === 'Escape') {
                            setEditingId(null)
                            setDraftName('')
                          }
                        }}
                        className="min-w-0 flex-1 rounded border border-accent bg-paper px-1 py-0.5 text-xs text-text-primary outline-none"
                      />
                    ) : (
                      <span
                        className={cn(
                          'min-w-0 flex-1 truncate',
                          item.hidden && 'opacity-50 line-through'
                        )}
                        title={name}
                      >
                        {name}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleVisibility(item.id)
                      }}
                      title={item.hidden ? t('sandbox.show') : t('sandbox.hide')}
                      className={cn(
                        'shrink-0 rounded p-0.5 transition-colors',
                        item.hidden
                          ? 'text-accent opacity-100'
                          : 'text-text-tertiary opacity-0 hover:text-text-primary group-hover:opacity-100',
                        isSelected && 'opacity-100'
                      )}
                    >
                      {item.hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleLock(item.id)
                      }}
                      title={item.locked ? t('sandbox.unlock') : t('sandbox.lock')}
                      className={cn(
                        'shrink-0 rounded p-0.5 transition-colors',
                        item.locked
                          ? 'text-accent opacity-100'
                          : 'text-text-tertiary opacity-0 hover:text-text-primary group-hover:opacity-100',
                        isSelected && 'opacity-100'
                      )}
                    >
                      {item.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeItem(item.id)
                      }}
                      title={t('sandbox.delete')}
                      className={cn(
                        'shrink-0 rounded p-0.5 text-text-tertiary opacity-0 transition-colors hover:text-red-500 group-hover:opacity-100',
                        isSelected && 'opacity-100'
                      )}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
