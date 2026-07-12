import { X, Sigma } from 'lucide-react'
import { useExperimentStore } from './experimentStore'
import { cn } from '@/shared/utils/cn'

interface FormulaOverlayProps {
  formulas: string[]
}

export function FormulaOverlay({ formulas }: FormulaOverlayProps) {
  const visible = useExperimentStore((s) => s.tools.formulaOverlay)
  const toggleTool = useExperimentStore((s) => s.toggleTool)

  if (!visible || formulas.length === 0) return null

  return (
    <div
      className={cn(
        'pointer-events-auto absolute right-3 top-3 z-10 w-64',
        'rounded-lg border border-border bg-paper/95 p-3 shadow-md backdrop-blur-sm'
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sigma className="h-3.5 w-3.5 text-accent" />
          <span className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            公式
          </span>
        </div>
        <button
          type="button"
          onClick={() => toggleTool('formulaOverlay')}
          className="rounded p-0.5 text-text-tertiary transition-colors hover:bg-paper-secondary hover:text-text-primary"
          aria-label="关闭公式"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      <ul className="space-y-1.5">
        {formulas.map((formula, idx) => (
          <li
            key={idx}
            className="rounded bg-paper-tertiary px-2 py-1 font-mono text-xs text-text-primary"
          >
            {formula}
          </li>
        ))}
      </ul>
    </div>
  )
}
