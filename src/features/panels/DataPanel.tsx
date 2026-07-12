import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { useExperimentStore } from './experimentStore'
import { useI18n } from '@/shared/hooks/useI18n'
import type { DataCollector as DataCollectorDef } from '@/shared/types/experiment'

interface DataPanelProps {
  collectors: DataCollectorDef[]
}

const CHART_COLORS = ['#33a6b8', '#dc2626', '#2e8b57', '#9333ea', '#ea580c', '#2563eb']

export function DataPanel({ collectors }: DataPanelProps) {
  const collectorsState = useExperimentStore((s) => s.collectors)
  const { language } = useI18n()

  if (collectors.length === 0) {
    return <p className="px-1 text-sm text-text-tertiary">该实验没有数据采集器。</p>
  }

  return (
    <div className="space-y-4">
      {collectors.map((def, idx) => {
        const state = collectorsState[def.key]
        const current = state?.current ?? 0
        const history = state?.history ?? []
        const color = CHART_COLORS[idx % CHART_COLORS.length]
        const name = def.name[language]

        return (
          <div key={def.key} className="rounded-lg border border-border bg-paper-tertiary p-3">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-sm font-medium text-text-primary">{name}</span>
              <span className="font-mono text-sm font-semibold" style={{ color }}>
                {current.toFixed(3)}
              </span>
            </div>
            <div className="h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" opacity={0.4} />
                  <XAxis
                    dataKey="t"
                    tick={{ fontSize: 10, fill: '#999' }}
                    tickFormatter={(v) => v.toFixed(1)}
                    domain={['dataMin', 'dataMax']}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#999' }}
                    width={36}
                    tickFormatter={(v) => (Math.abs(v) < 0.01 ? '0' : v.toFixed(2))}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e5e0',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                    labelFormatter={(label) => `t = ${Number(label).toFixed(2)}s`}
                    formatter={(value) => [Number(value).toFixed(3), name]}
                  />
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      })}
    </div>
  )
}
