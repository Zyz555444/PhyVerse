import * as RadixDialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useI18n } from '@/shared/hooks/useI18n'
import { useSandboxStore } from './sandboxStore'

interface ShortcutGroup {
  titleKey: string
  items: { keys: string; descKey: string }[]
}

export function HelpOverlay() {
  const { t } = useI18n()

  const shortcutGroups: ShortcutGroup[] = [
    {
      titleKey: 'sandbox.helpSimulation',
      items: [
        { keys: 'Space', descKey: 'sandbox.helpRunPause' },
        { keys: 'N', descKey: 'sandbox.helpStep' },
        { keys: 'F', descKey: 'sandbox.helpFullscreen' },
        { keys: 'I', descKey: 'sandbox.helpImpulse' },
      ],
    },
    {
      titleKey: 'sandbox.helpTransform',
      items: [
        { keys: 'T', descKey: 'sandbox.helpTranslate' },
        { keys: 'R', descKey: 'sandbox.helpRotate' },
        { keys: 'S', descKey: 'sandbox.helpScale' },
        { keys: 'G', descKey: 'sandbox.helpSnap' },
      ],
    },
    {
      titleKey: 'sandbox.helpEdit',
      items: [
        { keys: 'Ctrl+Z', descKey: 'sandbox.helpUndo' },
        { keys: 'Ctrl+Y / Ctrl+Shift+Z', descKey: 'sandbox.helpRedo' },
        { keys: 'Ctrl+D', descKey: 'sandbox.helpDuplicate' },
        { keys: 'Ctrl+C / Ctrl+V', descKey: 'sandbox.helpCopyPaste' },
        { keys: 'Del / Backspace', descKey: 'sandbox.helpDelete' },
        { keys: 'Esc', descKey: 'sandbox.helpDeselect' },
      ],
    },
    {
      titleKey: 'sandbox.helpOther',
      items: [
        { keys: '?', descKey: 'sandbox.helpToggleHelp' },
        { keys: 'Home', descKey: 'sandbox.helpCameraResetDesc' },
        { keys: 'Double Click', descKey: 'sandbox.helpCameraFocusDesc' },
      ],
    },
  ]
  const isOpen = useSandboxStore((s) => s.ui.isHelpOpen)
  const setUI = useSandboxStore((s) => s.setUI)

  return (
    <RadixDialog.Root open={isOpen} onOpenChange={(open) => setUI({ isHelpOpen: open })}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <RadixDialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-paper p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <RadixDialog.Title className="font-heading text-xl text-text-primary">
            {t('sandbox.helpTitle')}
          </RadixDialog.Title>
          <RadixDialog.Description className="mt-1 text-sm text-text-secondary">
            {t('sandbox.helpDescription')}
          </RadixDialog.Description>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {shortcutGroups.map((group) => (
              <div key={group.titleKey}>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                  {t(group.titleKey)}
                </h4>
                <dl className="space-y-1.5">
                  {group.items.map((item) => (
                    <div key={item.keys} className="flex items-center justify-between gap-3">
                      <dt className="text-xs text-text-secondary">{t(item.descKey)}</dt>
                      <dd>
                        <kbd className="rounded border border-border bg-paper-secondary px-1.5 py-0.5 font-mono text-[10px] text-text-primary">
                          {item.keys}
                        </kbd>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-lg border border-border bg-paper-secondary p-3 text-xs text-text-secondary">
            <p className="mb-1 font-medium text-text-primary">{t('sandbox.helpTipsTitle')}</p>
            <ul className="list-inside list-disc space-y-0.5 text-text-tertiary">
              <li>{t('sandbox.helpTip1')}</li>
              <li>{t('sandbox.helpTip2')}</li>
              <li>{t('sandbox.helpTip3')}</li>
              <li>{t('sandbox.helpTip4')}</li>
            </ul>
          </div>

          <RadixDialog.Close asChild>
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full p-1 text-text-tertiary transition-colors hover:bg-paper-secondary hover:text-text-primary"
              aria-label={t('common.close')}
            >
              <X className="h-4 w-4" />
            </button>
          </RadixDialog.Close>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
