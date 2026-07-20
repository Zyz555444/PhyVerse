import { useRef, useEffect, useCallback } from 'react'
import { useSandboxStore, type TelemetrySample } from './sandboxStore'
import { getTaskById, evaluateObjective } from './taskRegistry'

/**
 * Calculates the oscillation period from telemetry samples using zero-crossing
 * detection on the Y-axis velocity.
 */
export function calculatePeriod(samples: TelemetrySample[]): number {
  if (samples.length < 10) return 0

  // Find the center Y position (average) for zero-crossing detection
  let sumY = 0
  for (const s of samples) {
    sumY += s.pos[1]
  }
  const centerY = sumY / samples.length

  // Detect upward zero-crossings (crossing centerY while moving upward)
  const zeroCrossings: number[] = []
  for (let i = 1; i < samples.length; i++) {
    const prev = samples[i - 1]
    const curr = samples[i]
    // Skip if not moving upward
    if (curr.vel[1] <= 0) continue
    // Check for upward crossing through centerY
    if (prev.pos[1] < centerY && curr.pos[1] >= centerY) {
      zeroCrossings.push(curr.t)
    }
  }

  if (zeroCrossings.length < 2) return 0
  // Return the time between the last two zero-crossings
  return zeroCrossings[zeroCrossings.length - 1] - zeroCrossings[zeroCrossings.length - 2]
}

/** Debounce helper: returns true only if condition holds for count consecutive checks. */
function useConsecutiveCheck(windowSize: number = 3) {
  const counterRef = useRef(0)
  const lastResultRef = useRef(false)

  const check = useCallback(
    (passed: boolean): boolean => {
      if (passed) {
        counterRef.current++
        if (counterRef.current >= windowSize && !lastResultRef.current) {
          lastResultRef.current = true
          return true
        }
      } else {
        counterRef.current = 0
        lastResultRef.current = false
      }
      return false
    },
    [windowSize]
  )

  const reset = useCallback(() => {
    counterRef.current = 0
    lastResultRef.current = false
  }, [])

  return { check, reset }
}

/**
 * Monitors the active teaching task and auto-advances steps when objectives are
 * met. Uses consecutive-check debouncing to avoid false triggers. Should be
 * mounted once inside the Sandbox page.
 */
export function useTaskMonitor() {
  const task = useSandboxStore((s) => s.task)
  const telemetry = useSandboxStore((s) => s.telemetry)
  const clearTelemetry = useSandboxStore((s) => s.clearTelemetry)
  const advanceTaskStep = useSandboxStore((s) => s.advanceTaskStep)
  const completeTask = useSandboxStore((s) => s.completeTask)

  const { check, reset } = useConsecutiveCheck(3)
  const prevStepRef = useRef(task.currentStepIndex)
  const prevTaskRef = useRef(task.activeTaskId)

  // Reset debounce when step or task changes
  useEffect(() => {
    if (
      task.currentStepIndex !== prevStepRef.current ||
      task.activeTaskId !== prevTaskRef.current
    ) {
      reset()
      prevStepRef.current = task.currentStepIndex
      prevTaskRef.current = task.activeTaskId
    }
  }, [task.currentStepIndex, task.activeTaskId, reset])

  useEffect(() => {
    if (!task.activeTaskId) return

    const activeTask = getTaskById(task.activeTaskId)
    if (!activeTask) return

    const step = activeTask.steps[task.currentStepIndex]
    if (!step?.objective) return

    const obj = step.objective

    // Check if this objective uses period metric
    const needsPeriod =
      (obj.type === 'measure' && obj.measure?.source.metric === 'period') ||
      (obj.type === 'compare' &&
        (obj.compare?.left.metric === 'period' || obj.compare?.right.metric === 'period'))

    if (needsPeriod) {
      // Period requires sample history - evaluate directly
      if (!telemetry.trackedId) return
      const samples = telemetry.samples
      const period = calculatePeriod(samples)

      if (obj.type === 'measure' && obj.measure && period > 0) {
        const target = obj.measure.target
        const tolerance = obj.measure.tolerance
        const diff = Math.abs(period - target)
        if (diff <= tolerance && check(true)) {
          advanceStepOrComplete()
        } else if (diff > tolerance) {
          check(false)
        }
        return
      }
      return
    }

    // Standard evaluation via evaluateObjective
    const getSample = (itemId?: string) => {
      // Return live reading only if it matches the requested item
      if (itemId && telemetry.trackedId !== itemId) {
        return null
      }
      return telemetry.live
    }

    const result = evaluateObjective(obj, getSample, task.records.length)
    if (result.passed && check(true)) {
      advanceStepOrComplete()
    } else if (!result.passed) {
      check(false)
    }
  }, [
    task.activeTaskId,
    task.currentStepIndex,
    task.records.length,
    telemetry.live,
    telemetry.trackedId,
    telemetry.samples,
    advanceTaskStep,
    completeTask,
    clearTelemetry,
    check,
  ])

  function advanceStepOrComplete() {
    if (!task.activeTaskId) return
    const activeTask = getTaskById(task.activeTaskId)
    if (!activeTask) return

    if (task.currentStepIndex >= activeTask.steps.length - 1) {
      completeTask(activeTask.id)
    } else {
      advanceTaskStep()
      clearTelemetry()
    }
  }
}
