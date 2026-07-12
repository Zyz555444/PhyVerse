import { ThemeProvider } from '@/app/providers/ThemeProvider'
import { I18nProvider } from '@/app/providers/I18nProvider'
import { Router } from '@/app/router'
import '@/features/experiments'

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <Router />
      </I18nProvider>
    </ThemeProvider>
  )
}
