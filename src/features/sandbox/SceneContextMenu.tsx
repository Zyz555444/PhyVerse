import { useEffect, useMemo } from 'react'
import { useI18n } from '@/shared/hooks/useI18n'
import { useSandboxStore } from '@/features/sandbox/sandboxStore'
import { cn } from '@/shared/utils/cn'
import {
  Copy,
  ClipboardCopy,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ArrowDownToDot,
} from 'lucide-react'

interface SceneContextMenuProps {
  x: number
  y: number
  onClose: () => void
}

export function SceneContextMenu({ x, y, onClose }: SceneContextMenuProps) {
  const { t } = useI18n()
  const selectedId = useSandboxStore((s) => s.selectedId)
  const multiSelectedIds = useSandboxStore((s) => s.multiSelectedIds)
  const items = useSandboxStore((s) => s.items)
  const copyItem = useSandboxStore((s) => s.copyItem)
  const duplicateItem = useSandboxStore((s) => s.duplicateItem)
  const removeItem = useSandboxStore((s) => s.removeItem)
  const snapSelectedToGround = useSandboxStore((s) => s.snapSelectedToGround)
  const alignSelected = useSandboxStore((s) => s.alignSelected)
  const distributeSelected = useSandboxStore((s) => s.distributeSelected)
  const toggleLockForSelection = useSandboxStore((s) => s.toggleLockForSelection)
  const toggleVisibilityForSelection = useSandboxStore((s) => s.toggleVisibilityForSelection)

  const selectedIds = useMemo(
    () => [selectedId, ...multiSelectedIds].filter(Boolean) as string[],
    [selectedId, multiSelectedIds]
  )
  const hasSelection = selectedIds.length > 0

  useEffect(() => {
    const clickAway = () => onClose()
    document.addEventListener('click', clickAway)
    return () => document.removeEventListener('click', clickAway)
  }, [onClose])

  if (!hasSelection) return null

  const allLocked = selectedIds.every((id) => items.find((it) => it.id === id)?.locked)
  const allHidden = selectedIds.every((id) => items.find((it) => it.id === id)?.hidden)

  const handleCopy = () => {
    if (selectedId) copyItem(selectedId)
    onClose()
  }

  const handleDuplicate = () => {
    if (selectedId) duplicateItem(selectedId)
    onClose()
  }

  const handleDelete = () => {
    if (selectedId) removeItem(selectedId)
    onClose()
  }

  return (
    <div
      className="fixed z-50 w-52 rounded-lg border border-border bg-paper py-1 shadow-xl"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <SectionLabel>{t('sandbox.editSelection')}</SectionLabel>
      <MenuItem icon={Copy} label={t('sandbox.duplicate')} onClick={handleDuplicate} />
      <MenuItem icon={ClipboardCopy} label={t('sandbox.copy')} onClick={handleCopy} />
      <MenuItem icon={Trash2} label={t('sandbox.delete')} onClick={handleDelete} />
      <Divider />
      <MenuItem
        icon={ArrowDownToDot}
        label={t('sandbox.snapSelectedToGround')}
        onClick={() => {
          snapSelectedToGround()
          onClose()
        }}
      />
      <MenuItem
        icon={allLocked ? Unlock : Lock}
        label={allLocked ? t('sandbox.unlock') : t('sandbox.lock')}
        onClick={() => {
          toggleLockForSelection()
          onClose()
        }}
      />
      <MenuItem
        icon={allHidden ? Eye : EyeOff}
        label={allHidden ? t('sandbox.show') : t('sandbox.hide')}
        onClick={() => {
          toggleVisibilityForSelection()
          onClose()
        }}
      />
      <Divider />
      <SectionLabel>{t('sandbox.align')}</SectionLabel>
      <AlignControls
        onAlign={(axis, mode) => {
          alignSelected(axis, mode)
          onClose()
        }}
      />
      <SectionLabel>{t('sandbox.distribute')}</SectionLabel>
      <DistributeControls
        onDistribute={(axis) => {
          distributeSelected(axis)
          onClose()
        }}
      />
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
      {children}
    </div>
  )
}

function Divider() {
  return <div className="my-1 h-px bg-border" />
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Lock
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-text-primary transition-colors hover:bg-accent-soft hover:text-accent"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

function AlignControls({
  onAlign,
}: {
  onAlign: (axis: 'x' | 'y' | 'z', mode: 'min' | 'center' | 'max') => void
}) {
  const { t } = useI18n()
  const axes: { key: 'x' | 'y' | 'z'; label: string }[] = [
    { key: 'x', label: t('sandbox.axisX') },
    { key: 'y', label: t('sandbox.axisY') },
    { key: 'z', label: t('sandbox.axisZ') },
  ]

  return (
    <div className="px-2 pb-1">
      {axes.map(({ key, label }) => (
        <div key={key} className="flex items-center justify-between gap-1 py-0.5">
          <span className="text-xs text-text-secondary">{label}</span>
          <div className="flex gap-0.5">
            <MiniButton title={t('sandbox.alignMin')} onClick={() => onAlign(key, 'min')}>
              |←
            </MiniButton>
            <MiniButton title={t('sandbox.alignCenter')} onClick={() => onAlign(key, 'center')}>
              ┃
            </MiniButton>
            <MiniButton title={t('sandbox.alignMax')} onClick={() => onAlign(key, 'max')}>
              →|
            </MiniButton>
          </div>
        </div>
      ))}
    </div>
  )
}

function DistributeControls({ onDistribute }: { onDistribute: (axis: 'x' | 'y' | 'z') => void }) {
  const { t } = useI18n()
  const axes: { key: 'x' | 'y' | 'z'; label: string }[] = [
    { key: 'x', label: t('sandbox.axisX') },
    { key: 'y', label: t('sandbox.axisY') },
    { key: 'z', label: t('sandbox.axisZ') },
  ]

  return (
    <div className="px-2 pb-1">
      {axes.map(({ key, label }) => (
        <div key={key} className="flex items-center justify-between gap-1 py-0.5">
          <span className="text-xs text-text-secondary">{label}</span>
          <MiniButton
            title={t('sandbox.distributeAxis', { axis: label })}
            onClick={() => onDistribute(key)}
          >
            ↔
          </MiniButton>
        </div>
      ))}
    </div>
  )
}

function MiniButton({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode
  title?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        'flex h-5 min-w-[1.25rem] items-center justify-center rounded border px-1 text-[10px]',
        'border-border bg-paper-tertiary text-text-primary hover:border-border-strong hover:text-accent'
      )}
    >
      {children}
    </button>
  )
}
