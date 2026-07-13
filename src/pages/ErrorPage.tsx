import { useRouteError } from 'react-router-dom'

export function ErrorPage(): React.ReactElement {
  const error = useRouteError()

  // Log to console for debugging; route errors often contain useful stack traces.
  console.error('Route error:', error)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <div className="max-w-md space-y-6">
        <h1 className="font-serif text-3xl font-semibold text-text-primary">出错了</h1>
        <p className="text-text-secondary">
          页面渲染遇到问题，请刷新重试。若问题持续存在，请联系开发者 CodeSky（xy122333@outlook.com）
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center rounded-lg bg-accent px-6 py-2.5 font-medium text-white transition-colors hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
        >
          刷新页面
        </button>
      </div>
    </div>
  )
}
