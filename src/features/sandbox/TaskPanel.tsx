import { useMemo } from 'react'
import { CheckCircle2, Circle, BookOpen, X, Camera, RotateCcw } from 'lucide-react'
import { useI18n } from '@/shared/hooks/useI18n'
import { Button } from '@/shared/ui/Button'
import { StepProgress } from '@/shared/ui/StepProgress'
import { StepNavigator } from '@/shared/ui/StepNavigator'
import { StepCard } from '@/shared/ui/StepCard'
import { cn } from '@/shared/utils/cn'
import { useSandboxStore } from './sandboxStore'
import { TASK_REGISTRY, getTaskById, type SandboxTask } from './taskRegistry'

interface TaskPanelProps {
  onStartTask: (task: SandboxTask) => void
  onExitTask: () => void
  onAdvanceStep: () => void
  onResetStep: () => void
  onAddRecord: () => void
  onExportRecords: () => void
}

export function TaskPanel({
  onStartTask,
  onExitTask,
  onAdvanceStep,
  onResetStep,
  onAddRecord,
  onExportRecords,
}: TaskPanelProps) {
  const { t } = useI18n()
  const taskState = useSandboxStore((s) => s.task)

  const activeTask = useMemo(
    () => (taskState.activeTaskId ? getTaskById(taskState.activeTaskId) : null),
    [taskState.activeTaskId]
  )

  if (!activeTask) {
    return (
      <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
          <BookOpen className="h-4 w-4" />
          {t('sandbox.taskLibrary')}
        </div>
        <p className="text-xs text-text-tertiary">{t('sandbox.taskLibraryHint')}</p>
        <div className="space-y-2">
          {TASK_REGISTRY.map((task) => {
            const completed = taskState.completedTaskIds.includes(task.id)
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => onStartTask(task)}
                className={cn(
                  'w-full rounded-lg border border-border bg-paper p-3 text-left',
                  'transition-colors hover:border-accent hover:text-accent'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold">{t(task.title)}</div>
                    <div className="mt-0.5 text-[10px] text-text-tertiary">
                      {t(task.description)}
                    </div>
                  </div>
                  {completed ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-text-tertiary" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const step = activeTask.steps[taskState.currentStepIndex]
  const isLastStep = taskState.currentStepIndex >= activeTask.steps.length - 1

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-text-secondary">{t(activeTask.title)}</div>
        <Button variant="ghost" size="sm" onClick={onExitTask} title={t('sandbox.exitTask')}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <StepProgress current={taskState.currentStepIndex} total={activeTask.steps.length} />

      {step && (
        <StepCard
          stepNumber={taskState.currentStepIndex + 1}
          totalSteps={activeTask.steps.length}
          title={t(step.title)}
          description={t(step.description)}
          hint={step.hint ? t(step.hint) : undefined}
          hintLabel={t('sandbox.taskHint')}
          badgeVariant="text"
        />
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={onAddRecord} className="gap-1">
          <Camera className="h-3.5 w-3.5" />
          {t('sandbox.recordData')}
        </Button>
        <Button variant="ghost" size="sm" onClick={onResetStep} className="gap-1">
          <RotateCcw className="h-3.5 w-3.5" />
          {t('sandbox.resetStep')}
        </Button>
      </div>

      {taskState.records.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-text-secondary">
              {t('sandbox.taskRecords')} ({taskState.records.length})
            </div>
            <Button variant="ghost" size="sm" onClick={onExportRecords}>
              {t('sandbox.exportRecords')}
            </Button>
          </div>
          <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border bg-paper p-2">
            {taskState.records.map((record, index) => (
              <div
                key={index}
                className="flex justify-between rounded bg-background px-2 py-1 text-[10px] text-text-secondary"
              >
                <span>t={record.simTime.toFixed(2)}s</span>
                <span>
                  v={record.sample.speed.toFixed(2)} E=
                  {(record.sample.ke + record.sample.pe).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <StepNavigator
        isLastStep={isLastStep}
        currentStepIndex={taskState.currentStepIndex}
        onReset={onResetStep}
        onNext={onAdvanceStep}
        onFinish={onExitTask}
        resetLabel={t('sandbox.reset')}
        nextLabel={t('sandbox.nextStep')}
        finishLabel={t('sandbox.finishTask')}
        showReset={taskState.currentStepIndex > 0}
      />
    </div>
  )
}
