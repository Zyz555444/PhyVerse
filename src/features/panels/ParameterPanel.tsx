import { Slider } from '@/shared/ui/Slider'
import { useExperimentStore } from './experimentStore'
import type { ParamDef } from '@/shared/types/experiment'

interface ParameterPanelProps {
  params: ParamDef[]
  language: 'zh' | 'en'
}

export function ParameterPanel({ params, language }: ParameterPanelProps) {
  const storeParams = useExperimentStore((s) => s.params)
  const setParam = useExperimentStore((s) => s.setParam)

  if (params.length === 0) {
    return <p className="px-1 text-sm text-text-tertiary">该实验没有可调参数。</p>
  }

  return (
    <div className="space-y-5">
      {params.map((def) => {
        const value = storeParams[def.key] ?? def.default
        const labelText = def.name[language]
        return (
          <div key={def.key}>
            <div className="mb-1 flex items-baseline justify-between">
              <label className="text-sm font-medium text-text-primary">{labelText}</label>
              <span className="text-xs text-text-tertiary">{def.unit}</span>
            </div>
            <Slider
              value={[value]}
              min={def.min}
              max={def.max}
              step={def.step}
              onValueChange={(vals) => setParam(def.key, vals[0])}
              showValue
              valueFormatter={(v) => formatParamValue(v, def.step)}
            />
            <div className="mt-1 flex justify-between text-[10px] text-text-tertiary">
              <span>{formatParamValue(def.min, def.step)}</span>
              <span>{formatParamValue(def.max, def.step)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function formatParamValue(value: number, step: number): string {
  const decimals = step < 1 ? Math.min(3, Math.ceil(-Math.log10(step))) : 0
  return value.toFixed(decimals)
}
