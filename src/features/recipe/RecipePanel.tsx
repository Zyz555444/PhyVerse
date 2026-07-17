import { useState, useMemo } from 'react'
import {
  BookOpen,
  Search,
  CheckCircle2,
  Play,
  X,
  RotateCcw,
  GraduationCap,
  Tag,
  Filter,
  Star,
  StarOff,
} from 'lucide-react'
import { useI18n } from '@/shared/hooks/useI18n'
import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/utils/cn'
import { RECIPE_LIBRARY, getRecipeById } from './recipeLibrary'
import {
  RECIPE_CATEGORIES,
  RECIPE_DIFFICULTIES,
  type Recipe,
  type RecipeCategory,
} from './recipeTypes'

interface RecipePanelProps {
  onStartRecipe: (recipe: Recipe) => void
  onExitRecipe: () => void
  activeRecipeId: string | null
  currentStepIndex: number
  completedRecipeIds: string[]
  onAdvanceStep: () => void
  onPrevStep: () => void
  onResetStep: () => void
}

export function RecipePanel({
  onStartRecipe,
  onExitRecipe,
  activeRecipeId,
  currentStepIndex,
  completedRecipeIds,
  onAdvanceStep,
  onPrevStep,
  onResetStep,
}: RecipePanelProps) {
  const { t } = useI18n()
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<RecipeCategory | 'all'>('all')

  const activeRecipe = useMemo(
    () => (activeRecipeId ? getRecipeById(activeRecipeId) : null),
    [activeRecipeId]
  )

  const filteredRecipes = useMemo(() => {
    return RECIPE_LIBRARY.filter((r) => {
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          t(r.title).toLowerCase().includes(q) ||
          t(r.description).toLowerCase().includes(q) ||
          r.tags.some((tag) => tag.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [categoryFilter, searchQuery, t])

  // ===== Recipe Runner Mode =====
  if (activeRecipe) {
    const step = activeRecipe.steps[currentStepIndex]
    const isLastStep = currentStepIndex >= activeRecipe.steps.length - 1
    const progress = ((currentStepIndex + 1) / activeRecipe.steps.length) * 100
    const cat = RECIPE_CATEGORIES.find((c) => c.key === activeRecipe.category)
    const diff = RECIPE_DIFFICULTIES.find((d) => d.key === activeRecipe.difficulty)

    return (
      <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold text-text-primary">{t(activeRecipe.title)}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onExitRecipe} title={t('recipe.exit')}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Category & Difficulty badges */}
        <div className="flex items-center gap-2">
          {cat && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: cat.color + '18', color: cat.color }}
            >
              {t(cat.labelKey)}
            </span>
          )}
          {diff && (
            <span className="rounded-full border border-border bg-paper px-2 py-0.5 text-[10px] text-text-tertiary">
              {t(diff.labelKey)}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-text-tertiary">
            <span>
              {t('recipe.step')} {currentStepIndex + 1}/{activeRecipe.steps.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Step dots */}
          <div className="flex justify-center gap-1">
            {activeRecipe.steps.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  idx <= currentStepIndex ? 'w-4 bg-accent' : 'w-1.5 bg-border'
                )}
              />
            ))}
          </div>
        </div>

        {/* Current step */}
        {step && (
          <div className="space-y-3 rounded-lg border border-border bg-paper p-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-soft text-[10px] font-bold text-accent">
                {currentStepIndex + 1}
              </span>
              <span className="text-xs font-semibold text-text-primary">{t(step.title)}</span>
            </div>
            <p className="text-xs leading-relaxed text-text-secondary">{t(step.description)}</p>
            {step.hint && (
              <p className="rounded bg-background px-2.5 py-1.5 text-[11px] leading-relaxed italic text-text-tertiary">
                {t('recipe.hint')}: {t(step.hint)}
              </p>
            )}
            {step.setupDescription && (
              <p className="rounded border border-accent/20 bg-accent-soft/30 px-2.5 py-1.5 text-[11px] leading-relaxed text-accent">
                {t(step.setupDescription)}
              </p>
            )}
          </div>
        )}

        {/* Learning objectives */}
        {activeRecipe.learningObjectives && activeRecipe.learningObjectives.length > 0 && (
          <div className="space-y-1.5 rounded-lg border border-border bg-paper p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-text-tertiary">
              <GraduationCap className="h-3 w-3" />
              {t('recipe.learningObjectives')}
            </div>
            {activeRecipe.learningObjectives.map((obj, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px] text-text-secondary">
                <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                {t(obj)}
              </div>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-auto flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={onResetStep} className="gap-1">
            <RotateCcw className="h-3.5 w-3.5" />
            {t('recipe.resetStep')}
          </Button>
          <div className="flex gap-2">
            {currentStepIndex > 0 && (
              <Button variant="ghost" size="sm" onClick={onPrevStep}>
                {t('recipe.prev')}
              </Button>
            )}
            <Button size="sm" onClick={isLastStep ? onExitRecipe : onAdvanceStep}>
              {isLastStep ? t('recipe.finish') : t('recipe.nextStep')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ===== Recipe Browser Mode =====
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-accent" />
        <span className="text-sm font-semibold text-text-primary">{t('recipe.library')}</span>
        <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[9px] font-medium text-accent">
          {RECIPE_LIBRARY.length}
        </span>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-paper px-2.5 py-1.5">
        <Search className="h-3.5 w-3.5 text-text-tertiary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('recipe.searchPlaceholder')}
          className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-tertiary outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="rounded p-0.5 text-text-tertiary hover:text-text-primary"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setCategoryFilter('all')}
          className={cn(
            'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors',
            categoryFilter === 'all'
              ? 'bg-accent text-white'
              : 'border border-border bg-paper text-text-tertiary hover:text-text-primary'
          )}
        >
          <Filter className="mr-1 inline h-2.5 w-2.5" />
          {t('recipe.all')}
        </button>
        {RECIPE_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setCategoryFilter(cat.key)}
            className={cn(
              'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors',
              categoryFilter === cat.key
                ? 'text-white'
                : 'border border-border bg-paper text-text-tertiary hover:text-text-primary'
            )}
            style={categoryFilter === cat.key ? { backgroundColor: cat.color } : undefined}
          >
            {t(cat.labelKey)}
          </button>
        ))}
      </div>

      {/* Recipe list */}
      {filteredRecipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-text-tertiary">
          <Search className="h-8 w-8 opacity-30" />
          <p className="text-xs">{t('recipe.noResults')}</p>
          {categoryFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className="rounded-full bg-accent-soft px-3 py-1 text-[10px] font-medium text-accent hover:bg-accent-soft/80"
            >
              {t('recipe.clearFilter')}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRecipes.map((recipe) => {
            const cat = RECIPE_CATEGORIES.find((c) => c.key === recipe.category)
            const diff = RECIPE_DIFFICULTIES.find((d) => d.key === recipe.difficulty)
            const completed = completedRecipeIds.includes(recipe.id)

            return (
              <button
                key={recipe.id}
                type="button"
                onClick={() => onStartRecipe(recipe)}
                className={cn(
                  'w-full rounded-lg border border-border bg-paper p-3 text-left',
                  'transition-colors hover:border-accent/50 hover:bg-accent-soft/20'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Category color indicator */}
                  <div
                    className="mt-0.5 h-3 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: cat?.color }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-text-primary truncate">
                        {t(recipe.title)}
                      </span>
                      {completed && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" />}
                    </div>

                    <p className="mt-0.5 text-[10px] text-text-tertiary line-clamp-2">
                      {t(recipe.description)}
                    </p>

                    <div className="mt-1.5 flex items-center gap-2">
                      {cat && (
                        <span
                          className="rounded px-1.5 py-0.5 text-[9px] font-medium"
                          style={{ backgroundColor: cat.color + '14', color: cat.color }}
                        >
                          {t(cat.labelKey)}
                        </span>
                      )}
                      {diff && (
                        <span className="flex items-center gap-0.5 text-[9px] text-text-tertiary">
                          {diff.key === 'advanced' ? (
                            <Star className="h-2.5 w-2.5" />
                          ) : (
                            <StarOff className="h-2.5 w-2.5" />
                          )}
                          {t(diff.labelKey)}
                        </span>
                      )}
                      <span className="text-[9px] text-text-tertiary">
                        {recipe.steps.length} {t('recipe.stepsCount')}
                      </span>
                    </div>

                    {/* Tags */}
                    {recipe.tags.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {recipe.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="flex items-center gap-0.5 rounded bg-background px-1.5 py-0.5 text-[9px] text-text-tertiary"
                          >
                            <Tag className="h-2 w-2" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Play className="h-4 w-4 text-accent" />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
