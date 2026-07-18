import { Suspense, lazy } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { RootLayout } from '@/app/layouts/RootLayout'
import { SandboxLayout } from '@/app/layouts/SandboxLayout'
import { PageLoader } from '@/shared/ui/PageLoader'
import { NotFound } from '@/pages/NotFound'
import { ErrorPage } from '@/pages/ErrorPage'

const Landing = lazy(() => import('@/pages/Landing').then((m) => ({ default: m.Landing })))
const Experiment = lazy(() => import('@/pages/Experiment').then((m) => ({ default: m.Experiment })))
const Sandbox = lazy(() => import('@/pages/Sandbox').then((m) => ({ default: m.Sandbox })))
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })))

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

const router = createBrowserRouter([
  {
    path: '/sandbox',
    element: <SandboxLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: (
          <LazyPage>
            <Sandbox />
          </LazyPage>
        ),
      },
    ],
  },
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: (
          <LazyPage>
            <Landing />
          </LazyPage>
        ),
      },
      {
        path: 'experiment/:category/:experimentId',
        element: (
          <LazyPage>
            <Experiment />
          </LazyPage>
        ),
      },
      {
        path: 'settings',
        element: (
          <LazyPage>
            <Settings />
          </LazyPage>
        ),
      },
      { path: '*', element: <NotFound /> },
    ],
  },
])

export function Router() {
  return <RouterProvider router={router} />
}
