import { useEffect, useMemo, type ReactNode } from 'react'
import { useParams, Link } from 'react-router-dom'
import * as Tabs from '@radix-ui/react-tabs'
import {
  ArrowLeft,
  Pause,
  Play,
  RotateCcw,
  Sliders,
  LineChart,
  BookOpen,
  Sigma,
  Wrench,
  Timer,
  Zap,
  Ruler,
  CircleDot,
  type LucideIcon,
} from 'lucide-react'
import { Scene } from '@/features/canvas/Scene'
import { PhysicsProvider } from '@/features/physics/PhysicsProvider'
import { ExperimentSetup } from '@/features/experiments/ExperimentSetup'
import { getExperiment } from '@/features/experiments/registry'
import { DataCollector } from '@/features/panels/DataCollector'
import { ParameterPanel } from '@/features/panels/ParameterPanel'
import { DataPanel } from '@/features/panels/DataPanel'
import { ExperimentGuide } from '@/features/panels/ExperimentGuide'
import { FormulaOverlay } from '@/features/panels/FormulaOverlay'
import { EquipmentDrawer } from '@/features/panels/EquipmentDrawer'
import { useExperimentStore, type ToolVisibility } from '@/features/panels/experimentStore'
import { VirtualStopwatch } from '@/features/measurement/VirtualStopwatch'
import { DotTimer } from '@/features/measurement/DotTimer'
import { VirtualRuler } from '@/features/measurement/VirtualRuler'
import { VirtualProtractor } from '@/features/measurement/VirtualProtractor'
import { PlaybackControls } from '@/features/recording/PlaybackControls'
import { Button } from '@/shared/ui/Button'
import { Badge } from '@/shared/ui/Badge'
import { useI18n } from '@/shared/hooks/useI18n'
import { cn } from '@/shared/utils/cn'

