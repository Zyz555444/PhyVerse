import type { SandboxScene } from '@/features/sandbox/sandboxStore'

export type RecipeCategory =
  'mechanics' | 'electromagnetism' | 'thermodynamics' | 'optics' | 'waves'

export type RecipeDifficulty = 'beginner' | 'intermediate' | 'advanced'

export const RECIPE_CATEGORIES: { key: RecipeCategory; labelKey: string; color: string }[] = [
  { key: 'mechanics', labelKey: 'recipe.category.mechanics', color: '#2563eb' },
  { key: 'electromagnetism', labelKey: 'recipe.category.electromagnetism', color: '#ea580c' },
  { key: 'thermodynamics', labelKey: 'recipe.category.thermodynamics', color: '#dc2626' },
  { key: 'optics', labelKey: 'recipe.category.optics', color: '#7c3aed' },
  { key: 'waves', labelKey: 'recipe.category.waves', color: '#059669' },
]

export const RECIPE_DIFFICULTIES: { key: RecipeDifficulty; labelKey: string }[] = [
  { key: 'beginner', labelKey: 'recipe.difficulty.beginner' },
  { key: 'intermediate', labelKey: 'recipe.difficulty.intermediate' },
  { key: 'advanced', labelKey: 'recipe.difficulty.advanced' },
]

export interface RecipeStep {
  title: string
  description: string
  hint?: string
  /** Items the user should add/observe in this step */
  setupDescription?: string
}

export interface Recipe {
  id: string
  title: string
  description: string
  category: RecipeCategory
  difficulty: RecipeDifficulty
  tags: string[]
  /** Initial scene configuration */
  scene: SandboxScene
  /** Step-by-step instructions */
  steps: RecipeStep[]
  /** Optional: learning objectives */
  learningObjectives?: string[]
  /** Whether this is a user-created recipe */
  isUserCreated?: boolean
}
