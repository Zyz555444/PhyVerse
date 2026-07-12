import { useMemo, useState, type ComponentType } from 'react'
import { Search, X } from 'lucide-react'
import { useI18n } from '@/shared/hooks/useI18n'
import { cn } from '@/shared/utils/cn'
import { EXPERIMENT_CATEGORIES } from '@/shared/constants/experiments'
import type { ExperimentCategory, ExperimentDefinition } from '@/shared/types/experiment'
import { ExperimentCard } from './ExperimentCard'

interface ExperimentSearchProps {
  experiments: ExperimentDefinition[]
  initialQuery?: string
}

type CategoryFilter = ExperimentCategory | 'all'
type DifficultyFilter = 'all' | 1 | 2 | 3

export function ExperimentSearch({ experiments, initialQuery = '' }: ExperimentSearchProps) {
  const { t, language } = useI18n()
  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return experiments.filter((exp) => {
      if (category !== 'all' && exp.category !== category) return false
      if (difficulty !== 'all' && exp.difficulty !== difficulty) return false
      if (q) {
        const haystack = [
          exp.id.toLowerCase(),
          exp.name.zh.toLowerCase(),
          exp.name.en.toLowerCase(),
          exp.description.zh.toLowerCase(),
          exp.description.en.toLowerCase(),
        ].join(' ')
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [experiments, query, category, difficulty])

  const hasActiveFilter = query.trim() !== '' || category !== 'all' || difficulty !== 'all'

  const clearFilters = () => {
    setQuery('')
    setCategory('all')
    setDifficulty('all')
  }

  return (
    <div>
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('common.search')}
            className={cn(
              'h-11 w-full rounded-lg border border-border bg-paper-secondary pl-10 pr-10',
              'text-sm text-text-primary placeholder:text-text-tertiary',
              'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft'
            )}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary transition-colors hover:text-text-primary"
              aria-label="清除搜索"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterChip
            active={category === 'all'}
            onClick={() => setCategory('all')}
            label={language === 'zh' ? '全部分类' : 'All'}
          />
          {EXPERIMENT_CATEGORIES.map((cat) => (
            <FilterChip
              key={cat.id}
              active={category === cat.id}
              onClick={() => setCategory(cat.id)}
              icon={cat.icon}
              label={t(`experiment.${cat.id}`)}
            />
          ))}

          <span className="mx-1 h-5 w-px bg-border" aria-hidden />

          <FilterChip
            active={difficulty === 'all'}
            onClick={() => setDifficulty('all')}
            label={language === 'zh' ? '全部难度' : 'All'}
          />
          <FilterChip
            active={difficulty === 1}
            onClick={() => setDifficulty(1)}
            label={t('experiment.difficulty.easy')}
          />
          <FilterChip
            active={difficulty === 2}
            onClick={() => setDifficulty(2)}
            label={t('experiment.difficulty.medium')}
          />
          <FilterChip
            active={difficulty === 3}
            onClick={() => setDifficulty(3)}
            label={t('experiment.difficulty.hard')}
          />

          {hasActiveFilter && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto inline-flex items-center gap-1 text-xs text-accent transition-colors hover:text-accent-hover"
            >
              <X className="h-3 w-3" />
              {language === 'zh' ? '清除筛选' : 'Clear'}
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-text-tertiary">{t('common.empty')}</p>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 text-xs text-accent hover:text-accent-hover"
            >
              {language === 'zh' ? '清除筛选条件' : 'Clear filters'}
            </button>
          )}
        </div>
      ) : (
        <>
          {hasActiveFilter && (
            <p className="mb-3 text-xs text-text-tertiary">
              {language === 'zh'
                ? `找到 ${filtered.length} 个匹配实验`
                : `${filtered.length} experiments found`}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((exp) => (
              <ExperimentCard key={exp.id} experiment={exp} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

interface FilterChipProps {
  active: boolean
  onClick: () => void
  label: string
  icon?: ComponentType<{ className?: string }>
}

function FilterChip({ active, onClick, label, icon: Icon }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-7 items-center gap-1 rounded-full px-3 text-xs font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-accent-soft',
        active
          ? 'bg-accent text-white'
          : 'border border-border bg-paper-secondary text-text-secondary hover:border-border-strong hover:text-text-primary'
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </button>
  )
}