export function Experiment() {
  const { experimentId } = useParams<{ experimentId: string }>()
  const { t, language } = useI18n()
  const experiment = experimentId ? getExperiment(experimentId) : undefined

  const params = useExperimentStore((s) => s.params)
  const resetCounter = useExperimentStore((s) => s.resetCounter)
  const isPaused = useExperimentStore((s) => s.isPaused)
  const setParams = useExperimentStore((s) => s.setParams)
  const togglePause = useExperimentStore((s) => s.togglePause)
  const reset = useExperimentStore((s) => s.reset)

  const defaultParams = useMemo(() => {
    if (!experiment) return {} as Record<string, number>
    const result: Record<string, number> = {}
    for (const p of experiment.params) {
      result[p.key] = p.default
    }
    return result
  }, [experiment])

  useEffect(() => {
    if (experiment) {
      setParams(defaultParams)
    }
  }, [experiment, defaultParams, setParams])

  if (!experiment) {
    return (
      <div className="py-16">
        <div className="mx-auto max-w-md text-center">
          <h1 className="font-heading text-2xl text-text-primary">实验未找到</h1>
          <p className="mt-2 text-sm text-text-secondary">
            无法找到 ID 为 &quot;{experimentId}&quot; 的实验。请检查链接或返回首页选择实验。
          </p>
          <Link to="/" className="mt-6 inline-block">
            <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              {t('nav.home')}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const setupKey = `${experiment.id}-${JSON.stringify(params)}-${resetCounter}`
  const difficultyLabel =
    experiment.difficulty <= 1
      ? t('experiment.difficulty.easy')
      : experiment.difficulty <= 2
        ? t('experiment.difficulty.medium')
        : t('experiment.difficulty.hard')

  return (
    <div className="py-6">
      <header className="mb-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs text-text-tertiary transition-colors hover:text-text-secondary"
        >
          <ArrowLeft className="h-3 w-3" />
          {t('nav.home')}
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="font-heading text-2xl font-medium text-text-primary">
            {experiment.name[language]}
          </h1>
          <Badge variant="accent">{experiment.id}</Badge>
          <span className="text-xs text-text-tertiary">
            {t(`experiment.${experiment.category}`)} · {difficultyLabel}
          </span>
        </div>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-text-secondary">
          {experiment.description[language]}
        </p>
      </header>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button
          variant={isPaused ? 'primary' : 'secondary'}
          size="sm"
          onClick={togglePause}
          leftIcon={isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
        >
          {isPaused ? t('experiment.run') : t('experiment.pause')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={reset}
          leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
        >
          {t('experiment.reset')}
        </Button>

        <span className="mx-1 h-5 w-px bg-border" aria-hidden />

        <ToolToggle tool="formulaOverlay" icon={Sigma} label="公式" />
        <ToolToggle tool="equipmentDrawer" icon={Wrench} label="器材" />
        <ToolToggle tool="stopwatch" icon={Timer} label="秒表" />
        <ToolToggle tool="dotTimer" icon={Zap} label="打点" />
        <ToolToggle tool="ruler" icon={Ruler} label="刻度尺" />
        <ToolToggle tool="protractor" icon={CircleDot} label="量角器" />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative h-[600px] overflow-hidden rounded-xl border border-border bg-paper-tertiary">
            <Scene cameraPosition={[6, 5, 6]} cameraView="free" showGrid>
              <PhysicsProvider key={experiment.id} autoStep={!isPaused}>
                <ExperimentSetup key={setupKey} experiment={experiment} params={params} />
                <DataCollector experiment={experiment} />
                <VirtualRuler />
                <VirtualProtractor />
              </PhysicsProvider>
            </Scene>

            <FormulaOverlay formulas={experiment.formulas} />
            <VirtualStopwatch />
            <DotTimer />
            <PlaybackControls />
          </div>
        </div>

        <Tabs.Root defaultValue="params" className="w-[340px] flex-shrink-0">
          <Tabs.List className="mb-3 flex gap-1 rounded-lg border border-border bg-paper-secondary p-1">
            <TabTrigger value="params" icon={<Sliders className="h-3.5 w-3.5" />}>
              {t('experiment.params')}
            </TabTrigger>
            <TabTrigger value="data" icon={<LineChart className="h-3.5 w-3.5" />}>
              {t('experiment.data')}
            </TabTrigger>
            <TabTrigger value="guide" icon={<BookOpen className="h-3.5 w-3.5" />}>
              {t('experiment.guide')}
            </TabTrigger>
          </Tabs.List>

          <Tabs.Content
            value="params"
            className="h-[540px] overflow-y-auto rounded-lg border border-border bg-paper-secondary p-4 outline-none"
          >
            <ParameterPanel params={experiment.params} language={language} />
          </Tabs.Content>

          <Tabs.Content
            value="data"
            className="h-[540px] overflow-y-auto rounded-lg border border-border bg-paper-secondary p-4 outline-none"
          >
            <DataPanel collectors={experiment.dataCollectors} />
          </Tabs.Content>

          <Tabs.Content
            value="guide"
            className="h-[540px] overflow-y-auto rounded-lg border border-border bg-paper-secondary p-4 outline-none"
          >
            <ExperimentGuide steps={experiment.guideSteps} />
          </Tabs.Content>
        </Tabs.Root>
      </div>

      <EquipmentDrawer experiment={experiment} />
    </div>
  )
}

interface ToolToggleProps {
  tool: keyof ToolVisibility
  icon: LucideIcon
  label: string
}

function ToolToggle({ tool, icon: Icon, label }: ToolToggleProps) {
  const active = useExperimentStore((s) => s.tools[tool])
  const toggleTool = useExperimentStore((s) => s.toggleTool)

  return (
    <button
      type="button"
      onClick={() => toggleTool(tool)}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-accent-soft focus:ring-offset-1 focus:ring-offset-paper',
        active
          ? 'bg-accent-soft text-accent'
          : 'border border-border bg-paper-secondary text-text-secondary hover:border-border-strong hover:text-text-primary'
      )}
      aria-pressed={active}
      title={label}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

interface TabTriggerProps {
  value: string
  icon: ReactNode
  children: ReactNode
}

function TabTrigger({ value, icon, children }: TabTriggerProps) {
  return (
    <Tabs.Trigger
      value={value}
      className={cn(
        'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5',
        'text-xs font-medium text-text-secondary transition-colors',
        'hover:text-text-primary',
        'data-[state=active]:bg-paper data-[state=active]:text-text-primary data-[state=active]:shadow-sm',
        'focus:outline-none'
      )}
    >
      {icon}
      {children}
    </Tabs.Trigger>
  )
}
