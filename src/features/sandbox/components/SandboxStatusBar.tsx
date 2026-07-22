import { useMemo } from 'react'
import { useShallow } from 'zustand/shallow'
import { useI18n } from '@/shared/hooks/useI18n'
import { useSandboxStore } from '../sandboxStore'
import { getFriendlyName } from '../friendlyName'
import { useFps } from '@/shared/hooks/useFps'
import { Box as BoxIcon, Link2, Lock, EyeOff } from 'lucide-react'

export function SandboxStatusBar() {
  const { t } = useI18n()
  const { items, joints, selectedId, multiSelectedIds } = useSandboxStore(
    useShallow((s) => ({
      items: s.items,
      joints: s.joints,
      selectedId: s.selectedId,
      multiSelectedIds: s.multiSelectedIds,
    }))
  )
  const fps = useFps()

  const selectedCount = [selectedId, ...multiSelectedIds].filter(Boolean).length

  const friendlyName = useMemo(() => {
    if (!selectedId) return ''
    return getFriendlyName(items, selectedId)
  }, [items, selectedId])

  const selectedLockedCount = useMemo(() => {
    const ids = [selectedId, ...multiSelectedIds].filter(Boolean) as string[]
    return ids.filter((id) => items.find((it) => it.id === id)?.locked).length
  }, [items, selectedId, multiSelectedIds])

  const selectedHiddenCount = useMemo(() => {
    const ids = [selectedId, ...multiSelectedIds].filter(Boolean) as string[]
    return ids.filter((id) => items.find((it) => it.id === id)?.hidden).length
  }, [items, selectedId, multiSelectedIds])

  return (
    <div className="mb-2 flex items-center gap-3 px-1 text-xs text-text-tertiary">
      <span className="flex items-center gap-1">
        <BoxIcon className="h-3 w-3" />
        {items.length} {t('sandbox.objects')}
      </span>
      {joints.length > 0 && (
        <span className="flex items-center gap-1">
          <Link2 className="h-3 w-3" />
          {joints.length} {t('sandbox.joints')}
        </span>
      )}
      {selectedCount > 0 && (
        <span className="rounded bg-accent-soft px-1.5 py-0.5 text-accent">
          {selectedCount === 1
            ? `${t('sandbox.selected')}: ${friendlyName}`
            : `${selectedCount} ${t('sandbox.selected')}`}
        </span>
      )}
      {selectedLockedCount > 0 && (
        <span className="flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-amber-700">
          <Lock className="h-3 w-3" />
          {selectedLockedCount}
        </span>
      )}
      {selectedHiddenCount > 0 && (
        <span className="flex items-center gap-1 rounded bg-slate-200 px-1.5 py-0.5 text-slate-600">
          <EyeOff className="h-3 w-3" />
          {selectedHiddenCount}
        </span>
      )}
      <span className="ml-auto font-mono">FPS: {fps}</span>
    </div>
  )
}
