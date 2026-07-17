import { useEffect } from 'react'
import { useSandboxStore } from './sandboxStore'
import { getTaskById, evaluateObjective } from './taskRegistry'

/**
 * Monitors the active teaching task and auto-advances steps when objectives are
 * met. Should be mounted once inside the Sandbox page.
 */
export function useTaskMonitor() {
  const task = useSandboxStore((s) => s.task)
  const telemetry = useSandboxStore((s) => s.telemetry)
  const advanceTaskStep = useSandboxStore((s) => s.advanceTaskStep)
  const completeTask = useSandboxStore((s) => s.completeTask)

  useEffect(() => {
    if (!task.activeTaskId) return

    const activeTask = getTaskById(task.activeTaskId)
    if (!activeTask) return

    const step = activeTask.steps[task.currentStepIndex]
    if (!step?.objective) return

    const getSample = (itemId?: string) => {
      // Prefer the tracked item sample if it matches the requested id, otherwise
      // fall back to the live reading.
      if (itemId && telemetry.trackedId === itemId) {
        return telemetry.live
      }
      return telemetry.live
    }

    const result = evaluateObjective(step.objective, getSample, task.records.length)
    if (result.passed) {
      if (task.currentStepIndex >= activeTask.steps.length - 1) {
        completeTask(activeTask.id)
      } else {
        advanceTaskStep()
      }
    }
  }, [
    task.activeTaskId,
    task.currentStepIndex,
    task.records.length,
    telemetry.live,
    telemetry.trackedId,
    advanceTaskStep,
    completeTask,
  ])
}
