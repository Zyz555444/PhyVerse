import { Outlet } from 'react-router-dom'
import { Header } from './Header'

export function SandboxLayout() {
  return (
    <div className="flex h-screen flex-col bg-paper text-text-primary transition-colors">
      <Header />
      <main className="flex flex-1 flex-col overflow-hidden px-6 py-4">
        <Outlet />
      </main>
    </div>
  )
}
