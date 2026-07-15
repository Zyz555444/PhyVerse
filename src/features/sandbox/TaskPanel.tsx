import { useMemo } from 'react'
import { CheckCircle2, Circle, BookOpen, X, Camera, RotateCcw, ChevronRight } from 'lucide-react'
import { useI18n } from '@/shared/hooks/useI18n'
import { Button } from '@/shared/ui/Button'
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
  const progress = ((taskState.currentStepIndex + 1) / activeTask.steps.length) * 100

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-text-secondary">{t(activeTask.title)}</div>
        <Button variant="ghost" size="sm" onClick={onExitTask} title={t('sandbox.exitTask')}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {step && (
        <div className="space-y-2 rounded-lg border border-border bg-paper p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
            <span className="text-accent">
              {t('sandbox.taskStep')} {taskState.currentStepIndex + 1}/{activeTask.steps.length}
            </span>
            <ChevronRight className="h-3 w-3" />
            {t(step.title)}
          </div>
          <p className="text-xs text-text-secondary">{t(step.description)}</p>
          {step.hint && (
            <p className="rounded bg-background px-2 py-1 text-[10px] italic text-text-tertiary">
              {t('sandbox.taskHint')}: {t(step.hint)}
            </p>
          )}
        </div>
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

      <div className="mt-auto flex justify-end gap-2">
        {taskState.currentStepIndex > 0 && (
          <Button variant="ghost" size="sm" onClick={onResetStep}>
            {t('sandbox.reset')}
          </Button>
        )}
        <Button size="sm" onClick={isLastStep ? onExitTask : onAdvanceStep}>
          {isLastStep ? t('sandbox.finishTask') : t('sandbox.nextStep')}
        </Button>
      </div>
    </div>
  )
}
