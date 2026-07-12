import { useContext } from 'react'
import { I18nContext } from '@/app/providers/I18nContext'
import type { I18nContextValue } from '@/app/providers/I18nContext'

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)
  if (context === null) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}
