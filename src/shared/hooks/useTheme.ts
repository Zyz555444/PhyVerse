import { useContext } from 'react'
import { ThemeContext } from '@/app/providers/ThemeContext'
import type { ThemeContextValue } from '@/shared/types/theme'

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (context === null) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
