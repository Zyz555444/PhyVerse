import type { ExperimentCategory, ExperimentDefinition } from '@/shared/types/experiment'

const registry = new Map<string, ExperimentDefinition>()

export function registerExperiment(def: ExperimentDefinition): void {
  if (registry.has(def.id)) {
    console.warn(`[registry] Experiment "${def.id}" is already registered — overwriting`)
  }
  registry.set(def.id, def)
}

export function getExperiment(id: string): ExperimentDefinition | undefined {
  return registry.get(id)
}

export function getAllExperiments(): ExperimentDefinition[] {
  return Array.from(registry.values())
}

export function getExperimentsByCategory(category: ExperimentCategory): ExperimentDefinition[] {
  return getAllExperiments().filter((e) => e.category === category)
}

export function getExperimentCount(): number {
  return registry.size
}

export function clearRegistry(): void {
  registry.clear()
}
