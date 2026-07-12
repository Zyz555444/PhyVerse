import { Drawer } from '@/shared/ui/Drawer'
import { Badge } from '@/shared/ui/Badge'
import { useExperimentStore } from './experimentStore'
import { useI18n } from '@/shared/hooks/useI18n'
import type { ExperimentDefinition } from '@/shared/types/experiment'

interface EquipmentDrawerProps {
  experiment: ExperimentDefinition
}

const SHAPE_LABELS: Record<string, { zh: string; en: string }> = {
  box: { zh: '长方体', en: 'Box' },
  sphere: { zh: '球体', en: 'Sphere' },
  cylinder: { zh: '圆柱', en: 'Cylinder' },
  capsule: { zh: '胶囊', en: 'Capsule' },
  cone: { zh: '圆锥', en: 'Cone' },
  plane: { zh: '平面', en: 'Plane' },
}

export function EquipmentDrawer({ experiment }: EquipmentDrawerProps) {
  const { language } = useI18n()
  const open = useExperimentStore((s) => s.tools.equipmentDrawer)
  const toggleTool = useExperimentStore((s) => s.toggleTool)
  const params = useExperimentStore((s) => s.params)

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (next !== open) toggleTool('equipmentDrawer')
      }}
      direction="right"
      title={experiment.name[language]}
      description={experiment.description[language]}
    >
      <section className="mt-2">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          实验信息
        </h4>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">{experiment.id}</Badge>
          <Badge variant="accent">
            {language === 'zh' ? '难度' : 'Difficulty'} {experiment.difficulty}
          </Badge>
          <Badge variant="default">
            {experiment.params.length} {language === 'zh' ? '参数' : 'Params'}
          </Badge>
          <Badge variant="default">
            {experiment.formulas.length} {language === 'zh' ? '公式' : 'Formulas'}
          </Badge>
        </div>
      </section>

      <section className="mt-5">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          {language === 'zh' ? '可调参数' : 'Adjustable Parameters'}
        </h4>
        <ul className="space-y-2">
          {experiment.params.map((p) => {
            const current = params[p.key] ?? p.default
            return (
              <li
                key={p.key}
                className="rounded-md border border-border bg-paper-secondary px-3 py-2"
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-text-primary">{p.name[language]}</span>
                  <span className="font-mono text-sm text-accent">
                    {current} {p.unit}
                  </span>
                </div>
                <div className="mt-1 text-xs text-text-tertiary">
                  {language === 'zh' ? '范围' : 'Range'}: {p.min} ~ {p.max} {p.unit}
                  <span className="mx-1">·</span>
                  {language === 'zh' ? '步长' : 'Step'}: {p.step} {p.unit}
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      {experiment.formulas.length > 0 && (
        <section className="mt-5">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            {language === 'zh' ? '相关公式' : 'Related Formulas'}
          </h4>
          <ul className="space-y-1.5">
            {experiment.formulas.map((formula, idx) => (
              <li
                key={idx}
                className="rounded bg-paper-tertiary px-2 py-1 font-mono text-xs text-text-primary"
              >
                {formula}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-5">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          {language === 'zh' ? '器材构成' : 'Equipment Composition'}
        </h4>
        <p className="text-xs leading-relaxed text-text-secondary">
          {language === 'zh'
            ? '本实验的 3D 器材根据参数动态生成。调整左侧参数面板中的滑块，器材会实时更新。常见器材包括：'
            : 'The 3D equipment for this experiment is dynamically generated based on parameters. Adjust the sliders in the parameter panel to update the equipment. Common equipment includes:'}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {Object.entries(SHAPE_LABELS).map(([shape, label]) => (
            <Badge key={shape} variant="outline">
              {label[language]}
            </Badge>
          ))}
        </div>
      </section>
    </Drawer>
  )
}
