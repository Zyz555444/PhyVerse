import { ThemeProvider } from '@/app/providers/ThemeProvider'
import { I18nProvider } from '@/app/providers/I18nProvider'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { AuthModal } from '@/features/auth/AuthModal'
import { Router } from '@/app/router'
import '@/features/experiments'

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <Router />
          <AuthModal />
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
