import { create } from 'zustand'

export interface DataPoint {
  t: number
  v: number
}

export interface CollectorState {
  current: number
  history: DataPoint[]
}

export interface ToolVisibility {
  formulaOverlay: boolean
  equipmentDrawer: boolean
  stopwatch: boolean
  dotTimer: boolean
  ruler: boolean
  protractor: boolean
}

interface ExperimentState {
  params: Record<string, number>
  collectors: Record<string, CollectorState>
  isPaused: boolean
  currentStep: number
  resetCounter: number
  elapsedTime: number

  tools: ToolVisibility
  toggleTool: (tool: keyof ToolVisibility) => void

  isRecording: boolean
  recordingDuration: number
  startRecording: () => void
  stopRecording: () => void
  tickRecording: (delta: number) => void

  setParam: (key: string, value: number) => void
  setParams: (params: Record<string, number>) => void
  pushData: (key: string, value: number, t: number) => void
  pushBatch: (entries: Array<{ key: string; value: number; t: number }>) => void
  clearData: () => void
  togglePause: () => void
  setPaused: (paused: boolean) => void
  nextStep: () => void
  prevStep: () => void
  setStep: (step: number) => void
  reset: () => void
  tickTime: (delta: number) => void
}

const HISTORY_MAX = 100

export const useExperimentStore = create<ExperimentState>((set) => ({
  params: {},
  collectors: {},
  isPaused: false,
  currentStep: 0,
  resetCounter: 0,
  elapsedTime: 0,

  tools: {
    formulaOverlay: true,
    equipmentDrawer: false,
    stopwatch: false,
    dotTimer: false,
    ruler: false,
    protractor: false,
  },
  toggleTool: (tool) =>
    set((state) => ({
      tools: { ...state.tools, [tool]: !state.tools[tool] },
    })),

  isRecording: false,
  recordingDuration: 0,
  startRecording: () => set({ isRecording: true, recordingDuration: 0 }),
  stopRecording: () => set({ isRecording: false }),
  tickRecording: (delta) =>
    set((state) =>
      state.isRecording ? { recordingDuration: state.recordingDuration + delta } : state
    ),

  setParam: (key, value) =>
    set((state) => ({
      params: { ...state.params, [key]: value },
      collectors: {},
      elapsedTime: 0,
    })),

  setParams: (params) =>
    set({
      params,
      collectors: {},
      elapsedTime: 0,
    }),

  pushData: (key, value, t) =>
    set((state) => {
      const prev = state.collectors[key]
      const history = prev ? [...prev.history, { t, v: value }] : [{ t, v: value }]
      if (history.length > HISTORY_MAX) {
        history.splice(0, history.length - HISTORY_MAX)
      }
      return {
        collectors: {
          ...state.collectors,
          [key]: { current: value, history },
        },
      }
    }),

  pushBatch: (entries) =>
    set((state) => {
      const nextCollectors = { ...state.collectors }
      for (const { key, value, t } of entries) {
        const prev = nextCollectors[key]
        const history = prev ? [...prev.history, { t, v: value }] : [{ t, v: value }]
        if (history.length > HISTORY_MAX) {
          history.splice(0, history.length - HISTORY_MAX)
        }
        nextCollectors[key] = { current: value, history }
      }
      return { collectors: nextCollectors }
    }),

  clearData: () => set({ collectors: {}, elapsedTime: 0 }),

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

  setPaused: (paused) => set({ isPaused: paused }),

  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),

  prevStep: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),

  setStep: (step) => set({ currentStep: Math.max(0, step) }),

  reset: () =>
    set((state) => ({
      collectors: {},
      isPaused: false,
      currentStep: 0,
      elapsedTime: 0,
      resetCounter: state.resetCounter + 1,
      isRecording: false,
      recordingDuration: 0,
    })),

  tickTime: (delta) => set((state) => ({ elapsedTime: state.elapsedTime + delta })),
}))
