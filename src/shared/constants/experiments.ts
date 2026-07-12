import { Beaker, Magnet, Eye, Thermometer, Atom, type LucideIcon } from 'lucide-react'
import type { ExperimentCategory } from '@/shared/types/experiment'

export interface CategoryMeta {
  id: ExperimentCategory
  icon: LucideIcon
  accent: string
}

export const EXPERIMENT_CATEGORIES: readonly CategoryMeta[] = [
  { id: 'mechanics', icon: Beaker, accent: 'text-blue-500' },
  { id: 'electromagnetism', icon: Magnet, accent: 'text-amber-500' },
  { id: 'optics', icon: Eye, accent: 'text-purple-500' },
  { id: 'thermal', icon: Thermometer, accent: 'text-red-500' },
  { id: 'modern', icon: Atom, accent: 'text-emerald-500' },
] as const

export function getCategoryMeta(id: ExperimentCategory): CategoryMeta | undefined {
  return EXPERIMENT_CATEGORIES.find((c) => c.id === id)
}
