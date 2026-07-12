import { Outlet } from 'react-router-dom'
import { Header } from './Header'

export function RootLayout() {
  return (
    <div className="min-h-screen bg-paper text-text-primary transition-colors">
      <Header />
      <main className="mx-auto max-w-[1200px] px-6">
        <Outlet />
      </main>
    </div>
  )
}
