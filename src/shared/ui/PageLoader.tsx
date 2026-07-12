import { FlaskConical } from 'lucide-react'

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-text-secondary">
      <div className="relative">
        <FlaskConical className="h-8 w-8 text-accent" />
        <span className="absolute -bottom-1 -right-1 h-2 w-2 animate-ping rounded-full bg-accent" />
      </div>
      <p className="text-sm">加载中...</p>
    </div>
  )
}
